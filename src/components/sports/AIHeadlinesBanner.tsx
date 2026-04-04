import { useState, useEffect } from "react";
import { useTodayMatches, useMatchReview, Match } from "@/hooks/useSportsData";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AIHeadlinesBanner() {
  const { data: matches } = useTodayMatches();
  const reviewMutation = useMatchReview();
  const [currentHeadline, setCurrentHeadline] = useState<{
    headline: string;
    content: string;
    match?: Match;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Find a finished match to generate review for
  const finishedMatches = matches?.filter(m => m.status === 'FINISHED') || [];

  const generateHeadline = async () => {
    if (finishedMatches.length === 0) return;
    
    setIsGenerating(true);
    try {
      // Pick a random finished match
      const randomMatch = finishedMatches[Math.floor(Math.random() * finishedMatches.length)];
      const result = await reviewMutation.mutateAsync(randomMatch);
      setCurrentHeadline({
        headline: result.headline,
        content: result.content,
        match: randomMatch,
      });
    } catch (error) {
      console.error('Failed to generate headline:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate initial headline when finished matches are available
  useEffect(() => {
    if (finishedMatches.length > 0 && !currentHeadline && !isGenerating) {
      generateHeadline();
    }
  }, [finishedMatches.length]);

  if (!matches || finishedMatches.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl backdrop-blur-sm">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/5 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">
              AI Match Analysis
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateHeadline}
            disabled={isGenerating}
            className="text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
          </Button>
        </div>

        {isGenerating ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 bg-zinc-800 rounded-lg" />
            <Skeleton className="h-4 w-full bg-zinc-800 rounded-md" />
            <Skeleton className="h-4 w-2/3 bg-zinc-800 rounded-md" />
          </div>
        ) : currentHeadline ? (
          <div>
            <h3 className="text-3xl md:text-4xl font-serif font-black text-white mb-6 leading-[1.1]">
              {currentHeadline.headline}
            </h3>
            <p className="text-lg text-zinc-400 font-light leading-relaxed mb-8 line-clamp-3">
              {currentHeadline.content}
            </p>
            {currentHeadline.match && (
              <div className="pt-6 border-t border-zinc-800 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span className="text-zinc-200">{currentHeadline.match.homeTeam.name}</span>
                <span className="px-3 py-1 bg-zinc-800 rounded-lg text-rose-500 font-black">
                  {currentHeadline.match.score.fullTime?.home} - {currentHeadline.match.score.fullTime?.away}
                </span>
                <span className="text-zinc-200">{currentHeadline.match.awayTeam.name}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click refresh to generate an AI match review
          </p>
        )}
      </div>
    </div>
  );
}
