type LogLevel = "info" | "warn" | "error";

export interface ApiContext {
  requestId: string;
  method: string;
  pathname: string;
  startedAt: number;
}

interface ApiErrorOptions {
  status: number;
  code: string;
  message: string;
}

export function createApiContext(request: Request): ApiContext {
  const requestId =
    request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
  const { pathname } = new URL(request.url);

  return {
    requestId,
    method: request.method,
    pathname,
    startedAt: Date.now(),
  };
}

export function apiSuccess<T extends object>(
  context: ApiContext,
  body: T,
  init?: ResponseInit
): Response {
  return Response.json(
    {
      ok: true,
      requestId: context.requestId,
      ...body,
    },
    init
  );
}

export function apiError(
  context: ApiContext,
  options: ApiErrorOptions
): Response {
  return Response.json(
    {
      ok: false,
      requestId: context.requestId,
      code: options.code,
      error: options.message,
    },
    { status: options.status }
  );
}

export function logApiEvent(
  context: ApiContext,
  level: LogLevel,
  message: string,
  details?: Record<string, unknown>
): void {
  const durationMs = Date.now() - context.startedAt;
  const prefix = `[API][${context.requestId}][${context.method} ${context.pathname}][${durationMs}ms] ${message}`;

  if (details && Object.keys(details).length > 0) {
    console[level](prefix, details);
    return;
  }

  console[level](prefix);
}

export function summarizeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return "Unknown error";
}

export function truncateText(value: string, maxLength = 300): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
