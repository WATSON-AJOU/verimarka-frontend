import { appLogger } from "./logger";

declare global {
  interface Window {
    Sentry?: {
      init: (options: Record<string, unknown>) => void;
      setTag?: (key: string, value: string) => void;
      setUser?: (user: Record<string, unknown> | null) => void;
      captureMessage?: (message: string, context?: Record<string, unknown>) => void;
    };
  }
}

const SENTRY_BROWSER_BUNDLE_URL = "https://browser.sentry-cdn.com/9.18.0/bundle.tracing.min.js";
const SENTRY_BROWSER_BUNDLE_INTEGRITY = "sha384-oCdDUQ/+Aj0VJ9fi4jeZTENsQ35fqB7UuVtGKNxY6Q+eI25KAXKVab5ulE3IygL4";
const SENSITIVE_KEY_PATTERN = /address|authorization|cookie|email|name|password|phone|secret|signature|token/i;

function sanitizeSentryValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeSentryValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
          return [key, "***REDACTED***"];
        }
        return [key, sanitizeSentryValue(item)];
      }),
    );
  }
  return value;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-sentry-src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.integrity = SENTRY_BROWSER_BUNDLE_INTEGRITY;
    script.dataset.sentrySrc = src;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || typeof window === "undefined") return;

  try {
    await loadScript(SENTRY_BROWSER_BUNDLE_URL);
    if (!window.Sentry) {
      throw new Error("Sentry browser bundle did not expose window.Sentry");
    }

    window.Sentry.init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
      release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "0"),
      sendDefaultPii: false,
    });

    appLogger.info("sentry.frontend_initialized", {
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    });
  } catch (error) {
    appLogger.error("sentry.frontend_init_failed", {
      error,
    });
  }
}

export function captureSentryMessage(message: string, context?: Record<string, unknown>) {
  if (!window.Sentry?.captureMessage) return;
  window.Sentry.captureMessage(message, sanitizeSentryValue(context) as Record<string, unknown>);
}
