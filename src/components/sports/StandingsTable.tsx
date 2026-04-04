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
      <div className="space-y-3">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-zinc-900 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !standings?.length) {
    return (
      <div className="text-center py-16 text-zinc-500 italic font-light font-serif">
        Unable to load championship standings
      </div>
    );
  }

  const mainTable = standings[0]?.table || [];

  return (
    <div className="overflow-x-auto bg-zinc-900/30 rounded-[2rem] border border-zinc-800/50 p-6 backdrop-blur-sm">
      <Table>
        <TableHeader className="[&_tr]:border-zinc-800">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 text-[10px] font-black uppercase text-zinc-500 tracking-widest">#</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Squad</TableHead>
            <TableHead className="text-center w-10 text-[10px] font-black uppercase text-zinc-500 tracking-widest">P</TableHead>
            <TableHead className="text-center w-10 text-[10px] font-black uppercase text-zinc-500 tracking-widest">W</TableHead>
            <TableHead className="text-center w-10 text-[10px] font-black uppercase text-zinc-500 tracking-widest">D</TableHead>
            <TableHead className="text-center w-10 text-[10px] font-black uppercase text-zinc-500 tracking-widest">L</TableHead>
            <TableHead className="text-center w-14 hidden sm:table-cell text-[10px] font-black uppercase text-zinc-500 tracking-widest">GD</TableHead>
            <TableHead className="text-center w-12 font-black text-rose-500 uppercase tracking-widest text-[10px]">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:border-zinc-800/50">
          {mainTable.map((row) => (
            <TableRow 
              key={row.team.id}
              className={cn(
                "hover:bg-zinc-800/20 transition-colors",
                row.position <= 4 && "border-l-[3px] border-l-rose-600/50",
                row.position >= mainTable.length - 2 && "border-l-[3px] border-l-zinc-700/50"
              )}
            >
              <TableCell className="font-black text-zinc-500 text-xs">{row.position}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {row.team.crest ? (
                    <div className="w-6 h-6 bg-white/5 rounded p-1">
                      <img 
                        src={row.team.crest} 
                        alt={row.team.name} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-zinc-800 rounded animate-pulse" />
                  )}
                  <span className="truncate font-bold text-zinc-200 text-sm tracking-tight">
                    {row.team.shortName || row.team.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center text-zinc-400 font-medium text-xs">{row.playedGames}</TableCell>
              <TableCell className="text-center text-rose-500/80 font-bold text-xs">{row.won}</TableCell>
              <TableCell className="text-center text-zinc-600 text-xs">{row.draw}</TableCell>
              <TableCell className="text-center text-zinc-500 text-xs">{row.lost}</TableCell>
              <TableCell className={cn(
                "text-center hidden sm:table-cell text-xs font-medium",
                row.goalDifference > 0 ? "text-rose-600/60" : "text-zinc-600"
              )}>
                {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
              </TableCell>
              <TableCell className="text-center font-black text-zinc-100">{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Legend */}
      <div className="flex gap-6 mt-8 text-[10px] font-black uppercase tracking-widest text-zinc-600 px-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          <span>Qualification</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
          <span>Safe Zone</span>
        </div>
      </div>
    </div>
  );
}
