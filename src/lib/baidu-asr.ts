/**
 * Server-side helper for Baidu speech recognition.
 */

const TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";
const ASR_URL = "https://vop.baidu.com/server_api";
const TOKEN_REFRESH_BUFFER_MS = 60 * 60 * 1000;
const DEFAULT_TOKEN_TTL_SECONDS = 2_592_000;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let tokenRequestPromise: Promise<string> | null = null;

export interface BaiduAsrResult {
  err_no: number;
  err_msg?: string;
  result?: string[];
}

function truncateText(value: string, maxLength = 300): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}

async function parseJsonResponse<T>(
  response: Response,
  label: string
): Promise<T> {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `${label} returned invalid JSON${text ? `: ${truncateText(text)}` : ""}`
    );
  }
}

async function requestAccessToken(
  apiKey: string,
  secretKey: string
): Promise<string> {
  const url = `${TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  const data = await parseJsonResponse<{
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  }>(response, "Baidu token API");

  if (!response.ok) {
    throw new Error(
      `Baidu token request failed: ${response.status}${
        data.error ? ` (${data.error})` : ""
      }`
    );
  }

  if (data.error) {
    throw new Error(`Baidu auth error: ${data.error} - ${data.error_description}`);
  }
  if (!data.access_token) {
    throw new Error("Baidu token response missing access_token");
  }

  cachedToken = data.access_token;
  tokenExpiresAt =
    Date.now() + (data.expires_in ?? DEFAULT_TOKEN_TTL_SECONDS) * 1000;

  return cachedToken;
}

async function getAccessToken(
  apiKey: string,
  secretKey: string
): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken;
  }

  if (!tokenRequestPromise) {
    tokenRequestPromise = requestAccessToken(apiKey, secretKey).finally(() => {
      tokenRequestPromise = null;
    });
  }

  return tokenRequestPromise;
}

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

  if (audioBuffer.byteLength === 0) {
    throw new Error("Audio buffer is empty");
  }

  if (!["pcm", "wav"].includes(format)) {
    throw new Error(`Unsupported audio format: ${format}`);
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Invalid sample rate: ${rate}`);
  }

  const token = await getAccessToken(apiKey, secretKey);
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

  console.log(
    `[Baidu ASR] Sending audio: ${audioBuffer.byteLength} bytes, format=${format}, rate=${rate}`
  );

  const response = await fetch(ASR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error(`[Baidu ASR] HTTP ${response.status}: ${errText.slice(0, 300)}`);
    throw new Error(`Baidu ASR request failed: ${response.status}`);
  }

  const data = await parseJsonResponse<BaiduAsrResult>(response, "Baidu ASR");
  console.log(
    `[Baidu ASR] Response err_no=${data.err_no}, err_msg="${data.err_msg || ""}", resultCount=${Array.isArray(data.result) ? data.result.length : 0}`
  );

  if (data.err_no !== 0) {
    throw new Error(`Baidu ASR error [${data.err_no}]: ${data.err_msg || "unknown"}`);
  }

  return data;
}
