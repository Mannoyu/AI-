import { readHistory, addHistoryRecord, clearHistory } from "@/lib/history-file";
import type { HistoryRecord } from "@/types";

export async function GET(): Promise<Response> {
  try {
    const records = await readHistory();
    return Response.json({ records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[History GET] Failed:", message);
    return Response.json({ error: "读取历史记录失败" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as HistoryRecord;

    // Basic validation
    if (!body.id || !body.word || !body.articleTitle) {
      return Response.json(
        { error: "缺少必要字段: id, word, articleTitle" },
        { status: 400 }
      );
    }

    const records = await addHistoryRecord(body);
    return Response.json({ record: body, total: records.length }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[History POST] Failed:", message);
    return Response.json({ error: "保存历史记录失败" }, { status: 500 });
  }
}

export async function DELETE(): Promise<Response> {
  try {
    await clearHistory();
    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[History DELETE] Failed:", message);
    return Response.json({ error: "清空历史记录失败" }, { status: 500 });
  }
}
