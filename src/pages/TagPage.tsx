import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getPostsByTag } from "@/lib/markdown";
import { ChevronLeft, Tag, Eye } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  
  const decodedTag = tag ? decodeURIComponent(tag) : "";
  const posts = useMemo(() => getPostsByTag(decodedTag), [decodedTag]);

  // View tracking state
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // Fetch GA4 views from internal API
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/get-views');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setViewCounts(data);
      } catch (e) {
        console.error("View fetch failed");
      }
    };
    fetchViews();
  }, []);

  // Combine markdown data with live view counts
  const postsWithViews = useMemo(() => {
    return posts.map(post => {
      const cleanSlug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const exactPath = `/article/${cleanSlug}`;
      const pathWithSlash = `/article/${cleanSlug}/`;
      const fallbackPath = `/posts/${cleanSlug}`; 

      const gaViews = viewCounts[exactPath] || 
                      viewCounts[pathWithSlash] || 
                      viewCounts[fallbackPath] || 
                      0;

      const displayViews = gaViews > 0 ? gaViews : 47;

      return {
        ...post,
        views: displayViews
      };
    });
  }, [posts, viewCounts]);

  // Early return must happen after all hooks are called
  if (!tag) return null; 

  // Optional: nicer display name
  const displayTag = decodedTag
    .split(/[-_ ]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <Layout>
      <Helmet>
        <title>#{displayTag} - The Scoop KE</title>
        <meta name="description" content={`Articles tagged with "${displayTag}" on The Scoop Kenya`} />
        <link rel="canonical" href={`https://thescoopke.com/tag/${tag}`} />
      </Helmet>

      <div className="bg-muted/50 border-b border-border">
        <div className="container max-w-7xl py-3">
          <Link
            to="/"
            aria-label="Back to home page"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <section className="py-10">
        <div className="container max-w-7xl mx-auto px-4">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-6 h-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                #{displayTag}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {postsWithViews.length} {postsWithViews.length === 1 ? "article" : "articles"} tagged with "{displayTag}"
            </p>
          </header>

          {postsWithViews.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {postsWithViews.map((post) => (
                <div key={post.slug} className="relative group">
                  <ArticleCard post={post} />
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-black/60 backdrop-blur-md text-white border-0 flex items-center gap-1.5 px-3 py-1 shadow-lg">
                      <Eye className="w-3.5 h-3.5" />
                      {post.views > 999 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No articles found with tag "{displayTag}".
              </p>
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