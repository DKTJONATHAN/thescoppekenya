import { useMatches, Match } from "@/hooks/useSportsData";
import { MatchCard } from "./MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";

interface FixturesListProps {
  competition: string;
  onMatchClick?: (match: Match) => void;
}

export function FixturesList({ competition, onMatchClick }: FixturesListProps) {
  const { data: matches, isLoading, error } = useMatches(competition);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Unable to load fixtures
      </div>
    );
  }

  if (!matches?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No fixtures available
      </div>
    );
  }

  // Group matches by date
  const groupedMatches = matches.reduce((acc, match) => {
    const date = new Date(match.utcDate);
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const sortedDates = Object.keys(groupedMatches).sort();

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => (
        <div key={dateStr}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            {getDateLabel(dateStr)}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedMatches[dateStr].map((match) => (
              <MatchCard 
                key={match.id} 
                match={match}
                onClick={() => onMatchClick?.(match)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
