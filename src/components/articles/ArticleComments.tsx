import { useEffect, useMemo, useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";

type Comment = {
  id: string;
  name: string;
  body: string;
  ts: number;
};

const MAX_NAME = 40;
const MAX_BODY = 800;
const MIN_BODY = 10;
const MAX_COMMENTS = 50;

function storageKey(slug: string) {
  return `zn-comments:${slug}`;
}

function loadComments(slug: string): Comment[] {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Comment[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (c) =>
          c &&
          typeof c.id === "string" &&
          typeof c.name === "string" &&
          typeof c.body === "string" &&
          typeof c.ts === "number"
      )
      .slice(0, MAX_COMMENTS);
  } catch {
    return [];
  }
}

function saveComments(slug: string, list: Comment[]) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(list.slice(0, MAX_COMMENTS)));
  } catch {
    /* quota / private mode */
  }
}

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

export function ArticleComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>(() => loadComments(slug));
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setComments(loadComments(slug));
    setName("");
    setBody("");
    setError(null);
    setSubmitted(false);
  }, [slug]);

  const sorted = useMemo(
    () => [...comments].sort((a, b) => b.ts - a.ts),
    [comments]
  );

  const onSubmit = (e: FormEvent) => {
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

    const next: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: n,
      body: b,
      ts: Date.now(),
    };

    setComments((prev) => {
      const list = [next, ...prev].slice(0, MAX_COMMENTS);
      saveComments(slug, list);
      return list;
    });
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
        Comments stay on this device for now. Be civil — no links or spam.
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

        <Button type="submit" className="w-full sm:w-auto">
          Post comment
        </Button>
      </form>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
      ) : (
        <ul className="space-y-4" aria-label="Comment list">
          {sorted.map((c) => (
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
      )}
    </section>
  );
}
