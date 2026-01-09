import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchOverlay } from "@/components/SearchOverlay";
import { categories } from "@/lib/markdown";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
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
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-headline">
                The Scoop <span className="text-primary">KE</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={category.slug === 'sports' ? '/sports' : `/category/${category.slug}`}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-smooth"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
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
              <Button className="hidden sm:flex gradient-primary text-primary-foreground hover:opacity-90 shadow-soft">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden border-t border-divider bg-background animate-fade-in">
            <div className="container py-4 space-y-1">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={category.slug === 'sports' ? '/sports' : `/category/${category.slug}`}
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

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
