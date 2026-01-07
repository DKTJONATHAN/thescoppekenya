import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getPostsByTag } from "@/lib/markdown";
import { ChevronLeft, Tag } from "lucide-react";

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = decodeURIComponent(tag || "");
  const posts = getPostsByTag(decodedTag);

  return (
    <Layout>
      <div className="bg-muted/50 border-b border-border">
        <div className="container max-w-7xl py-3">
          <Link 
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <section className="py-10">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-6 h-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                #{decodedTag}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {posts.length} {posts.length === 1 ? 'article' : 'articles'} tagged with "{decodedTag}"
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No articles found with this tag.</p>
              <Link 
                to="/" 
                className="inline-block mt-4 text-primary hover:underline"
              >
                Browse all articles
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
