import { useEffect, useMemo, useState } from "react";

type PollOption = { id: string; label: string };

const DEFAULT_OPTIONS: PollOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "unsure", label: "Not sure" },
];

function key(slug: string) {
  return `zn-poll:${slug}`;
}

export function ArticlePoll({
  slug,
  question = "Did this story help you understand the issue?",
  options = DEFAULT_OPTIONS,
}: {
  slug: string;
  question?: string;
  options?: PollOption[];
}) {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(slug));
      if (raw) {
        const parsed = JSON.parse(raw) as { votes: Record<string, number>; choice: string | null };
        setVotes(parsed.votes || {});
        setChoice(parsed.choice || null);
      } else {
        setVotes({});
        setChoice(null);
      }
    } catch {
      setVotes({});
      setChoice(null);
    }
  }, [slug]);

  const total = useMemo(
    () => Object.values(votes).reduce((a, b) => a + b, 0),
    [votes]
  );

  const vote = (id: string) => {
    if (choice) return;
    setVotes((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + 1 };
      try {
        localStorage.setItem(key(slug), JSON.stringify({ votes: next, choice: id }));
      } catch {
        /* ignore */
      }
      return next;
    });
    setChoice(id);
  };

  return (
    <section className="mt-8 border border-divider p-5 bg-muted/20" aria-label="Reader poll">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Poll</p>
      <h3 className="font-serif font-bold text-lg mb-4 text-foreground">{question}</h3>
      <ul className="space-y-2">
        {options.map((opt) => {
          const count = votes[opt.id] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const selected = choice === opt.id;
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={!!choice}
                onClick={() => vote(opt.id)}
                aria-pressed={selected}
                className={`relative w-full text-left px-3 py-2.5 border overflow-hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${
                  selected
                    ? "border-primary"
                    : "border-divider hover:border-primary/40"
                }`}
              >
                {choice ? (
                  <span
                    className="absolute inset-y-0 left-0 bg-primary/15"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                ) : null}
                <span className="relative flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{opt.label}</span>
                  {choice ? (
                    <span className="tabular-nums text-muted-foreground text-xs font-semibold">
                      {pct}% · {count}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {choice ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Thanks — {total} reader{total === 1 ? "" : "s"} voted on this device cohort.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">One vote per device. Results show after you vote.</p>
      )}
    </section>
  );
}
