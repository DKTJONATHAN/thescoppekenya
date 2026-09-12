/**
 * Lightweight client-side error monitoring.
 * Logs to console and optionally posts to a beacon endpoint if configured.
 */

const BEACON =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_ERROR_BEACON?: string } }).env?.VITE_ERROR_BEACON) ||
  "";

export type ErrorReport = {
  message: string;
  stack?: string;
  source?: string;
  url?: string;
  userAgent?: string;
  ts: number;
  extra?: Record<string, unknown>;
};

function buildReport(
  err: unknown,
  source = "unknown",
  extra?: Record<string, unknown>
): ErrorReport {
  const e = err instanceof Error ? err : new Error(String(err));
  return {
    message: e.message || String(err),
    stack: e.stack,
    source,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    ts: Date.now(),
    extra,
  };
}

/** Accept either reportError(err, "source") or reportError(err, { source, ...extra }). */
export function reportError(
  err: unknown,
  sourceOrOpts: string | Record<string, unknown> = "app",
  extra?: Record<string, unknown>
): void {
  let source = "app";
  let more: Record<string, unknown> | undefined = extra;
  if (typeof sourceOrOpts === "string") {
    source = sourceOrOpts;
  } else if (sourceOrOpts && typeof sourceOrOpts === "object") {
    const opts = sourceOrOpts as Record<string, unknown>;
    source = typeof opts.source === "string" ? opts.source : "app";
    const { source: _s, ...rest } = opts;
    more = { ...rest, ...extra };
  }
  const report = buildReport(err, source, more);
  try {
    console.error(`[zn-error:${source}]`, report.message, report);
  } catch {
    /* ignore */
  }
  if (BEACON && typeof navigator !== "undefined" && navigator.sendBeacon) {
    try {
      const blob = new Blob([JSON.stringify(report)], { type: "application/json" });
      navigator.sendBeacon(BEACON, blob);
    } catch {
      /* ignore */
    }
  }
}

export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (event) => {
    reportError(event.error || event.message, "window.onerror", {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, "unhandledrejection");
  });
}
