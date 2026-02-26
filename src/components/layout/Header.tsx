import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, TrendingUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchOverlay } from "@/components/SearchOverlay";
import { categories, getAllPosts } from "@/lib/markdown";
import logoImg from "@/assets/logo.png";

const allPostsFromMarkdown = getAllPosts();

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // Fetch GA4 views from our internal API
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/get-views');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setViewCounts(data);
      } catch (e) {
        console.error("View fetch failed in header");
      }
    };
    fetchViews();
  }, []);

  // Calculate the Top 5 Trending Posts dynamically
  const trendingPosts = useMemo(() => {
    // If views haven't loaded yet, show the latest 5 as a fallback
    if (Object.keys(viewCounts).length === 0) {
      return allPostsFromMarkdown.slice(0, 5);
    }

    return allPostsFromMarkdown
      .map(post => {
        const cleanSlug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
        const exactPath = `/article/${cleanSlug}`;
        const pathWithSlash = `/article/${cleanSlug}/`;
        const fallbackPath = `/posts/${cleanSlug}`; 
        
        const gaViews = viewCounts[exactPath] || 
                        viewCounts[pathWithSlash] || 
                        viewCounts[fallbackPath] || 
                        0;

        return {
          ...post,
          views: gaViews > 0 ? gaViews : 47
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5); // Grab exactly the top 5
  }, [viewCounts]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-divider">
        
        {/* Dynamic Sliding Trending Ticker */}
        <div className="bg-foreground text-background py-1.5 overflow-hidden">
          <div className="container flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              
              {/* Static Label */}
              <span className="flex items-center gap-1 shrink-0 z-10 bg-foreground pr-2">
                <Flame className="w-3 h-3 text-primary" />
                <span className="font-bold text-primary uppercase tracking-wider">Trending:</span>
              </span>
              
              {/* Animated Sliding Links */}
              <div className="flex-1 overflow-hidden relative">
                <div className="animate-header-marquee flex items-center gap-8">
                  {/* We duplicate the array twice to create a seamless infinite loop */}
                  {[...trendingPosts, ...trendingPosts].map((post, i) => (
                    <span key={`${post.slug}-${i}`} className="flex items-center gap-2 shrink-0">
                      <span className="text-primary/40">•</span>
                      <Link 
                        to={`/article/${post.slug}`} 
                        className="hover:text-primary transition-colors whitespace-nowrap font-medium"
                      >
                        {post.title}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>

            </div>
            
            {/* Date */}
            <div className="hidden md:flex items-center gap-4 shrink-0 pl-4 bg-foreground z-10">
              <span className="text-background/70">{new Date().toLocaleDateString('sw-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img src={logoImg} alt="Za Ndani - Bold. Unbiased. Insider." className="h-11 sm:h-14 w-auto rounded-full shadow-md group-hover:shadow-lg transition-shadow" />
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
              <Link
                to="/trending"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-all"
              >
                <Flame className="w-4 h-4" />
                Trending
              </Link>
              
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
              <Link
                to="/trending"
                className="flex items-center gap-2 px-4 py-3 text-primary hover:bg-primary/10 rounded-lg transition-smooth font-bold"
                onClick={() => setIsMenuOpen(false)}
              >
                <Flame className="w-5 h-5" />
                Trending
              </Link>

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

      {/* CSS for the sliding animation */}
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