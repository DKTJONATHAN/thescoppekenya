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
  KPL: "text-green-600",
  PL: "text-purple-600",
  PD: "text-orange-500",
  SA: "text-blue-600",
  BL1: "text-red-600",
  FL1: "text-blue-800",
  CL: "text-yellow-500",
};

export function LeagueSelector({ selected, onSelect }: LeagueSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
      {COMPETITIONS.map((league) => (
        <button
          key={league.code}
          onClick={() => onSelect(league.code)}
          className={cn(
            "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-smooth border",
            selected === league.code
              ? "gradient-primary text-primary-foreground border-transparent shadow-soft"
              : "bg-background text-foreground border-divider hover:border-primary hover:text-primary"
          )}
        >
          <span className={cn(selected === league.code ? "text-primary-foreground" : leagueColors[league.code])}>
            {leagueIcons[league.code]}
          </span>
          {league.isEditorial && (
            <Sparkles className="w-3 h-3 text-yellow-500" />
          )}
          <span className="hidden sm:inline">{league.name}</span>
          <span className="sm:hidden">{league.code}</span>
        </button>
      ))}
    </div>
  );
}
