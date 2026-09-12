import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

/** Public VAPID key — override with VITE_VAPID_PUBLIC_KEY at build time */
const VAPID_PUBLIC_KEY =
  (import.meta as { env?: { VITE_VAPID_PUBLIC_KEY?: string } }).env?.VITE_VAPID_PUBLIC_KEY ||
  "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("SW register failed", e);
    return null;
  }
}

async function saveSubscription(sub: PushSubscription): Promise<boolean> {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
  try {
    const res = await fetch("/api/push-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function PushNotificationPrompt() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (!supported) return;

    setPermission(Notification.permission);

    (async () => {
      try {
        const reg = await ensureServiceWorker();
        const existing = await reg?.pushManager.getSubscription();
        if (existing && Notification.permission === "granted") {
          setIsSubscribed(true);
          localStorage.setItem("push_subscribed", "true");
          // Refresh server copy in background
          void saveSubscription(existing);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    const promptDismissed = localStorage.getItem("push_prompt_dismissed");
    const alreadySubscribed = localStorage.getItem("push_subscribed");

    if (!isSubscribed && permission !== "denied" && !promptDismissed && !alreadySubscribed) {
      const timer = setTimeout(() => setShowPrompt(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [isSubscribed, permission]);

  const subscribe = async () => {
    if (!isSupported) return;
    setLoading(true);
    setError("");
    try {
      if (!VAPID_PUBLIC_KEY) {
        setError("Push is not configured yet.");
        return;
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setError("Permission denied.");
        return;
      }

      const reg = await ensureServiceWorker();
      if (!reg) {
        setError("Could not start notifications.");
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      }

      const saved = await saveSubscription(sub);
      if (!saved) {
        setError("Saved on device, but server sync failed. Try again later.");
      }

      setIsSubscribed(true);
      localStorage.setItem("push_subscribed", "true");
      setShowPrompt(false);
    } catch (e) {
      console.error("push subscribe", e);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("push_prompt_dismissed", "true");
  };

  if (!isSupported || isSubscribed || !showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-primary h-1" />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">Breaking news alerts</h4>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Get a notification the moment a new story publishes on Za Ndani.
              </p>
              {error ? <p className="text-red-400 text-xs mt-2">{error}</p> : null}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={subscribe}
                  disabled={loading}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  {loading ? "Enabling…" : "Notify me"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-zinc-500 hover:text-zinc-300" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
