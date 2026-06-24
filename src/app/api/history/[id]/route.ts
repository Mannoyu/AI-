import {
  apiError,
  apiSuccess,
  createApiContext,
  logApiEvent,
  summarizeError,
} from "@/app/api/_utils/response";
import { deleteHistoryRecord } from "@/lib/history-file";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const context = createApiContext(request);
  const { id: rawId } = await params;
  const id = rawId.trim();

  if (!id) {
    logApiEvent(context, "warn", "History delete request missing id");

    return apiError(context, {
      status: 400,
      code: "INVALID_HISTORY_ID",
      message: "缺少有效的学习记录 ID。",
    });
  }

  try {
    await deleteHistoryRecord(id);

    logApiEvent(context, "info", "Deleted history record", { id });

    return apiSuccess(context, { success: true, id });
  } catch (err) {
    logApiEvent(context, "error", "Failed to delete history record", {
      id,
      error: summarizeError(err),
    });

    return apiError(context, {
      status: 500,
      code: "HISTORY_DELETE_FAILED",
      message: "删除学习记录失败，请稍后重试。",
    });
  }
}
