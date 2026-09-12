import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { Flame, ThumbsUp, Sparkles, Frown, Angry } from "lucide-react";
import { getSupabase, getVoterKey } from "@/lib/supabase";

const REACTIONS: {
  id: "fire" | "clap" | "wow" | "sad" | "angry";
  label: string;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}[] = [
  { id: "fire", label: "Fire", Icon: Flame },
  { id: "clap", label: "Agree", Icon: ThumbsUp },
  { id: "wow", label: "Wow", Icon: Sparkles },
  { id: "sad", label: "Sad", Icon: Frown },
  { id: "angry", label: "Angry", Icon: Angry },
];

type ReactionId = (typeof REACTIONS)[number]["id"];

const LOCAL_MINE = (slug: string) => `zn-react:${slug}:mine`;

export function ArticleReactions({ slug }: { slug: string }) {
  const [counts, setCounts] = useState<Record<ReactionId, number>>({
    fire: 0,
    clap: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  });
  const [mine, setMine] = useState<ReactionId | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase();
    let localMine: ReactionId | null = null;
    try {
      localMine = (localStorage.getItem(LOCAL_MINE(slug)) as ReactionId) || null;
    } catch {
      /* ignore */
    }
    setMine(localMine);

    if (!sb) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await sb
      .from("article_reactions")
      .select("reaction_id, voter_key")
      .eq("slug", slug)
      .limit(5000);

    if (error) {
      console.error("reactions load", error);
      setLoading(false);
      return;
    }

    const next = { fire: 0, clap: 0, wow: 0, sad: 0, angry: 0 } as Record<ReactionId, number>;
    const vk = getVoterKey();
    let serverMine: ReactionId | null = null;
    for (const row of data || []) {
      const id = (row as { reaction_id: ReactionId }).reaction_id;
      if (id in next) next[id] += 1;
      if ((row as { voter_key: string }).voter_key === vk) {
        serverMine = id;
      }
    }
    setCounts(next);
    if (serverMine) {
      setMine(serverMine);
      try {
        localStorage.setItem(LOCAL_MINE(slug), serverMine);
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  const react = async (id: ReactionId) => {
    if (busy) return;
    const sb = getSupabase();
    if (!sb) return;

    setBusy(true);
    const vk = getVoterKey();

    try {
      if (mine === id) {
        await sb.from("article_reactions").delete().eq("slug", slug).eq("voter_key", vk);
        setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
        setMine(null);
        try {
          localStorage.removeItem(LOCAL_MINE(slug));
        } catch {
          /* ignore */
        }
      } else if (mine) {
        await sb
          .from("article_reactions")
          .upsert(
            { slug, reaction_id: id, voter_key: vk },
            { onConflict: "slug,voter_key" }
          );
        setCounts((prev) => {
          const next = { ...prev };
          next[mine] = Math.max(0, (next[mine] || 0) - 1);
          next[id] = (next[id] || 0) + 1;
          return next;
        });
        setMine(id);
        try {
          localStorage.setItem(LOCAL_MINE(slug), id);
        } catch {
          /* ignore */
        }
      } else {
        const { error } = await sb.from("article_reactions").insert({
          slug,
          reaction_id: id,
          voter_key: vk,
        });
        if (error && error.code === "23505") {
          await sb
            .from("article_reactions")
            .upsert(
              { slug, reaction_id: id, voter_key: vk },
              { onConflict: "slug,voter_key" }
            );
        }
        setCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        setMine(id);
        try {
          localStorage.setItem(LOCAL_MINE(slug), id);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      console.error("react", e);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8 border border-divider p-4" aria-label="React to this story">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Your reaction
        </p>
        {total > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {total} reaction{total === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2" role="group">
        {REACTIONS.map((r) => {
          const active = mine === r.id;
          const Icon = r.Icon;
          return (
            <button
              key={r.id}
              type="button"
              disabled={busy || loading}
              onClick={() => void react(r.id)}
              aria-pressed={active}
              aria-label={`${r.label}${counts[r.id] ? `, ${counts[r.id]}` : ""}`}
              title={r.label}
              className={`inline-flex items-center gap-1.5 px-3 py-2 border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-divider hover:border-primary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              <span className="tabular-nums text-xs font-semibold">{counts[r.id] || 0}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
