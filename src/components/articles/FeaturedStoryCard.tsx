import { Link } from "react-router-dom";
import { Clock, TrendingUp, Eye } from "lucide-react";
import { Post } from "@/lib/markdown";
import { Badge } from "@/components/ui/badge";

interface FeaturedStoryCardProps {
  post: Post;
}

export function FeaturedStoryCard({ post }: FeaturedStoryCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('en-KE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <article className="group relative rounded-3xl overflow-hidden bg-foreground text-background h-full min-h-[400px] md:min-h-[500px]">
      {/* Background Image with Parallax-like Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={post.image}
          alt={post.imageAlt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          loading="eager"
          fetchPriority="high"
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
      </div>

      {/* Floating Labels */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
        <Badge className="bg-primary text-primary-foreground border-0 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg">
          <TrendingUp className="w-3 h-3 mr-1.5" />
          Top Story
        </Badge>
        <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-0 px-3 py-1.5 rounded-full text-xs">
          <Eye className="w-3 h-3 mr-1" />
          {Math.floor(Math.random() * 50 + 10)}k views
        </Badge>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 lg:p-10">
        {/* Category Chip */}
        <div className="mb-4">
          <Link to={`/category/${post.category.toLowerCase()}`}>
            <Badge 
              variant="outline" 
              className="bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20 transition-colors px-4 py-1 rounded-full"
            >
              {post.category}
            </Badge>
          </Link>
        </div>

        {/* Headline */}
        <Link to={`/article/${post.slug}`} className="group/title">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif font-black mb-4 leading-tight text-white group-hover/title:text-primary transition-colors duration-300 drop-shadow-lg">
            {post.title}
          </h1>
        </Link>

        {/* Excerpt with fade */}
        <p className="text-white/80 mb-6 line-clamp-2 md:line-clamp-3 max-w-2xl text-base md:text-lg leading-relaxed">
          {post.excerpt}
        </p>

        {/* Meta Bar */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
          {/* Author */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
            {post.authorImage && (
              <img 
                src={post.authorImage} 
                alt={post.author} 
                className="w-6 h-6 rounded-full object-cover ring-2 ring-white/30" 
              />
            )}
            <span className="font-medium text-white">{post.author}</span>
          </div>
          
          <span className="hidden md:inline text-white/40">•</span>
          
          {/* Date */}
          <span className="text-white/80">{formattedDate}</span>
          
          <span className="hidden md:inline text-white/40">•</span>
          
          {/* Read Time */}
          <span className="flex items-center gap-1.5 text-white/80">
            <Clock className="w-4 h-4" />
            {post.readTime} min read
          </span>
        </div>

        {/* Read More CTA - appears on hover */}
        <Link 
          to={`/article/${post.slug}`}
          className="mt-6 inline-flex items-center gap-2 text-primary font-bold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
        >
          Read Full Story
          <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </article>
  );
}
