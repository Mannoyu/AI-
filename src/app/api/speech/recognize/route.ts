import { recognizeSpeech } from "@/lib/baidu-asr";

export async function POST(request: Request) {
  const apiKey = process.env.BAIDU_ASR_API_KEY;
  const secretKey = process.env.BAIDU_ASR_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return Response.json(
      { error: "百度语音识别凭证未配置，请在 .env.local 中设置 BAIDU_ASR_API_KEY 和 BAIDU_ASR_SECRET_KEY" },
      { status: 500 }
    );
  }

  let audioBuffer: Buffer;

  try {
    const arrayBuffer = await request.arrayBuffer();
    console.log(`[ASR] Received audio: ${arrayBuffer.byteLength} bytes`);
    if (arrayBuffer.byteLength === 0) {
      return Response.json(
        { error: "未收到音频数据" },
        { status: 400 }
      );
    }
    audioBuffer = Buffer.from(arrayBuffer);
  } catch {
    return Response.json(
      { error: "音频数据格式错误" },
      { status: 400 }
    );
  }

  try {
    const result = await recognizeSpeech(audioBuffer, {
      apiKey,
      secretKey,
      format: "wav",
      rate: 16000,
    });

    // Baidu ASR returns "result" as string[], use first element or join all
    const text = Array.isArray(result.result) && result.result.length > 0
      ? result.result.join(" ")
      : "";

    return Response.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Baidu ASR] Recognition failed:", message);
    return Response.json(
      { error: `语音识别失败: ${message}` },
      { status: 502 }
    );
  }
}
