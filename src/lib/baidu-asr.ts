/**
 * Baidu ASR (语音识别) server-side utility.
 *
 * Flow:
 *   1. Get access_token via OAuth client credentials
 *   2. POST audio (base64 WAV/PCM) to Baidu ASR endpoint
 *   3. Return recognized text
 */

const TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";
const ASR_URL = "https://vop.baidu.com/server_api";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export interface BaiduAsrResult {
  /** Error code (0 = success) */
  err_no: number;
  /** Error message if err_no !== 0 */
  err_msg?: string;
  /** Recognized text segments (primary field from Baidu) */
  result?: string[];
}

async function getAccessToken(apiKey: string, secretKey: string): Promise<string> {
  // Return cached token if still valid (with 1 hour buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 3600_000) {
    return cachedToken;
  }

  const url = `${TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Baidu token request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (data.error) {
    throw new Error(`Baidu auth error: ${data.error} — ${data.error_description}`);
  }
  if (!data.access_token) {
    throw new Error("Baidu token response missing access_token");
  }

  cachedToken = data.access_token;
  // expires_in is seconds, convert to absolute ms timestamp
  tokenExpiresAt = Date.now() + (data.expires_in ?? 2592000) * 1000;

  return cachedToken;
}

/**
 * Call Baidu ASR to recognize speech from raw audio buffer.
 *
 * @param audioBuffer - Raw PCM or WAV audio data
 * @param format - Audio format ("pcm" | "wav"), default "wav"
 * @param rate - Sample rate in Hz, default 16000
 */
export async function recognizeSpeech(
  audioBuffer: Buffer,
  options: {
    apiKey: string;
    secretKey: string;
    format?: "pcm" | "wav";
    rate?: number;
  }
): Promise<BaiduAsrResult> {
  const { apiKey, secretKey, format = "wav", rate = 16000 } = options;

  const token = await getAccessToken(apiKey, secretKey);

  // Base64 encode the audio
  const speech = audioBuffer.toString("base64");

  const body = JSON.stringify({
    format,
    rate,
    channel: 1,
    cuid: "eng-reader",
    token,
    speech,
    len: audioBuffer.byteLength,
  });

  console.log(`[Baidu ASR] Sending audio: ${audioBuffer.byteLength} bytes, format=${format}, rate=${rate}`);

  const response = await fetch(ASR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error(`[Baidu ASR] HTTP ${response.status}: ${errText.slice(0, 300)}`);
    throw new Error(`Baidu ASR request failed: ${response.status}`);
  }

  const data = (await response.json()) as BaiduAsrResult;
  console.log(`[Baidu ASR] Response — err_no=${data.err_no}, err_msg="${data.err_msg || ""}", result=${JSON.stringify(data.result)}`);

  if (data.err_no !== 0) {
    throw new Error(`Baidu ASR error [${data.err_no}]: ${data.err_msg || "unknown"}`);
  }

  return data;
}
