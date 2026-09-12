import { useEffect, useMemo, useState } from "react";

const REACTIONS = [
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "clap", emoji: "👏", label: "Clap" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "angry", emoji: "😡", label: "Angry" },
] as const;

type ReactionId = (typeof REACTIONS)[number]["id"];

function storageKey(slug: string) {
  return `zn-react:${slug}`;
}

function loadCounts(slug: string): Record<ReactionId, number> {
  const base = { fire: 0, clap: 0, wow: 0, sad: 0, angry: 0 };
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Record<ReactionId, number>>;
    return { ...base, ...parsed };
  } catch {
    return base;
  }
}

function loadMine(slug: string): ReactionId | null {
  try {
    return (localStorage.getItem(`${storageKey(slug)}:mine`) as ReactionId) || null;
  } catch {
    return null;
  }
}

export function ArticleReactions({ slug }: { slug: string }) {
  const [counts, setCounts] = useState<Record<ReactionId, number>>(() => loadCounts(slug));
  const [mine, setMine] = useState<ReactionId | null>(() => loadMine(slug));

  useEffect(() => {
    setCounts(loadCounts(slug));
    setMine(loadMine(slug));
  }, [slug]);

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  const react = (id: ReactionId) => {
    setCounts((prev) => {
      const next = { ...prev };
      if (mine && mine !== id) {
        next[mine] = Math.max(0, (next[mine] || 0) - 1);
      }
      if (mine === id) {
        next[id] = Math.max(0, (next[id] || 0) - 1);
      } else {
        next[id] = (next[id] || 0) + 1;
      }
      try {
        localStorage.setItem(storageKey(slug), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setMine((cur) => {
      const next = cur === id ? null : id;
      try {
        if (next) localStorage.setItem(`${storageKey(slug)}:mine`, next);
        else localStorage.removeItem(`${storageKey(slug)}:mine`);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <section
      className="mt-8 border border-divider p-4"
      aria-label="React to this story"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Your reaction
        </p>
        {total > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">{total} reactions</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2" role="group">
        {REACTIONS.map((r) => {
          const active = mine === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => react(r.id)}
              aria-pressed={active}
              aria-label={`${r.label}${counts[r.id] ? `, ${counts[r.id]}` : ""}`}
              className={`inline-flex items-center gap-1.5 px-3 py-2 border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-divider hover:border-primary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span aria-hidden className="text-base leading-none">
                {r.emoji}
              </span>
              <span className="tabular-nums text-xs font-semibold">{counts[r.id] || 0}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
