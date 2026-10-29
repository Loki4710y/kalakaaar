/**
 * Lightweight error reporting.
 * - If NEXT_PUBLIC_SENTRY_DSN is set, errors go to Sentry (loaded lazily, so zero cost when off).
 * - Otherwise they are only logged to the console.
 * Never throws: monitoring must not break the app.
 */
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "";

export const MONITORING_ENABLED = Boolean(DSN);

let sentryPromise: Promise<typeof import("@sentry/browser")> | null = null;

function loadSentry() {
  if (!sentryPromise) {
    sentryPromise = import("@sentry/browser").then((Sentry) => {
      Sentry.init({
        dsn: DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0,
        sendDefaultPii: false,
        // Drop noise we cannot act on.
        ignoreErrors: ["ResizeObserver loop", "Non-Error promise rejection captured", "NetworkError", "Failed to fetch", "Load failed"],
      });
      return Sentry;
    });
  }
  return sentryPromise;
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  try {
    if (process.env.NODE_ENV !== "production") console.error("[error]", error, context || "");
    if (!MONITORING_ENABLED || typeof window === "undefined") return;
    loadSentry()
      .then((Sentry) => Sentry.captureException(error, { extra: context }))
      .catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Call once on the client to catch errors that React error boundaries don't see. */
export function installGlobalErrorHandlers(): () => void {
  if (typeof window === "undefined") return () => {};
  const onError = (e: ErrorEvent) => reportError(e.error || e.message, { source: "window.onerror" });
  const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason, { source: "unhandledrejection" });
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
