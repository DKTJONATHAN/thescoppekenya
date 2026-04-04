import { Match, getMatchStatus } from "@/hooks/useSportsData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
        "bg-zinc-900/40 border border-zinc-800/50 rounded-[2rem] p-6 transition-all duration-300 hover:border-rose-500/50 cursor-pointer group shadow-xl hover:shadow-rose-900/10 backdrop-blur-sm",
        isLive && "ring-1 ring-rose-500 animate-pulse bg-rose-950/10"
      )}
    >
      {/* Competition & Status */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest truncate max-w-[60%]">
          {match.competition.name}
        </span>
        <Badge variant="outline" className={cn(
          "text-[8px] font-black uppercase tracking-tighter border-0 text-white shadow-sm",
          color === 'bg-red-500' ? 'bg-rose-600' : 'bg-zinc-800'
        )}>
          {label}
        </Badge>
      </div>

      {/* Teams & Score */}
      <div className="space-y-2">
        {/* Home Team */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {match.homeTeam.crest && (
              <div className="w-8 h-8 bg-white/5 rounded-lg p-1.5 backdrop-blur-sm">
                <img 
                  src={match.homeTeam.crest} 
                  alt={match.homeTeam.name} 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <span className={cn(
              "font-bold text-zinc-100 truncate",
              isFinished && match.score.fullTime?.home !== null && 
              match.score.fullTime?.away !== null &&
              match.score.fullTime.home > match.score.fullTime.away && "text-rose-500"
            )}>
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
          </div>
          <span className={cn(
            "text-2xl font-black w-10 text-center tracking-tighter",
            isLive ? "text-rose-500" : "text-zinc-300"
          )}>
            {match.score.fullTime?.home ?? '-'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {match.awayTeam.crest && (
              <div className="w-8 h-8 bg-white/5 rounded-lg p-1.5 backdrop-blur-sm">
                <img 
                  src={match.awayTeam.crest} 
                  alt={match.awayTeam.name} 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <span className={cn(
              "font-bold text-zinc-100 truncate",
              isFinished && match.score.fullTime?.home !== null && 
              match.score.fullTime?.away !== null &&
              match.score.fullTime.away > match.score.fullTime.home && "text-rose-500"
            )}>
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
          </div>
          <span className={cn(
            "text-2xl font-black w-10 text-center tracking-tighter",
            isLive ? "text-rose-500" : "text-zinc-300"
          )}>
            {match.score.fullTime?.away ?? '-'}
          </span>
        </div>
      </div>

      {/* Match Time/Date */}
      <div className="mt-6 pt-4 border-t border-zinc-800/50 text-center flex items-center justify-center gap-2">
        {isLive ? (
          <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            In Progress
          </span>
        ) : isFinished ? (
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Final Result
          </span>
        ) : (
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">
            {format(matchDate, 'p')} • {format(matchDate, 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}
