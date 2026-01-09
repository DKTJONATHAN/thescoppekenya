import { useTodayMatches, getMatchStatus } from "@/hooks/useSportsData";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function LiveScoresWidget() {
  const { data: matches, isLoading, error } = useTodayMatches();

  const liveMatches = matches?.filter(m => 
    m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === 'PAUSED'
  ) || [];

  const recentMatches = matches?.filter(m => m.status === 'FINISHED').slice(0, 5) || [];
  
  const upcomingMatches = matches?.filter(m => 
    m.status === 'SCHEDULED' || m.status === 'TIMED'
  ).slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="bg-card border border-divider rounded-lg p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-divider rounded-lg p-4 text-center">
        <p className="text-muted-foreground">Unable to load live scores</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-divider rounded-lg overflow-hidden">
      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div className="p-4 border-b border-divider">
          <h3 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            LIVE NOW
          </h3>
          <div className="space-y-2">
            {liveMatches.map(match => (
              <LiveMatchRow key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {recentMatches.length > 0 && (
        <div className={cn("p-4", liveMatches.length > 0 && "border-t border-divider")}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Recent Results
          </h3>
          <div className="space-y-2">
            {recentMatches.map(match => (
              <LiveMatchRow key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {liveMatches.length === 0 && recentMatches.length === 0 && upcomingMatches.length > 0 && (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Upcoming Today
          </h3>
          <div className="space-y-2">
            {upcomingMatches.map(match => (
              <LiveMatchRow key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {liveMatches.length === 0 && recentMatches.length === 0 && upcomingMatches.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-muted-foreground text-sm">No matches today</p>
          <p className="text-xs text-muted-foreground mt-1">Check fixtures for upcoming games</p>
        </div>
      )}
    </div>
  );
}

interface LiveMatchRowProps {
  match: {
    id: number;
    homeTeam: { name: string; shortName?: string; crest?: string };
    awayTeam: { name: string; shortName?: string; crest?: string };
    score: { fullTime?: { home: number | null; away: number | null } };
    status: string;
    competition: { name: string; code: string };
    utcDate: string;
  };
}

function LiveMatchRow({ match }: LiveMatchRowProps) {
  const { label, color } = getMatchStatus(match.status);
  const isLive = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED';

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md",
      isLive && "bg-red-500/10"
    )}>
      {/* Home Team */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {match.homeTeam.crest && (
          <img src={match.homeTeam.crest} alt="" className="w-4 h-4 object-contain" />
        )}
        <span className="text-sm truncate">
          {match.homeTeam.shortName || match.homeTeam.name.slice(0, 12)}
        </span>
      </div>

      {/* Score */}
      <div className={cn(
        "flex items-center gap-1 font-bold text-sm px-2",
        isLive && "text-red-500"
      )}>
        <span>{match.score.fullTime?.home ?? '-'}</span>
        <span className="text-muted-foreground">:</span>
        <span>{match.score.fullTime?.away ?? '-'}</span>
      </div>

      {/* Away Team */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className="text-sm truncate text-right">
          {match.awayTeam.shortName || match.awayTeam.name.slice(0, 12)}
        </span>
        {match.awayTeam.crest && (
          <img src={match.awayTeam.crest} alt="" className="w-4 h-4 object-contain" />
        )}
      </div>

      {/* Status Badge */}
      <span className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded text-white ml-2",
        color
      )}>
        {label}
      </span>
    </div>
  );
}
