/** Lightweight error reporter — posts to /api when available, always logs. */

type ErrorPayload = {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  extra?: Record<string, unknown>;
  ts: string;
};

const QUEUE_KEY = "zn-error-queue";

function enqueue(payload: ErrorPayload) {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const list: ErrorPayload[] = raw ? JSON.parse(raw) : [];
    list.push(payload);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-30)));
  } catch {
    /* ignore */
  }
}

export function reportError(error: unknown, extra?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error));
  const payload: ErrorPayload = {
    message: err.message,
    stack: err.stack,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    extra,
    ts: new Date().toISOString(),
  };

  console.error("[zn-monitor]", payload);
  enqueue(payload);

  // Best-effort beacon (no-op if endpoint missing)
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/client-error",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
    } else if (typeof fetch !== "undefined") {
      void fetch("/api/client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

export function installGlobalErrorHandlers() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (e) => {
    reportError(e.error || e.message, { source: "window.error" });
  });
  window.addEventListener("unhandledrejection", (e) => {
    reportError(e.reason, { source: "unhandledrejection" });
  });
}
