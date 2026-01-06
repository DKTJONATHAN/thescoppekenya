import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Post, getTrendingPosts } from "@/data/posts";
import { ArticleCard } from "./ArticleCard";

interface TrendingSidebarProps {
  posts?: Post[];
}

export function TrendingSidebar({ posts }: TrendingSidebarProps) {
  const trendingPosts = posts || getTrendingPosts();

  return (
    <aside className="bg-surface rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-bold text-xl text-headline flex items-center gap-2">
          <span className="w-2 h-6 gradient-primary rounded-full" />
          Trending Now
        </h3>
        <Link to="/trending" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-0">
        {trendingPosts.slice(0, 5).map((post, index) => (
          <article key={post.slug} className="group flex items-start gap-4 py-4 border-b border-divider last:border-0">
            <span className="text-3xl font-serif font-bold text-primary/20 leading-none">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <Link to={`/article/${post.slug}`}>
                <h4 className="font-serif font-semibold text-headline group-hover:text-primary transition-colors line-clamp-2 text-sm mb-1">
                  {post.title}
                </h4>
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{post.category}</span>
                <span>•</span>
                <span>{post.readTime} min</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
