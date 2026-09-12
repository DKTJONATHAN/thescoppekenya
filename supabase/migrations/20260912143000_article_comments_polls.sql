-- Shared article comments (visible to all readers)
CREATE TABLE IF NOT EXISTS public.article_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 40),
  body TEXT NOT NULL CHECK (char_length(body) >= 10 AND char_length(body) <= 800),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_comments_slug_created
  ON public.article_comments (slug, created_at DESC);

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments" ON public.article_comments;
CREATE POLICY "Anyone can read comments"
  ON public.article_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can post comments" ON public.article_comments;
CREATE POLICY "Anyone can post comments"
  ON public.article_comments FOR INSERT
  WITH CHECK (true);

-- Shared poll votes (aggregated client-side; one vote per voter_key per slug)
CREATE TABLE IF NOT EXISTS public.article_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  option_id TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug, voter_key)
);

CREATE INDEX IF NOT EXISTS idx_article_poll_votes_slug
  ON public.article_poll_votes (slug);

ALTER TABLE public.article_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read poll votes" ON public.article_poll_votes;
CREATE POLICY "Anyone can read poll votes"
  ON public.article_poll_votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can cast a poll vote" ON public.article_poll_votes;
CREATE POLICY "Anyone can cast a poll vote"
  ON public.article_poll_votes FOR INSERT
  WITH CHECK (true);
