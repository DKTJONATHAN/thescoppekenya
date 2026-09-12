import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  getSupabase,
  type ArticleCommentRow,
} from "@/lib/supabase";

type Comment = {
  id: string;
  name: string;
  body: string;
  ts: number;
};

const MAX_NAME = 40;
const MAX_BODY = 800;
const MIN_BODY = 10;
const INITIAL_VISIBLE = 3;

function looksSpammy(text: string): boolean {
  const t = text.trim();
  if (/https?:\/\/|www\./i.test(t)) return true;
  const letters = t.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 12) {
    const upper = (letters.match(/[A-Z]/g) || []).length;
    if (upper / letters.length > 0.7) return true;
  }
  if (/(.)\1{5,}/.test(t)) return true;
  return false;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function rowToComment(row: ArticleCommentRow): Comment {
  return {
    id: row.id,
    name: row.name,
    body: row.body,
    ts: new Date(row.created_at).getTime(),
  };
}

export function ArticleComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      setError("Comments are temporarily unavailable.");
      return;
    }
    setLoading(true);
    const { data, error: qErr } = await sb
      .from("article_comments")
      .select("id, slug, name, body, created_at")
      .eq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(100);

    if (qErr) {
      console.error("comments load", qErr);
      setError("Could not load comments. Tables may still need to be created.");
      setComments([]);
    } else {
      setComments((data as ArticleCommentRow[] | null)?.map(rowToComment) || []);
      setError(null);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    setName("");
    setBody("");
    setSubmitted(false);
    setExpanded(false);
    setError(null);
    void load();
  }, [slug, load]);

  const sorted = useMemo(
    () => [...comments].sort((a, b) => b.ts - a.ts),
    [comments]
  );

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hiddenCount = Math.max(0, sorted.length - INITIAL_VISIBLE);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(false);

    const n = name.trim().slice(0, MAX_NAME);
    const b = body.trim().slice(0, MAX_BODY);

    if (n.length < 2) {
      setError("Please enter a name (at least 2 characters).");
      return;
    }
    if (b.length < MIN_BODY) {
      setError(`Comment needs at least ${MIN_BODY} characters.`);
      return;
    }
    if (looksSpammy(b) || looksSpammy(n)) {
      setError("That comment looks like spam. Please revise and try again.");
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError("Comments are temporarily unavailable.");
      return;
    }

    setPosting(true);
    const { data, error: insErr } = await sb
      .from("article_comments")
      .insert({ slug, name: n, body: b })
      .select("id, slug, name, body, created_at")
      .single();

    setPosting(false);

    if (insErr || !data) {
      console.error("comments insert", insErr);
      setError("Could not post. Please try again in a moment.");
      return;
    }

    const row = data as ArticleCommentRow;
    setComments((prev) => [rowToComment(row), ...prev]);
    setBody("");
    setSubmitted(true);
  };

  return (
    <section
      className="mt-10 border border-divider p-5"
      aria-labelledby="comments-heading"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          id="comments-heading"
          className="text-lg font-black uppercase tracking-tight text-foreground"
        >
          Comments
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {sorted.length} {sorted.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Shared with all readers. Be civil — no links or spam.
      </p>

      <form onSubmit={onSubmit} className="space-y-3 mb-8" noValidate>
        <div>
          <label htmlFor={`comment-name-${slug}`} className="sr-only">
            Your name
          </label>
          <input
            id={`comment-name-${slug}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME}
            placeholder="Your name"
            autoComplete="nickname"
            className="w-full px-3 py-2.5 border border-divider bg-background text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-required="true"
            disabled={posting}
          />
        </div>
        <div>
          <label htmlFor={`comment-body-${slug}`} className="sr-only">
            Your comment
          </label>
          <textarea
            id={`comment-body-${slug}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_BODY}
            rows={3}
            placeholder="Share your take…"
            className="w-full px-3 py-2.5 border border-divider bg-background text-foreground text-sm placeholder:text-muted-foreground resize-y min-h-[5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-required="true"
            disabled={posting}
          />
          <p className="mt-1 text-[11px] text-muted-foreground tabular-nums text-right">
            {body.trim().length}/{MAX_BODY}
          </p>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {submitted && !error ? (
          <p role="status" className="text-sm text-primary">
            Comment posted.
          </p>
        ) : null}

        <Button type="submit" className="w-full sm:w-auto" disabled={posting}>
          {posting ? "Posting…" : "Post comment"}
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading comments…
        </p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
      ) : (
        <>
          <ul className="space-y-4" aria-label="Comment list">
            {visible.map((c) => (
              <li
                key={c.id}
                className="border-t border-divider pt-4 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="font-semibold text-sm text-foreground">{c.name}</span>
                  <time
                    className="text-[11px] text-muted-foreground tabular-nums shrink-0"
                    dateTime={new Date(c.ts).toISOString()}
                  >
                    {formatRelative(c.ts)}
                  </time>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>

          {hiddenCount > 0 && !expanded ? (
            <div className="mt-5">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setExpanded(true)}
              >
                Show {hiddenCount} more comment{hiddenCount === 1 ? "" : "s"}
              </Button>
            </div>
          ) : null}

          {expanded && sorted.length > INITIAL_VISIBLE ? (
            <div className="mt-5">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto text-muted-foreground"
                onClick={() => setExpanded(false)}
              >
                Show less
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
