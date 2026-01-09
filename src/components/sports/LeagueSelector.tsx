import { COMPETITIONS } from "@/hooks/useSportsData";
import { cn } from "@/lib/utils";

interface LeagueSelectorProps {
  selected: string;
  onSelect: (code: string) => void;
}

const leagueLogos: Record<string, string> = {
  PL: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  PD: "🇪🇸",
  SA: "🇮🇹",
  BL1: "🇩🇪",
  FL1: "🇫🇷",
  CL: "⭐",
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
          <span className="text-lg">{leagueLogos[league.code]}</span>
          <span className="hidden sm:inline">{league.name}</span>
          <span className="sm:hidden">{league.code}</span>
        </button>
      ))}
    </div>
  );
}
