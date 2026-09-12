CREATE TABLE IF NOT EXISTS public.article_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  reaction_id TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug, voter_key)
);

CREATE INDEX IF NOT EXISTS idx_article_reactions_slug
  ON public.article_reactions (slug);

ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reactions" ON public.article_reactions;
CREATE POLICY "Anyone can read reactions"
  ON public.article_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can react" ON public.article_reactions;
CREATE POLICY "Anyone can react"
  ON public.article_reactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can change own reaction" ON public.article_reactions;
CREATE POLICY "Anyone can change own reaction"
  ON public.article_reactions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can remove own reaction" ON public.article_reactions;
CREATE POLICY "Anyone can remove own reaction"
  ON public.article_reactions FOR DELETE USING (true);
