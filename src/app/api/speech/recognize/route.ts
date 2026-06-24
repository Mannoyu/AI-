import {
  apiError,
  apiSuccess,
  createApiContext,
  logApiEvent,
  summarizeError,
} from "@/app/api/_utils/response";
import { recognizeSpeech } from "@/lib/baidu-asr";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const SUPPORTED_AUDIO_TYPES = [
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "application/octet-stream",
] as const;

function isSupportedAudioType(contentType: string | null): boolean {
  if (!contentType) {
    return true;
  }

  const normalized = contentType.toLowerCase();
  return SUPPORTED_AUDIO_TYPES.some((type) => normalized.startsWith(type));
}

export async function POST(request: Request) {
  const context = createApiContext(request);
  const apiKey = process.env.BAIDU_ASR_API_KEY?.trim();
  const secretKey = process.env.BAIDU_ASR_SECRET_KEY?.trim();

  if (!apiKey || !secretKey) {
    logApiEvent(context, "error", "Baidu ASR credentials are missing");

    return apiError(context, {
      status: 500,
      code: "ASR_MISCONFIGURED",
      message:
        "百度语音识别服务未配置，请检查 BAIDU_ASR_API_KEY 和 BAIDU_ASR_SECRET_KEY。",
    });
  }

  const contentType = request.headers.get("content-type");
  if (!isSupportedAudioType(contentType)) {
    logApiEvent(context, "warn", "Unsupported audio content type", {
      contentType,
    });

    return apiError(context, {
      status: 415,
      code: "UNSUPPORTED_AUDIO_TYPE",
      message: "仅支持 WAV 音频数据。",
    });
  }

  let audioBuffer: Buffer;

  try {
    const arrayBuffer = await request.arrayBuffer();

    logApiEvent(context, "info", "Received audio payload", {
      bytes: arrayBuffer.byteLength,
      contentType: contentType || "unknown",
    });

    if (arrayBuffer.byteLength === 0) {
      return apiError(context, {
        status: 400,
        code: "EMPTY_AUDIO",
        message: "未接收到音频数据。",
      });
    }

    if (arrayBuffer.byteLength > MAX_AUDIO_BYTES) {
      return apiError(context, {
        status: 413,
        code: "AUDIO_TOO_LARGE",
        message: "音频数据过大，请缩短录音后重试。",
      });
    }

    audioBuffer = Buffer.from(arrayBuffer);
  } catch (err) {
    logApiEvent(context, "warn", "Failed to read audio payload", {
      error: summarizeError(err),
    });

    return apiError(context, {
      status: 400,
      code: "INVALID_AUDIO_PAYLOAD",
      message: "音频数据读取失败，请重新录音后再试。",
    });
  }

  try {
    const result = await recognizeSpeech(audioBuffer, {
      apiKey,
      secretKey,
      format: "wav",
      rate: 16000,
    });

    const text = Array.isArray(result.result) ? result.result.join(" ").trim() : "";

    logApiEvent(context, "info", "Speech recognized", {
      bytes: audioBuffer.byteLength,
      transcriptLength: text.length,
    });

    return apiSuccess(context, { text });
  } catch (err) {
    const message = summarizeError(err);
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";

    logApiEvent(context, "error", "Speech recognition failed", {
      error: message,
    });

    return apiError(context, {
      status: isTimeout ? 504 : 502,
      code: isTimeout ? "ASR_TIMEOUT" : "ASR_UPSTREAM_ERROR",
      message: isTimeout
        ? "语音识别服务超时，请稍后重试。"
        : "语音识别失败，请稍后重试。",
    });
  }
}
