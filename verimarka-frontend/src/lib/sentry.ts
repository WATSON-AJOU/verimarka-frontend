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
      sendDefaultPii: true,
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
  window.Sentry.captureMessage(message, context);
}
