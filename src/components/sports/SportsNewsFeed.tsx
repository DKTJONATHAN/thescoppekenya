import { getPostsByCategory } from "@/lib/markdown";
import { ArticleCard } from "@/components/articles/ArticleCard";

export function SportsNewsFeed() {
  const sportsPosts = getPostsByCategory('sports');

  if (sportsPosts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No sports articles yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sportsPosts.slice(0, 4).map((post) => (
        <ArticleCard key={post.slug} post={post} variant="horizontal" />
      ))}
    </div>
  );
}
