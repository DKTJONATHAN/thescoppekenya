-- Threaded replies: null parent_id = top-level comment
ALTER TABLE public.article_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_article_comments_parent
  ON public.article_comments (parent_id)
  WHERE parent_id IS NOT NULL;
