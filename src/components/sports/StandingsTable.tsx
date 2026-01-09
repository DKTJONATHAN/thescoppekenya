import { useStandings } from "@/hooks/useSportsData";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface StandingsTableProps {
  competition: string;
}

export function StandingsTable({ competition }: StandingsTableProps) {
  const { data: standings, isLoading, error } = useStandings(competition);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error || !standings?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Unable to load standings
      </div>
    );
  }

  const mainTable = standings[0]?.table || [];

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center w-10">P</TableHead>
            <TableHead className="text-center w-10">W</TableHead>
            <TableHead className="text-center w-10">D</TableHead>
            <TableHead className="text-center w-10">L</TableHead>
            <TableHead className="text-center w-14 hidden sm:table-cell">GD</TableHead>
            <TableHead className="text-center w-12 font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mainTable.map((row) => (
            <TableRow 
              key={row.team.id}
              className={cn(
                row.position <= 4 && "border-l-2 border-l-green-500",
                row.position >= mainTable.length - 2 && "border-l-2 border-l-red-500"
              )}
            >
              <TableCell className="font-medium">{row.position}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {row.team.crest && (
                    <img 
                      src={row.team.crest} 
                      alt={row.team.name} 
                      className="w-5 h-5 object-contain"
                    />
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {row.team.shortName || row.team.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">{row.playedGames}</TableCell>
              <TableCell className="text-center text-green-600">{row.won}</TableCell>
              <TableCell className="text-center text-muted-foreground">{row.draw}</TableCell>
              <TableCell className="text-center text-red-600">{row.lost}</TableCell>
              <TableCell className={cn(
                "text-center hidden sm:table-cell",
                row.goalDifference > 0 && "text-green-600",
                row.goalDifference < 0 && "text-red-600"
              )}>
                {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
              </TableCell>
              <TableCell className="text-center font-bold">{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Champions League</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>Relegation</span>
        </div>
      </div>
    </div>
  );
}
