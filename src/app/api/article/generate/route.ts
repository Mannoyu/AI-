import {
  apiError,
  apiSuccess,
  createApiContext,
  isNonEmptyString,
  isRecord,
  logApiEvent,
  summarizeError,
  truncateText,
} from "@/app/api/_utils/response";
import type { Article } from "@/types";

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";
const VALID_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const DEFAULT_LEVEL: Article["difficulty"] = "intermediate";
const MAX_WORD_LENGTH = 64;

const SYSTEM_PROMPT = `
你是一名英语学习内容助手。请根据用户提供的英文单词和难度等级，生成一篇英语学习文章。

要求：
1. 文章自然流畅，目标单词至少出现 3-5 次，并体现不同词义或不同语境。
2. 目标单词每次出现时，都必须使用 **word** 这种 Markdown 粗体形式标记。
3. 根据难度控制词汇量和句式复杂度：
   - beginner: 高中词汇与简单句，80-120 词
   - intermediate: 四六级词汇与复合句，150-200 词
   - advanced: 更复杂的词汇和句式，200-300 词
4. meanings 数组需要列出文章里使用到的不同词义，每项包含中文释义、词性和文中原句。

请严格返回 JSON，不要返回 Markdown 代码块：
{
  "title": "文章标题",
  "content": "markdown 格式正文，目标词用 **粗体** 标记",
  "meanings": [
    { "meaning": "中文释义", "partOfSpeech": "词性", "example": "文中原句" }
  ],
  "difficulty": "beginner | intermediate | advanced",
  "wordCount": 150
}
`.trim();

function normalizeLevel(value: unknown): Article["difficulty"] {
  return VALID_LEVELS.includes(value as Article["difficulty"])
    ? (value as Article["difficulty"])
    : DEFAULT_LEVEL;
}

function normalizeWord(value: unknown): string | null {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const word = value.trim();

  if (word.length > MAX_WORD_LENGTH) {
    return null;
  }

  return word;
}

function buildUserPrompt(word: string, level: Article["difficulty"]): string {
  const levelDescriptions: Record<Article["difficulty"], string> = {
    beginner: "初级：高中词汇、简单句，80-120 词",
    intermediate: "中级：四六级词汇、复合句，150-200 词",
    advanced: "高级：更复杂的词汇和句式，200-300 词",
  };

  return `请围绕单词 "${word}" 生成一篇英语学习文章。难度：${levelDescriptions[level]}。`;
}

function countWords(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

function normalizeMeanings(value: unknown): Article["meanings"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      meaning: typeof item.meaning === "string" ? item.meaning.trim() : "",
      partOfSpeech:
        typeof item.partOfSpeech === "string" ? item.partOfSpeech.trim() : "",
      example: typeof item.example === "string" ? item.example.trim() : "",
    }))
    .filter((item) => item.meaning && item.partOfSpeech && item.example);
}

function normalizeArticle(
  value: unknown,
  fallbackDifficulty: Article["difficulty"]
): Article | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = typeof value.title === "string" ? value.title.trim() : "";
  const content = typeof value.content === "string" ? value.content.trim() : "";
  const meanings = normalizeMeanings(value.meanings);
  const difficulty = normalizeLevel(value.difficulty);
  const wordCount =
    typeof value.wordCount === "number" && Number.isFinite(value.wordCount)
      ? Math.max(1, Math.round(value.wordCount))
      : countWords(content);

  if (!title || !content || meanings.length === 0) {
    return null;
  }

  return {
    title,
    content,
    meanings,
    difficulty: difficulty || fallbackDifficulty,
    wordCount,
  };
}

function extractUpstreamContent(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.choices)) {
    return null;
  }

  const firstChoice = value.choices[0];

  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return null;
  }

  return typeof firstChoice.message.content === "string"
    ? firstChoice.message.content
    : null;
}

export async function POST(request: Request) {
  const context = createApiContext(request);
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    logApiEvent(context, "error", "DeepSeek API key is missing");

    return apiError(context, {
      status: 500,
      code: "ARTICLE_MISCONFIGURED",
      message: "文章生成服务未配置，请检查 DEEPSEEK_API_KEY。",
    });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (err) {
    logApiEvent(context, "warn", "Article request payload is not valid JSON", {
      error: summarizeError(err),
    });

    return apiError(context, {
      status: 400,
      code: "INVALID_JSON",
      message: "请求体必须是合法的 JSON。",
    });
  }

  if (!isRecord(body)) {
    return apiError(context, {
      status: 400,
      code: "INVALID_REQUEST_BODY",
      message: "请求体必须是对象结构。",
    });
  }

  const word = normalizeWord(body.word);
  if (!word) {
    logApiEvent(context, "warn", "Article request missing valid word");

    return apiError(context, {
      status: 400,
      code: "INVALID_WORD",
      message: "请提供 1 到 64 个字符的目标单词。",
    });
  }

  const level = normalizeLevel(body.level);

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(word, level) },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const errorText = truncateText(await response.text().catch(() => ""));
      logApiEvent(context, "error", "DeepSeek request failed", {
        status: response.status,
        body: errorText || undefined,
      });

      return apiError(context, {
        status: 502,
        code: "ARTICLE_UPSTREAM_ERROR",
        message: `文章生成服务返回错误 (${response.status})，请稍后重试。`,
      });
    }

    const data = (await response.json()) as unknown;
    const content = extractUpstreamContent(data);
    if (!content) {
      logApiEvent(context, "error", "DeepSeek response missing content");

      return apiError(context, {
        status: 502,
        code: "ARTICLE_EMPTY_RESPONSE",
        message: "文章生成服务返回了空内容，请稍后重试。",
      });
    }

    let parsedContent: unknown;

    try {
      parsedContent = JSON.parse(content.trim()) as unknown;
    } catch (err) {
      logApiEvent(context, "error", "DeepSeek returned invalid JSON", {
        error: summarizeError(err),
        preview: truncateText(content, 200),
      });

      return apiError(context, {
        status: 502,
        code: "ARTICLE_INVALID_RESPONSE",
        message: "文章生成服务返回格式异常，请稍后重试。",
      });
    }

    const article = normalizeArticle(parsedContent, level);

    if (!article) {
      logApiEvent(context, "error", "DeepSeek response failed validation", {
        preview: truncateText(content, 200),
      });

      return apiError(context, {
        status: 502,
        code: "ARTICLE_INVALID_SHAPE",
        message: "文章生成服务返回数据不完整，请稍后重试。",
      });
    }

    logApiEvent(context, "info", "Generated article", {
      word,
      difficulty: article.difficulty,
      wordCount: article.wordCount,
      meanings: article.meanings.length,
    });

    return apiSuccess(context, article);
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      logApiEvent(context, "error", "DeepSeek request timed out");

      return apiError(context, {
        status: 504,
        code: "ARTICLE_TIMEOUT",
        message: "文章生成服务超时，请稍后重试。",
      });
    }

    logApiEvent(context, "error", "Unexpected article generation error", {
      error: summarizeError(err),
    });

    return apiError(context, {
      status: 500,
      code: "ARTICLE_INTERNAL_ERROR",
      message: "文章生成服务异常，请稍后重试。",
    });
  }
}
