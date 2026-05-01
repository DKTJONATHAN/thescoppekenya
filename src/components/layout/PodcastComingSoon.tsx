import { Link } from "react-router-dom";
import { Mic, Radio } from "lucide-react";

export function PodcastComingSoon() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 hidden sm:block sm:bottom-6 sm:right-6">
      <Link
        to="/podcast"
        className="pointer-events-auto flex max-w-[260px] items-center gap-3 rounded-lg border border-primary/50 bg-background/95 px-3 py-3 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] group"
        aria-label="Open podcast page"
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></span>
          <Mic className="h-4 w-4 relative z-10" />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Live Now
          </p>
          <p className="truncate text-sm font-medium text-foreground">
            Listen to Za Ndani Weekly
          </p>
        </div>
        <Radio className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:scale-110" />
      </Link>
    </div>
  );
}
