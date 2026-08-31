import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Radio } from "lucide-react";
import { KENYA_WIRE_OUTLETS, type KenyaWireOutlet } from "@/lib/kenya-wire";

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

function loadTwitterScript(): Promise<void> {
  if (window.twttr?.widgets) return Promise.resolve();
  return new Promise((resolve) => {
    const existing = document.querySelector("script[data-kenya-wire]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      if (window.twttr?.widgets) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    script.dataset.kenyaWire = "1";
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

export function XTimeline({ outlet, height = 640 }: { outlet: KenyaWireOutlet; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadTwitterScript().then(() => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      const anchor = document.createElement("a");
      anchor.className = "twitter-timeline";
      anchor.setAttribute("data-height", String(height));
      anchor.setAttribute("data-chrome", "nofooter noborders");
      anchor.href = `https://twitter.com/${outlet.handle}`;
      anchor.textContent = `Posts from @${outlet.handle}`;
      ref.current.appendChild(anchor);
      window.twttr?.widgets.load(ref.current);
    });
    return () => {
      cancelled = true;
    };
  }, [outlet.handle, height]);

  return (
    <div className="border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div>
          <p className="text-sm font-black uppercase tracking-wide">{outlet.name}</p>
          <p className="text-xs text-muted-foreground">@{outlet.handle} · {outlet.note}</p>
        </div>
        <a
          href={`https://x.com/${outlet.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-primary hover:underline"
        >
          Open on X
        </a>
      </div>
      <div ref={ref} className="min-h-[320px] bg-background" />
    </div>
  );
}

export function KenyaWireBoard({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(KENYA_WIRE_OUTLETS[0].handle);
  const outlet = KENYA_WIRE_OUTLETS.find((item) => item.handle === active) || KENYA_WIRE_OUTLETS[0];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3" style={{ scrollbarWidth: "thin" }}>
        {KENYA_WIRE_OUTLETS.map((item) => (
          <button
            key={item.handle}
            type="button"
            onClick={() => setActive(item.handle)}
            className={`flex-shrink-0 text-[11px] font-black uppercase tracking-wider px-3 py-2 border transition-colors ${
              active === item.handle
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <XTimeline outlet={outlet} height={compact ? 520 : 700} />
      <p className="text-[11px] text-muted-foreground mt-3">
        Live timelines are embedded from each outlet’s official X account. They are not Za Ndani reporting.
      </p>
    </div>
  );
}

export function KenyaWireStrip() {
  return (
    <section className="py-4 bg-background border-b border-border/70">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wide">Kenya Wire · Live on X</h2>
          </div>
          <Link to="/live" className="text-xs font-bold text-primary uppercase tracking-wider hover:underline">
            Full board
          </Link>
        </div>
        <KenyaWireBoard compact />
      </div>
    </section>
  );
}
