import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { KENYA_WIRE_OUTLETS, type KenyaWireOutlet } from "@/lib/kenya-wire";

function avatarUrl(handle: string) {
  return `https://unavatar.io/twitter/${encodeURIComponent(handle)}?fallback=https://zandani.co.ke/logo.png`;
}

function embedSrc(handle: string, theme: "light" | "dark") {
  const params = new URLSearchParams({
    dnt: "true",
    embedId: `kenya-wire-${handle}`,
    showReplies: "false",
    lang: "en",
    theme,
  });
  return `https://syndication.twitter.com/srv/timeline-profile/screen-name/${encodeURIComponent(handle)}?${params.toString()}`;
}

export function XTimeline({ outlet, height = 720 }: { outlet: KenyaWireOutlet; height?: number }) {
  const theme = useMemo(() => {
    if (typeof document === "undefined") return "dark" as const;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }, [outlet.handle]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-3 min-w-0">
          <img src={avatarUrl(outlet.handle)} alt="" className="w-10 h-10 rounded-full object-cover bg-zinc-800" />
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate">{outlet.name}</p>
            <p className="text-xs text-zinc-400 truncate">@{outlet.handle} · {outlet.note}</p>
          </div>
        </div>
        <a
          href={`https://x.com/${outlet.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300"
        >
          Open X <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <iframe
        key={`${outlet.handle}-${theme}`}
        title={`${outlet.name} live posts on X`}
        src={embedSrc(outlet.handle, theme)}
        height={height}
        className="w-full bg-black"
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allow="encrypted-media; fullscreen"
      />
    </div>
  );
}

export function KenyaWireBoard({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(KENYA_WIRE_OUTLETS[0].handle);
  const outlet = KENYA_WIRE_OUTLETS.find((item) => item.handle === active) || KENYA_WIRE_OUTLETS[0];

  useEffect(() => {
    const id = window.setTimeout(() => setActive((current) => current), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-4 lg:gap-6">
      <aside className="lg:sticky lg:top-28 h-fit">
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {KENYA_WIRE_OUTLETS.map((item) => {
            const selected = item.handle === active;
            return (
              <button
                key={item.handle}
                type="button"
                onClick={() => setActive(item.handle)}
                className={`flex-shrink-0 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? "border-sky-400 bg-sky-400/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${item.accent}`} />
                <img src={avatarUrl(item.handle)} alt="" className="w-8 h-8 rounded-full object-cover hidden sm:block" />
                <span className="min-w-0">
                  <span className="block text-xs font-black uppercase tracking-wide truncate">{item.name}</span>
                  <span className="block text-[11px] text-zinc-500 truncate">@{item.handle}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
      <XTimeline outlet={outlet} height={compact ? 560 : 740} />
    </div>
  );
}

export function KenyaWireStrip() {
  return (
    <section className="py-6 bg-zinc-950 border-y border-zinc-800">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <Radio className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-black uppercase tracking-wide">Kenya Wire</h2>
          </div>
          <Link to="/live" className="text-xs font-bold text-sky-400 uppercase tracking-wider hover:underline">
            Full board
          </Link>
        </div>
        <KenyaWireBoard compact />
      </div>
    </section>
  );
}
