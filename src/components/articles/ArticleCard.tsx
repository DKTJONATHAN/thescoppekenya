import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Post } from "@/lib/markdown";
import { Badge } from "@/components/ui/badge";

interface ArticleCardProps {
  post: Post;
  variant?: "default" | "featured" | "horizontal" | "compact";
}

export function ArticleCard({ post, variant = "default" }: ArticleCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (variant === "featured") {
    return (
      <article className="group relative rounded-2xl overflow-hidden bg-foreground text-background aspect-[16/10] md:aspect-[16/9]">
        <img
          src={post.image}
          alt={post.imageAlt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <Badge className="w-fit mb-3 gradient-primary text-primary-foreground border-0">
            {post.category}
          </Badge>
          <Link to={`/article/${post.slug}`}>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-serif font-bold mb-3 group-hover:text-primary transition-colors line-clamp-3">
              {post.title}
            </h2>
          </Link>
          <p className="text-background/80 mb-4 line-clamp-2 max-w-2xl">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-4 text-sm text-background/70">
            <div className="flex items-center gap-2">
              {post.authorImage && (
                <img src={post.authorImage} alt={post.author} className="w-8 h-8 rounded-full object-cover" />
              )}
              <span>{post.author}</span>
            </div>
            <span>•</span>
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime} min read
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="group flex gap-4 md:gap-6">
        <Link to={`/article/${post.slug}`} className="flex-shrink-0 w-32 md:w-48">
          <div className="aspect-[4/3] rounded-xl overflow-hidden">
            <img
              src={post.image}
              alt={post.imageAlt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </div>
        </Link>
        <div className="flex flex-col justify-center min-w-0">
          <Badge variant="secondary" className="w-fit mb-2 text-xs">
            {post.category}
          </Badge>
          <Link to={`/article/${post.slug}`}>
            <h3 className="font-serif font-bold text-headline group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{post.readTime} min</span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group flex items-start gap-4 py-4 border-b border-divider last:border-0">
        <span className="text-4xl font-serif font-bold text-muted-foreground/30 leading-none">
          {String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}
        </span>
        <div>
          <Link to={`/article/${post.slug}`}>
            <h4 className="font-serif font-bold text-headline group-hover:text-primary transition-colors line-clamp-2 mb-1">
              {post.title}
            </h4>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{post.category}</span>
            <span>•</span>
            <span>{post.readTime} min read</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group">
      <Link to={`/article/${post.slug}`} className="block mb-4">
        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted">
          <img
            src={post.image}
            alt={post.imageAlt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </div>
      </Link>
      <Badge variant="secondary" className="mb-3">
        {post.category}
      </Badge>
      <Link to={`/article/${post.slug}`}>
        <h3 className="font-serif font-bold text-lg text-headline group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {post.title}
        </h3>
      </Link>
      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
        {post.excerpt}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {post.authorImage && (
            <img src={post.authorImage} alt={post.author} className="w-6 h-6 rounded-full object-cover" />
          )}
          <span>{post.author}</span>
        </div>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {post.readTime} min
        </span>
      </div>
    </article>
  );
}
