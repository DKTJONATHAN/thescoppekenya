import { Link, useLocation } from "react-router-dom";
import { Home, Flame, Newspaper, Radio, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/trending", label: "Trending", icon: Flame, match: (p: string) => p.startsWith("/trending") },
  { to: "/news", label: "News", icon: Newspaper, match: (p: string) => p.startsWith("/news") || p.startsWith("/article") },
  { to: "/tv", label: "Live TV", icon: Radio, match: (p: string) => p.startsWith("/tv") || p.startsWith("/live") },
  { to: "/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/search") },
] as const;

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="mobile-bottom-nav lg:hidden"
      aria-label="Primary mobile"
    >
      <div className="mobile-bottom-nav__inner">
        {TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              className={cn("mobile-bottom-nav__tab", active && "is-active")}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-bottom-nav__icon-wrap">
                <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={active ? 2.4 : 2} aria-hidden />
              </span>
              <span className="mobile-bottom-nav__label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
