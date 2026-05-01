type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const isConsoleLoggingEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_CLIENT_LOGS === "true";

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, item]) => {
      const lowered = key.toLowerCase();
      if (
        lowered.includes("password") ||
        lowered.includes("token") ||
        lowered.includes("authorization") ||
        lowered.includes("secret") ||
        lowered.includes("signature")
      ) {
        acc[key] = "***REDACTED***";
        return acc;
      }

      acc[key] = redactValue(item);
      return acc;
    }, {});
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}

function buildPayload(context?: LogContext) {
  if (!context) return undefined;
  return redactValue(context);
}

export function createClientRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replaceAll("-", "");
  }

  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
}

export function logEvent(level: LogLevel, event: string, context?: LogContext) {
  if (!isConsoleLoggingEnabled) {
    return;
  }

  const payload = buildPayload(context);
  const logger = console[level] ?? console.log;

  if (payload) {
    logger(`[verimarka] ${event}`, payload);
    return;
  }

  logger(`[verimarka] ${event}`);
}

export const appLogger = {
  debug: (event: string, context?: LogContext) => logEvent("debug", event, context),
  info: (event: string, context?: LogContext) => logEvent("info", event, context),
  warn: (event: string, context?: LogContext) => logEvent("warn", event, context),
  error: (event: string, context?: LogContext) => logEvent("error", event, context),
};
