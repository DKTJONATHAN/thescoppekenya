import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Flame, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchOverlay } from "@/components/SearchOverlay";
import { categories, getAllPosts } from "@/lib/markdown";
import logoImg from "@/assets/logo.png";

// PERF: Use cached posts, no view fetch
const allPostsFromMarkdown = getAllPosts();

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Show latest 5 posts as trending (no fetch needed)
  const trendingPosts = useMemo(() => allPostsFromMarkdown.slice(0, 5), []);

  return (
    <>
      <header className="sticky top-0 z-50">
        
        {/* Top bar — Date + Trending ticker */}
        <div className="bg-zinc-950 text-zinc-300 py-1 overflow-hidden border-b border-zinc-800">
          <div className="container max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <span className="flex items-center gap-1 shrink-0 z-10 bg-zinc-950 pr-2">
                <Flame className="w-3 h-3 text-primary" />
                <span className="font-bold text-primary uppercase tracking-wider text-[10px]">Trending:</span>
              </span>
              <div className="flex-1 overflow-hidden relative">
                <div className="animate-header-marquee flex items-center gap-6">
                  {[...trendingPosts, ...trendingPosts].map((post, i) => (
                    <span key={`${post.slug}-${i}`} className="flex items-center gap-1.5 shrink-0">
                      <span className="text-primary/50">•</span>
                      <Link 
                        to={`/article/${post.slug}`} 
                        className="hover:text-primary transition-colors whitespace-nowrap text-[11px]"
                      >
                        {post.title}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 shrink-0 pl-4 bg-zinc-950 z-10 text-[11px]">
              <span className="text-zinc-500">{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Main Header — Logo + Actions */}
        <div className="bg-background/95 backdrop-blur-md border-b border-border">
          <div className="container max-w-7xl mx-auto py-2.5">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2.5 group">
                <img src={logoImg} alt="Za Ndani" className="h-10 sm:h-12 w-auto rounded-full shadow-sm" loading="eager" width={48} height={48} />
                <div className="hidden sm:flex flex-col">
                  <span className="text-lg font-serif font-bold leading-tight text-foreground">
                    Za <span className="text-primary">Ndani</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-medium">
                    Bold · Unbiased · Insider
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="hover:bg-primary/10 hover:text-primary"
                  aria-label="Search articles"
                >
                  <Search className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden hover:bg-primary/10 hover:text-primary"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
                <Button className="hidden sm:flex gradient-primary text-primary-foreground hover:opacity-90 shadow-soft text-[10px] font-bold uppercase tracking-wider px-4 h-8">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Nav — Category links (desktop) */}
        <nav className="hidden lg:block bg-background border-b border-border">
          <div className="container max-w-7xl mx-auto">
            <div className="flex items-center gap-0 -mb-px">
              <Link
                to="/trending"
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-primary border-b-2 border-primary hover:bg-primary/5 transition-all"
              >
                <Flame className="w-3.5 h-3.5" />
                Trending
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={category.slug === 'sports' ? '/sports' : `/category/${category.slug}`}
                  className="px-4 py-2.5 text-xs font-semibold text-foreground hover:text-primary border-b-2 border-transparent hover:border-primary/30 transition-all"
                >
                  {category.name}
                </Link>
              ))}
              <div className="flex-1" />
              <Link to="/sports/live" className="flex items-center gap-1 px-3 py-2.5 text-xs font-bold text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live Scores
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden border-b border-border bg-background shadow-lg">
            <div className="container max-w-7xl mx-auto py-3 space-y-0.5">
              <Link
                to="/trending"
                className="flex items-center justify-between px-4 py-3 text-primary hover:bg-primary/5 font-bold text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center gap-2"><Flame className="w-4 h-4" /> Trending</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={category.slug === 'sports' ? '/sports' : `/category/${category.slug}`}
                  className="flex items-center justify-between px-4 py-3 text-foreground hover:text-primary hover:bg-primary/5 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}

              <Link
                to="/sports/live"
                className="flex items-center justify-between px-4 py-3 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 text-sm font-bold"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live Scores
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <div className="pt-3 px-4 border-t border-border mt-2">
                <Button className="w-full gradient-primary text-primary-foreground font-bold uppercase tracking-wider text-xs h-9">
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
