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
    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-lg p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              AI Match Review
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateHeadline}
            disabled={isGenerating}
            className="text-muted-foreground hover:text-primary"
          >
            <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
          </Button>
        </div>

        {isGenerating ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : currentHeadline ? (
          <div>
            <h3 className="text-lg font-bold mb-2 leading-tight">
              {currentHeadline.headline}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {currentHeadline.content.slice(0, 200)}...
            </p>
            {currentHeadline.match && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{currentHeadline.match.homeTeam.name}</span>
                <span className="font-bold">
                  {currentHeadline.match.score.fullTime?.home} - {currentHeadline.match.score.fullTime?.away}
                </span>
                <span>{currentHeadline.match.awayTeam.name}</span>
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
