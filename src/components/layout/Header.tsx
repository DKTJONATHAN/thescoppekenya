import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, Radio, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchOverlay } from "@/components/SearchOverlay";
import { getAllPosts } from "@/lib/markdown";
import { primaryNavLinks } from "@/lib/site-links";
import logoImg from "@/assets/logo.png";

const allPostsFromMarkdown = getAllPosts();

export function Header() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const trendingPosts = useMemo(() => allPostsFromMarkdown.slice(0, 5), []);

  return (
    <>
      <div className="brand-bar" />
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-divider safe-top">
        {/* Ticker — desktop/tablet only; cleaner mobile app chrome */}
        <div className="hidden md:block bg-background text-foreground py-1.5 overflow-hidden border-b border-divider">
          <div className="container flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <span className="flex items-center gap-2 shrink-0 z-10 bg-background pr-2">
                <span className="live-dot" />
                <span className="font-bold text-primary uppercase tracking-widest">Live</span>
              </span>
              <div className="flex-1 overflow-hidden relative">
                <div className="animate-header-marquee flex items-center gap-8">
                  {[...trendingPosts, ...trendingPosts].map((post, i) => (
                    <span key={`${post.slug}-${i}`} className="flex items-center gap-2 shrink-0">
                      <span className="text-primary/40">•</span>
                      <Link to={`/article/${post.slug}`} className="hover:text-primary transition-colors whitespace-nowrap font-medium text-muted-foreground">
                        {post.title}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 shrink-0 pl-4 bg-background z-10">
              <span className="text-muted-foreground tabular-nums">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="container py-2 md:py-2.5">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <img src={logoImg} alt="Za Ndani" className="h-9 w-9 md:h-12 md:w-auto rounded-lg md:rounded-sm object-cover" loading="eager" width={48} height={48} />
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-serif font-bold leading-none tracking-tight text-foreground">
                  Za Ndani
                </span>
                <span className="mt-0.5 text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  News · Culture
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Primary">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="px-2.5 py-2 text-sm font-semibold text-muted-foreground hover:text-primary rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <form
                className="hidden xl:flex items-center border border-divider px-2 py-1 rounded-md"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  if (!q) {
                    setIsSearchOpen(true);
                    return;
                  }
                  navigate(`/search?q=${encodeURIComponent(q)}`);
                }}
                role="search"
              >
                <Search className="w-4 h-4 text-muted-foreground mr-2" aria-hidden />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  aria-label="Search articles"
                  className="bg-transparent outline-none text-sm w-36 text-foreground placeholder:text-muted-foreground"
                />
              </form>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary text-foreground"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </Button>

              <Link
                to="/newsletter"
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 h-9 text-[11px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Mail className="w-3.5 h-3.5" aria-hidden />
                Newsletter
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary text-foreground"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              <Link to="/tv" className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-bold uppercase tracking-wider px-4 h-9 rounded-full">
                <Radio className="w-3.5 h-3.5" aria-hidden />
                Live TV
              </Link>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="lg:hidden border-t border-divider bg-background/98 backdrop-blur-xl animate-fade-in max-h-[70vh] overflow-y-auto" aria-label="Mobile">
            <div className="container py-3 space-y-0.5 pb-6">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center px-4 py-3.5 text-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-smooth font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-divider mt-2 space-y-2">
                <Link
                  to="/newsletter"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-primary/30 bg-primary/10 text-primary font-semibold"
                >
                  <Mail className="w-4 h-4" aria-hidden />
                  Newsletter
                </Link>
                <Link to="/about" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary">About</Link>
                <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary">Contact</Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes headerMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-header-marquee {
          display: flex;
          width: max-content;
          animation: headerMarquee 40s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-header-marquee { animation: none; }
        }
        .animate-header-marquee:hover {
          animation-play-state: paused;
        }
      ` }} />
    </>
  );
}
