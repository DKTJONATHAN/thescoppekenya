import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchPosts, Post } from '@/lib/markdown';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);

  useEffect(() => {
    if (query.length >= 2) {
      const found = searchPosts(query);
      setResults(found);
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="container max-w-3xl pt-20">
        {/* Search Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search for news, gossip, entertainment..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg bg-surface border border-divider rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth"
              autoFocus
            />
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-surface rounded-xl transition-colors"
            aria-label="Close search"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length >= 2 && results.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No results found for "{query}"
            </p>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((post) => (
                <Link
                  key={post.slug}
                  to={`/article/${post.slug}`}
                  onClick={onClose}
                  className="flex gap-4 p-4 bg-surface rounded-xl hover:bg-surface/80 border border-divider hover:border-primary transition-smooth group"
                >
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-primary font-medium uppercase tracking-wider">
                      {post.category}
                    </span>
                    <h3 className="font-serif font-bold text-headline group-hover:text-primary transition-colors line-clamp-2 mt-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {query.length < 2 && (
            <p className="text-center text-muted-foreground py-12">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
