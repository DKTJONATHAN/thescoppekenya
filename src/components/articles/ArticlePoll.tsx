import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase, getVoterKey } from "@/lib/supabase";

type PollOption = { id: string; label: string };

const DEFAULT_OPTIONS: PollOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "unsure", label: "Not sure" },
];

const CHOICE_KEY = (slug: string) => `zn-poll-choice:${slug}`;

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
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase();
    let localChoice: string | null = null;
    try {
      localChoice = localStorage.getItem(CHOICE_KEY(slug));
    } catch {
      /* ignore */
    }
    setChoice(localChoice);

    if (!sb) {
      setVotes({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await sb
      .from("article_poll_votes")
      .select("option_id")
      .eq("slug", slug)
      .limit(5000);

    if (error) {
      console.error("poll load", error);
      setVotes({});
    } else {
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        const id = (row as { option_id: string }).option_id;
        counts[id] = (counts[id] || 0) + 1;
      }
      setVotes(counts);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(
    () => Object.values(votes).reduce((a, b) => a + b, 0),
    [votes]
  );

  const showResults = total > 0;

  const vote = async (id: string) => {
    if (choice || voting) return;

    const sb = getSupabase();
    if (!sb) return;

    setVoting(true);
    const voterKey = getVoterKey();

    const { error } = await sb.from("article_poll_votes").insert({
      slug,
      option_id: id,
      voter_key: voterKey,
    });

    if (error) {
      // Unique violation = already voted from this device key
      if (error.code === "23505") {
        try {
          localStorage.setItem(CHOICE_KEY(slug), id);
        } catch {
          /* ignore */
        }
        setChoice(id);
      } else {
        console.error("poll vote", error);
      }
      setVoting(false);
      await load();
      return;
    }

    try {
      localStorage.setItem(CHOICE_KEY(slug), id);
    } catch {
      /* ignore */
    }
    setChoice(id);
    setVotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setVoting(false);
  };

  return (
    <section className="mt-8 border border-divider p-5 bg-muted/20" aria-label="Reader poll">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Poll</p>
      <h3 className="font-serif font-bold text-lg mb-4 text-foreground">{question}</h3>

      {loading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading results…
        </p>
      ) : (
        <ul className="space-y-2">
          {options.map((opt) => {
            const count = votes[opt.id] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const selected = choice === opt.id;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  disabled={!!choice || voting}
                  onClick={() => void vote(opt.id)}
                  aria-pressed={selected}
                  className={`relative w-full text-left px-3 py-2.5 border overflow-hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${
                    selected
                      ? "border-primary"
                      : "border-divider hover:border-primary/40"
                  }`}
                >
                  {showResults ? (
                    <span
                      className="absolute inset-y-0 left-0 bg-primary/15"
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                  ) : null}
                  <span className="relative flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{opt.label}</span>
                    {showResults ? (
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
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {choice
          ? `Thanks — ${total} reader${total === 1 ? "" : "s"} voted.`
          : showResults
            ? `${total} vote${total === 1 ? "" : "s"} so far. One vote per device.`
            : "One vote per device. Results appear as people vote."}
      </p>
    </section>
  );
}
