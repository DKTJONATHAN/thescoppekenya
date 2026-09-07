import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchOverlay } from "@/components/SearchOverlay";
import { getAllPosts } from "@/lib/markdown";
import { primaryNavLinks } from "@/lib/site-links";
import logoImg from "@/assets/logo.png";

const allPostsFromMarkdown = getAllPosts();

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const trendingPosts = useMemo(() => allPostsFromMarkdown.slice(0, 5), []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-divider">
        <div className="bg-zinc-950 text-zinc-100 py-1.5 overflow-hidden border-b border-divider">
          <div className="container flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <span className="flex items-center gap-1 shrink-0 z-10 bg-zinc-950 pr-2">
                <Flame className="w-3 h-3 text-primary" />
                <span className="font-bold text-primary uppercase tracking-wider">Trending:</span>
              </span>
              <div className="flex-1 overflow-hidden relative">
                <div className="animate-header-marquee flex items-center gap-8">
                  {[...trendingPosts, ...trendingPosts].map((post, i) => (
                    <span key={`${post.slug}-${i}`} className="flex items-center gap-2 shrink-0">
                      <span className="text-primary/40">•</span>
                      <Link to={`/article/${post.slug}`} className="hover:text-primary transition-colors whitespace-nowrap font-medium text-zinc-100">
                        {post.title}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 shrink-0 pl-4 bg-zinc-950 z-10">
              <span className="text-zinc-400">{new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="container py-2.5">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <img src={logoImg} alt="Za Ndani" className="h-10 sm:h-12 w-auto rounded-full shadow-md" loading="eager" width={48} height={48} />
              <div className="hidden sm:flex flex-col">
                <span className="text-base font-serif font-bold leading-tight text-foreground">
                  Za <span className="text-primary">Ndani</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  Bold · Unbiased · Insider
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={
                    link.featured
                      ? "flex items-center gap-1 px-2.5 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-all"
                      : "px-2.5 py-2 text-sm font-semibold text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                  }
                >
                  {link.featured ? <Flame className="w-3.5 h-3.5" /> : null}
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <form
                className="hidden xl:flex items-center border border-divider px-2 py-1 rounded-md"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!searchQuery.trim()) return;
                  window.location.href = `/tag/${encodeURIComponent(searchQuery.trim())}`;
                }}
              >
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent outline-none text-sm w-36 text-foreground placeholder:text-muted-foreground"
                />
              </form>
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="touch-target hover:bg-primary/10 hover:text-primary text-foreground" aria-label="Search">
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden touch-target hover:bg-primary/10 hover:text-primary text-foreground"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <Button className="hidden sm:flex gradient-primary text-primary-foreground hover:opacity-90 shadow-soft text-[11px] font-bold uppercase tracking-wider px-4 h-9">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="lg:hidden border-t border-divider bg-background animate-fade-in max-h-[70vh] overflow-y-auto">
            <div className="container py-3 space-y-0.5">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={
                    link.featured
                      ? "flex items-center gap-2 px-4 py-3.5 text-primary hover:bg-primary/10 rounded-xl transition-smooth font-bold touch-target"
                      : "flex items-center px-4 py-3.5 text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-smooth font-semibold touch-target"
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.featured ? <Flame className="w-5 h-5" /> : null}
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-divider mt-2 space-y-2">
                <Link to="/about" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary">About</Link>
                <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary">Contact</Link>
                <Button className="w-full gradient-primary text-primary-foreground font-bold uppercase tracking-wider h-12 rounded-xl">
                  Subscribe
                </Button>
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
        .animate-header-marquee:hover {
          animation-play-state: paused;
        }
      ` }} />
    </>
  );
}
