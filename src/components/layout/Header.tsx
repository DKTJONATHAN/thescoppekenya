import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/posts";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-divider">
      {/* Top Bar */}
      <div className="bg-foreground text-background py-1.5">
        <div className="container flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="font-medium">Trending:</span>
              <Link to="/article/diamond-platnumz-announces-nairobi-concert" className="hover:text-primary transition-colors">
                Diamond Platnumz Concert
              </Link>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span>{new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <a 
              href="https://www.jonathanmwaniki.co.ke" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              By Jonathan Mwaniki
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-primary-foreground font-serif font-bold text-xl">S</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-serif font-bold text-headline leading-none">The Scoop</h1>
              <p className="text-xs text-primary font-medium tracking-wider">KENYA</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-smooth"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
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
            <Button className="hidden sm:flex gradient-primary text-primary-foreground hover:opacity-90 shadow-soft">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="mt-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search for news, gossip, entertainment..."
                className="w-full pl-12 pr-4 py-3 bg-surface border border-divider rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="lg:hidden border-t border-divider bg-background animate-fade-in">
          <div className="container py-4 space-y-1">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                className="block px-4 py-3 text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-smooth"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-divider mt-4">
              <Button className="w-full gradient-primary text-primary-foreground">
                Subscribe for Updates
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
