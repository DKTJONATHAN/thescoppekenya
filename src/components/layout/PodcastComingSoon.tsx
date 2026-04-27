import { Link } from "react-router-dom";
import { Mic, Radio } from "lucide-react";

export function PodcastComingSoon() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      <Link
        to="/podcast"
        className="pointer-events-auto flex max-w-[260px] items-center gap-3 rounded-lg border border-primary/25 bg-background/95 px-3 py-3 shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl"
        aria-label="Open podcast page"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Mic className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            Podcast Coming Soon
          </p>
          <p className="truncate text-sm font-medium text-foreground">
            Tap to visit the podcast page
          </p>
        </div>
        <Radio className="h-4 w-4 shrink-0 text-primary" />
      </Link>
    </div>
  );
}
