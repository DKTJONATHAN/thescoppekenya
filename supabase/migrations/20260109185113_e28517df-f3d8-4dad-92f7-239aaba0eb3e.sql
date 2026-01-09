-- Create sports AI content cache table
CREATE TABLE public.sports_ai_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('preview', 'review', 'headline', 'roundup')),
  headline TEXT NOT NULL,
  content TEXT NOT NULL,
  competition_code TEXT,
  home_team TEXT,
  away_team TEXT,
  match_date TIMESTAMP WITH TIME ZONE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(match_id, content_type)
);

-- Enable Row Level Security
ALTER TABLE public.sports_ai_content ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (sports content is public)
CREATE POLICY "Sports AI content is publicly readable" 
ON public.sports_ai_content 
FOR SELECT 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_sports_ai_content_match ON public.sports_ai_content(match_id);
CREATE INDEX idx_sports_ai_content_expires ON public.sports_ai_content(expires_at);