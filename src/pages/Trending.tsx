import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getAllPosts } from "@/lib/markdown";
import { TrendingUp, Eye, Flame, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

const allPostsFromMarkdown = getAllPosts();

const Trending = () => {
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/get-views');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setViewCounts(data);
      } catch (e) {
        console.error("View fetch failed");
      } finally {
        setLoading(false);
      }
    };
    fetchViews();
  }, []);

  // Sort posts by views (GA views + "New Site" bonus)
  const trendingPosts = useMemo(() => {
    return allPostsFromMarkdown
      .map(post => ({
        ...post,
        views: (viewCounts[`/article/${post.slug}`] || 0) + 47 // Maintaining your +47 bonus
      }))
      .sort((a, b) => b.views - a.views);
  }, [viewCounts]);

  return (
    <Layout>
      <Helmet>
        <title>Trending Stories - Za Ndani | What's Hot in Kenya</title>
        <meta name="description" content="The most read celebrity gossip and entertainment stories on Za Ndani right now." />
      </Helmet>

      <section className="py-12 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
              <Flame className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground dark:text-white">
              Trending Stories
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The hottest scoops, celebrity scandals, and Sheng updates that everyone in Nairobi is talking about right now.
            </p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 opacity-50">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {trendingPosts.map((post, index) => (
                <div key={post.slug} className="relative group">
                  {/* Rank Badge */}
                  <div className="absolute -top-3 -left-3 z-20 w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-black shadow-xl border-4 border-background">
                    {index + 1}
                  </div>
                  
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
          )}
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-16 bg-surface border-y border-divider">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Award className="w-12 h-12 text-primary mx-auto opacity-50" />
            <h2 className="text-2xl font-bold italic">"Habari kutoka ndani, bila bias."</h2>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Za Ndani Exclusive Analytics</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Trending;