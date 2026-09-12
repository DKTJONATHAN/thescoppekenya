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
  parentId: string | null;
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
    parentId: row.parent_id ?? null,
  };
}

function validateComment(name: string, body: string): string | null {
  const n = name.trim();
  const b = body.trim();
  if (n.length < 2) return "Please enter a name (at least 2 characters).";
  if (b.length < MIN_BODY) return `Comment needs at least ${MIN_BODY} characters.`;
  if (looksSpammy(b) || looksSpammy(n)) {
    return "That comment looks like spam. Please revise and try again.";
  }
  return null;
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

  /** Which top-level comment is open for reply */
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyName, setReplyName] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyPosting, setReplyPosting] = useState(false);

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
      .select("id, slug, name, body, created_at, parent_id")
      .eq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(200);

    if (qErr) {
      console.error("comments load", qErr);
      setError("Could not load comments.");
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
    setReplyToId(null);
    setReplyName("");
    setReplyBody("");
    setReplyError(null);
    void load();
  }, [slug, load]);

  const { roots, repliesByParent, totalCount } = useMemo(() => {
    const rootsList = comments
      .filter((c) => !c.parentId)
      .sort((a, b) => b.ts - a.ts);
    const map = new Map<string, Comment[]>();
    for (const c of comments) {
      if (!c.parentId) continue;
      // Flatten: attach reply-to-reply under the same top-level parent if needed
      const key = c.parentId;
      const list = map.get(key) || [];
      list.push(c);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.ts - b.ts);
    }
    return {
      roots: rootsList,
      repliesByParent: map,
      totalCount: comments.length,
    };
  }, [comments]);

  const visibleRoots = expanded ? roots : roots.slice(0, INITIAL_VISIBLE);
  const hiddenCount = Math.max(0, roots.length - INITIAL_VISIBLE);

  const postComment = async (
    nRaw: string,
    bRaw: string,
    parentId: string | null
  ): Promise<{ ok: true; comment: Comment } | { ok: false; message: string }> => {
    const n = nRaw.trim().slice(0, MAX_NAME);
    const b = bRaw.trim().slice(0, MAX_BODY);
    const v = validateComment(n, b);
    if (v) return { ok: false, message: v };

    const sb = getSupabase();
    if (!sb) return { ok: false, message: "Comments are temporarily unavailable." };

    // One-level threads: if replying to a reply, attach to the root parent
    let resolvedParent = parentId;
    if (parentId) {
      const parent = comments.find((c) => c.id === parentId);
      if (parent?.parentId) resolvedParent = parent.parentId;
    }

    const payload: Record<string, unknown> = {
      slug,
      name: n,
      body: b,
      parent_id: resolvedParent,
    };

    const { data, error: insErr } = await sb
      .from("article_comments")
      .insert(payload)
      .select("id, slug, name, body, created_at, parent_id")
      .single();

    if (insErr || !data) {
      console.error("comments insert", insErr);
      return { ok: false, message: "Could not post. Please try again in a moment." };
    }

    return { ok: true, comment: rowToComment(data as ArticleCommentRow) };
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(false);
    setPosting(true);
    const result = await postComment(name, body, null);
    setPosting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setComments((prev) => [result.comment, ...prev]);
    setBody("");
    setSubmitted(true);
  };

  const onReplySubmit = async (e: FormEvent, parentId: string) => {
    e.preventDefault();
    setReplyError(null);
    setReplyPosting(true);
    const result = await postComment(replyName, replyBody, parentId);
    setReplyPosting(false);
    if (!result.ok) {
      setReplyError(result.message);
      return;
    }
    setComments((prev) => [...prev, result.comment]);
    setReplyBody("");
    setReplyToId(null);
  };

  const openReply = (id: string) => {
    setReplyToId((cur) => (cur === id ? null : id));
    setReplyError(null);
    setReplyBody("");
    if (!replyName && name) setReplyName(name);
  };

  const renderComment = (c: Comment, isReply = false) => {
    const replies = !isReply ? repliesByParent.get(c.id) || [] : [];
    return (
      <li
        key={c.id}
        className={
          isReply
            ? "border-l-2 border-primary/40 pl-3 ml-1"
            : "border-t border-divider pt-4 first:border-t-0 first:pt-0"
        }
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

        {!isReply ? (
          <button
            type="button"
            onClick={() => openReply(c.id)}
            className="mt-2 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {replyToId === c.id ? "Cancel" : "Reply"}
          </button>
        ) : null}

        {replyToId === c.id && !isReply ? (
          <form
            onSubmit={(e) => void onReplySubmit(e, c.id)}
            className="mt-3 space-y-2 border border-divider p-3 bg-muted/10"
            noValidate
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Reply to {c.name}
            </p>
            <label htmlFor={`reply-name-${c.id}`} className="sr-only">
              Your name
            </label>
            <input
              id={`reply-name-${c.id}`}
              type="text"
              value={replyName}
              onChange={(e) => setReplyName(e.target.value)}
              maxLength={MAX_NAME}
              placeholder="Your name"
              autoComplete="nickname"
              className="w-full px-3 py-2 border border-divider bg-background text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-required="true"
              disabled={replyPosting}
            />
            <label htmlFor={`reply-body-${c.id}`} className="sr-only">
              Your reply
            </label>
            <textarea
              id={`reply-body-${c.id}`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              maxLength={MAX_BODY}
              rows={2}
              placeholder="Write a reply…"
              className="w-full px-3 py-2 border border-divider bg-background text-foreground text-sm placeholder:text-muted-foreground resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-required="true"
              disabled={replyPosting}
            />
            {replyError ? (
              <p role="alert" className="text-sm text-destructive">
                {replyError}
              </p>
            ) : null}
            <Button type="submit" size="sm" disabled={replyPosting}>
              {replyPosting ? "Posting…" : "Post reply"}
            </Button>
          </form>
        ) : null}

        {replies.length > 0 ? (
          <ul className="mt-3 space-y-3" aria-label={`Replies to ${c.name}`}>
            {replies.map((r) => renderComment(r, true))}
          </ul>
        ) : null}
      </li>
    );
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
          {totalCount} {totalCount === 1 ? "comment" : "comments"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Shared with all readers. You can reply to others. Be civil — no links or spam.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 mb-8" noValidate>
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
      ) : roots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
      ) : (
        <>
          <ul className="space-y-4" aria-label="Comment list">
            {visibleRoots.map((c) => renderComment(c, false))}
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

          {expanded && roots.length > INITIAL_VISIBLE ? (
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
