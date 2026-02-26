import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, TrendingUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchOverlay } from "@/components/SearchOverlay";
import { categories, getLatestPosts } from "@/lib/markdown";
import logoImg from "@/assets/logo.png";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Get actual trending posts (latest 3)
  const trendingPosts = useMemo(() => getLatestPosts(3), []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-divider">
        {/* Trending Ticker */}
        <div className="bg-foreground text-background py-1.5 overflow-hidden">
          <div className="container flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              <span className="flex items-center gap-1 shrink-0">
                <Flame className="w-3 h-3 text-primary" />
                <span className="font-bold text-primary uppercase tracking-wider">Moto:</span>
              </span>
              <div className="flex items-center gap-3 overflow-hidden">
                {trendingPosts.map((post, i) => (
                  <span key={post.slug} className="flex items-center gap-2 shrink-0">
                    {i > 0 && <span className="text-primary/40">•</span>}
                    <Link 
                      to={`/article/${post.slug}`} 
                      className="hover:text-primary transition-colors truncate max-w-[200px]"
                    >
                      {post.title}
                    </Link>
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 shrink-0">
              <span className="text-background/70">{new Date().toLocaleDateString('sw-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img src={logoImg} alt="Za Ndani — Bold. Unbiased. Insider." className="h-11 sm:h-14 w-auto rounded-full shadow-md group-hover:shadow-lg transition-shadow" />
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-serif font-bold leading-tight text-foreground">
                  Za <span className="text-primary">Ndani</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Bold · Unbiased · Insider
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {/* Added Trending Link */}
              <Link
                to="/trending"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-all"
              >
                <Flame className="w-4 h-4" />
                Trending
              </Link>
              
              {/* Categories Mapping */}
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={category.slug === 'sports' ? '/sports' : `/category/${category.slug}`}
                  className="px-3 py-2 text-sm font-semibold text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
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
              <Button className="hidden sm:flex gradient-primary text-primary-foreground hover:opacity-90 shadow-soft text-xs font-bold uppercase tracking-wider px-5">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden border-t border-divider bg-background animate-fade-in">
            <div className="container py-4 space-y-1">
              {/* Added Mobile Trending Link */}
              <Link
                to="/trending"
                className="flex items-center gap-2 px-4 py-3 text-primary hover:bg-primary/10 rounded-lg transition-smooth font-bold"
                onClick={() => setIsMenuOpen(false)}
              >
                <Flame className="w-5 h-5" />
                Trending
              </Link>

              {/* Mobile Categories Mapping */}
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={category.slug === 'sports' ? '/sports' : `/category/${category.slug}`}
                  className="block px-4 py-3 text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-smooth font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-divider mt-4">
                <Button className="w-full gradient-primary text-primary-foreground font-bold uppercase tracking-wider">
                  Subscribe
                </Button>
              </div>
            </div>
          </nav>
        )}
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}