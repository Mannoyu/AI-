import {
  apiError,
  apiSuccess,
  createApiContext,
  isNonEmptyString,
  isRecord,
  logApiEvent,
  summarizeError,
} from "@/app/api/_utils/response";
import { addHistoryRecord, clearHistory, readHistory } from "@/lib/history-file";
import type { Difficulty, HistoryRecord } from "@/types";

const VALID_DIFFICULTIES: Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isNonEmptyString)
    .map((item) => item.trim());
}

function normalizeDifficulty(value: unknown): Difficulty | undefined {
  return VALID_DIFFICULTIES.includes(value as Difficulty)
    ? (value as Difficulty)
    : undefined;
}

function normalizeMeanings(value: unknown): HistoryRecord["meanings"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      meaning: normalizeString(item.meaning),
      partOfSpeech: normalizeString(item.partOfSpeech),
      example: normalizeString(item.example),
    }))
    .filter((item) => item.meaning && item.partOfSpeech && item.example);
}

function normalizeHistoryRecord(value: unknown): HistoryRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeString(value.id);
  const readerId = normalizeString(value.readerId);
  const word = normalizeString(value.word);
  const articleTitle = normalizeString(value.articleTitle);
  const articleContent = normalizeString(value.articleContent);
  const articleDifficulty = normalizeDifficulty(value.articleDifficulty);
  const meanings = normalizeMeanings(value.meanings);
  const incorrectWords = normalizeStringList(value.incorrectWords);
  const score =
    typeof value.pronunciationScore === "number" &&
    Number.isFinite(value.pronunciationScore)
      ? Math.max(0, Math.min(100, Math.round(value.pronunciationScore)))
      : NaN;
  const createdAt = normalizeString(value.createdAt);

  if (
    !id ||
    !readerId ||
    !word ||
    !articleTitle ||
    !articleContent ||
    !Number.isFinite(score)
  ) {
    return null;
  }

  return {
    id,
    readerId,
    word,
    articleTitle,
    articleContent,
    articleDifficulty,
    meanings,
    pronunciationScore: score,
    incorrectWords,
    createdAt: createdAt || new Date().toISOString(),
  };
}

export async function GET(request: Request): Promise<Response> {
  const context = createApiContext(request);

  try {
    const records = await readHistory();

    logApiEvent(context, "info", "Loaded history records", {
      count: Array.isArray(records) ? records.length : 0,
    });

    return apiSuccess(context, {
      records: Array.isArray(records) ? records : [],
    });
  } catch (err) {
    logApiEvent(context, "error", "Failed to load history records", {
      error: summarizeError(err),
    });

    return apiError(context, {
      status: 500,
      code: "HISTORY_READ_FAILED",
      message: "读取学习记录失败，请稍后重试。",
    });
  }
}

export async function POST(request: Request): Promise<Response> {
  const context = createApiContext(request);
  let body: unknown;

  try {
    body = await request.json();
  } catch (err) {
    logApiEvent(context, "warn", "History record payload is not valid JSON", {
      error: summarizeError(err),
    });

    return apiError(context, {
      status: 400,
      code: "INVALID_JSON",
      message: "请求体必须是合法的 JSON。",
    });
  }

  const record = normalizeHistoryRecord(body);

  if (!record) {
    logApiEvent(context, "warn", "History record payload failed validation");

    return apiError(context, {
      status: 400,
      code: "INVALID_HISTORY_RECORD",
      message: "学习记录缺少必要字段，或字段格式不合法。",
    });
  }

  try {
    const records = await addHistoryRecord(record);

    logApiEvent(context, "info", "Saved history record", {
      id: record.id,
      total: records.length,
    });

    return apiSuccess(context, { record, total: records.length }, { status: 201 });
  } catch (err) {
    logApiEvent(context, "error", "Failed to save history record", {
      id: record.id,
      error: summarizeError(err),
    });

    return apiError(context, {
      status: 500,
      code: "HISTORY_WRITE_FAILED",
      message: "保存学习记录失败，请稍后重试。",
    });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const context = createApiContext(request);

  try {
    await clearHistory();

    logApiEvent(context, "info", "Cleared history records");

    return apiSuccess(context, { success: true });
  } catch (err) {
    logApiEvent(context, "error", "Failed to clear history records", {
      error: summarizeError(err),
    });

    return apiError(context, {
      status: 500,
      code: "HISTORY_CLEAR_FAILED",
      message: "清空学习记录失败，请稍后重试。",
    });
  }
}
