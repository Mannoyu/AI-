import { deleteHistoryRecord } from "@/lib/history-file";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "缺少记录 ID" }, { status: 400 });
  }

  try {
    await deleteHistoryRecord(id);
    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[History DELETE ${id}] Failed:`, message);
    return Response.json({ error: "删除历史记录失败" }, { status: 500 });
  }
}
