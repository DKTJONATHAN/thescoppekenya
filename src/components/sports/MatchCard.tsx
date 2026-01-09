import { Match, getMatchStatus } from "@/hooks/useSportsData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
}

export function MatchCard({ match, onClick }: MatchCardProps) {
  const { label, color } = getMatchStatus(match.status);
  const isLive = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED';
  const isFinished = match.status === 'FINISHED';
  const matchDate = new Date(match.utcDate);

  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-card border border-divider rounded-lg p-4 transition-smooth hover:shadow-soft cursor-pointer",
        isLive && "ring-2 ring-red-500/50 animate-pulse"
      )}
    >
      {/* Competition & Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground truncate max-w-[60%]">
          {match.competition.name}
        </span>
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded text-white",
          color
        )}>
          {label}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="space-y-2">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.homeTeam.crest && (
              <img 
                src={match.homeTeam.crest} 
                alt={match.homeTeam.name} 
                className="w-6 h-6 object-contain"
              />
            )}
            <span className={cn(
              "font-medium truncate",
              isFinished && match.score.fullTime?.home !== null && 
              match.score.fullTime?.away !== null &&
              match.score.fullTime.home > match.score.fullTime.away && "text-primary"
            )}>
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
          </div>
          <span className={cn(
            "text-xl font-bold w-8 text-center",
            isLive && "text-red-500"
          )}>
            {match.score.fullTime?.home ?? '-'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.awayTeam.crest && (
              <img 
                src={match.awayTeam.crest} 
                alt={match.awayTeam.name} 
                className="w-6 h-6 object-contain"
              />
            )}
            <span className={cn(
              "font-medium truncate",
              isFinished && match.score.fullTime?.home !== null && 
              match.score.fullTime?.away !== null &&
              match.score.fullTime.away > match.score.fullTime.home && "text-primary"
            )}>
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
          </div>
          <span className={cn(
            "text-xl font-bold w-8 text-center",
            isLive && "text-red-500"
          )}>
            {match.score.fullTime?.away ?? '-'}
          </span>
        </div>
      </div>

      {/* Match Time/Date */}
      <div className="mt-3 pt-3 border-t border-divider text-center">
        {isLive ? (
          <span className="text-xs text-red-500 font-medium">
            🔴 Match in Progress
          </span>
        ) : isFinished ? (
          <span className="text-xs text-muted-foreground">
            {format(matchDate, 'PPP')}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {format(matchDate, 'PPP p')}
          </span>
        )}
      </div>
    </div>
  );
}
