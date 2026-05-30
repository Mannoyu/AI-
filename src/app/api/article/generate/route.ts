import type { Article } from "@/types";

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `你是一个英语教学专家。根据用户提供的单词和英语等级，生成一篇英文文章。

要求：
1. 文章自然流畅，该单词在文章中至少出现 3-5 次，每次体现不同语义
2. 用 **{word}** 标记目标单词的每次出现
3. 根据等级调整词汇量和句式复杂度：
   - beginner：高中词汇、简单句、80-120词
   - intermediate：四级词汇、复合句、150-200词
   - advanced：六级+词汇、复杂句式、200-300词
4. 文章末尾附上该单词在文中出现的各语义解释（中文）

返回严格的 JSON 格式，不要包含 markdown 代码块标记：
{
  "title": "文章标题",
  "content": "markdown 格式，目标词用 **加粗**",
  "meanings": [
    { "meaning": "中文解释", "partOfSpeech": "词性", "example": "文中原句" }
  ],
  "difficulty": "beginner | intermediate | advanced",
  "wordCount": 150
}`;

function buildUserPrompt(word: string, level: string): string {
  const levelDescriptions: Record<string, string> = {
    beginner: "初级（请使用高中词汇、简单句，文章 80-120 词）",
    intermediate: "中级（请使用四级词汇、复合句，文章 150-200 词）",
    advanced: "高级（请使用六级+词汇、复杂句式，文章 200-300 词）",
  };
  const levelDesc = levelDescriptions[level] || levelDescriptions.intermediate;
  return `请为单词 "${word}" 生成一篇多语义英语学习文章。难度等级：${levelDesc}。`;
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "DEEPSEEK_API_KEY 未配置，请在 .env.local 中设置" },
      { status: 500 }
    );
  }

  let word: string;
  let level: string;

  try {
    const body = await request.json();
    word = (body.word || "").trim();
    level = body.level || "intermediate";
  } catch {
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }

  if (!word) {
    return Response.json({ error: "请提供单词" }, { status: 400 });
  }

  // Validate level
  const validLevels = ["beginner", "intermediate", "advanced"];
  if (!validLevels.includes(level)) {
    level = "intermediate";
  }

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
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`[DeepSeek API] ${response.status}: ${errorText}`);
      return Response.json(
        { error: `AI 服务返回错误 (${response.status})，请稍后重试` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[DeepSeek API] Empty response content", data);
      return Response.json(
        { error: "AI 返回了空内容，请重试" },
        { status: 502 }
      );
    }

    // Parse the JSON from the content
    let article: Article;
    try {
      article = JSON.parse(content.trim()) as Article;
    } catch {
      console.error("[DeepSeek API] Failed to parse JSON:", content.slice(0, 200));
      return Response.json(
        { error: "AI 返回格式异常，请重试" },
        { status: 502 }
      );
    }

    // Validate required fields
    if (!article.title || !article.content || !Array.isArray(article.meanings)) {
      return Response.json(
        { error: "AI 返回数据不完整，请重试" },
        { status: 502 }
      );
    }

    // Ensure wordCount and difficulty are set
    article.difficulty = article.difficulty || (level as Article["difficulty"]);
    article.wordCount = article.wordCount || article.content.split(/\s+/).length;

    return Response.json(article);
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return Response.json(
        { error: "AI 服务请求超时（30s），请稍后重试" },
        { status: 504 }
      );
    }
    console.error("[DeepSeek API] Unexpected error:", err);
    return Response.json(
      { error: "服务异常，请稍后重试" },
      { status: 500 }
    );
  }
}
