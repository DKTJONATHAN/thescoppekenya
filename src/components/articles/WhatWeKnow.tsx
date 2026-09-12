type WhatWeKnowProps = {
  facts: string[];
};

export function WhatWeKnow({ facts }: WhatWeKnowProps) {
  const items = facts.map((f) => f.trim()).filter(Boolean).slice(0, 5);
  if (items.length < 2) return null;

  return (
    <aside
      className="my-8 sm:my-10 rounded-xl border border-border bg-card/80 overflow-hidden shadow-sm"
      aria-label="What we know"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary m-0">
            What we know
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground m-0 leading-snug">
            Desk commentary — the short version
          </p>
        </div>
        <span
          className="shrink-0 rounded-full border border-primary/30 bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"
          aria-hidden
        >
          Brief
        </span>
      </div>

      <ol className="m-0 list-none p-0 divide-y divide-border/80">
        {items.map((fact, i) => (
          <li
            key={`${i}-${fact.slice(0, 24)}`}
            className="flex gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-black tabular-nums text-primary"
              aria-hidden
            >
              {i + 1}
            </span>
            <p className="m-0 text-[0.92rem] sm:text-[0.95rem] leading-relaxed text-foreground">
              {fact}
            </p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
