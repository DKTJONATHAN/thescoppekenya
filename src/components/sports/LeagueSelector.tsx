import { COMPETITIONS } from "@/hooks/useSportsData";
import { cn } from "@/lib/utils";
import { MapPin, Trophy, Star, Sparkles } from "lucide-react";
import { ReactNode } from "react";

interface LeagueSelectorProps {
  selected: string;
  onSelect: (code: string) => void;
}

const leagueIcons: Record<string, ReactNode> = {
  KPL: <MapPin className="w-4 h-4" />,
  PL: <Trophy className="w-4 h-4" />,
  PD: <Trophy className="w-4 h-4" />,
  SA: <Trophy className="w-4 h-4" />,
  BL1: <Trophy className="w-4 h-4" />,
  FL1: <Trophy className="w-4 h-4" />,
  CL: <Star className="w-4 h-4" />,
};

const leagueColors: Record<string, string> = {
  KPL: "text-zinc-400",
  PL: "text-zinc-400",
  PD: "text-zinc-400",
  SA: "text-zinc-400",
  BL1: "text-zinc-400",
  FL1: "text-zinc-400",
  CL: "text-zinc-400",
};

export function LeagueSelector({ selected, onSelect }: LeagueSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
      {COMPETITIONS.map((league) => (
        <button
          key={league.code}
          onClick={() => onSelect(league.code)}
          className={cn(
            "flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
            selected === league.code
              ? "bg-rose-600 text-white border-rose-500 shadow-xl shadow-rose-900/40"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
          )}
        >
          <span className={cn(selected === league.code ? "text-white" : "text-rose-500")}>
            {leagueIcons[league.code]}
          </span>
          {league.isEditorial && (
            <Sparkles className="w-3 h-3 text-rose-300 animate-pulse" />
          )}
          <span className="inline">{league.name}</span>
        </button>
      ))}
    </div>
  );
}
