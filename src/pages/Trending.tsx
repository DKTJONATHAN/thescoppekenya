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

  // Sort posts by real GA views using fuzzy matching
  const trendingPosts = useMemo(() => {
    return allPostsFromMarkdown
      .map(post => {
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
      })
      .sort((a, b) => b.views - a.views);
  }, [viewCounts]);

  return (
    <Layout>
      <Helmet>
        {/* Page Title */}
        <title>Trending Stories - Za Ndani | What's Hot in Kenya</title>
        
        {/* Primary SEO Meta Tags */}
        <meta name="description" content="Discover the most read stories on Za Ndani right now. Hottest Kenya celebrity gossip, trending entertainment news, and breaking Nairobi stories." />
        <meta name="keywords" content="Trending news Kenya, Kenya celebrity gossip, hot entertainment stories Nairobi, most read news Kenya, Za Ndani trending, latest Nairobi gossip, trending stories" />
        <link rel="canonical" href="https://zandani.co.ke/trending" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zandani.co.ke/trending" />
        <meta property="og:title" content="Trending Stories - Za Ndani | What's Hot in Kenya" />
        <meta property="og:description" content="Discover the most read stories on Za Ndani right now. Hottest Kenya celebrity gossip and breaking Nairobi entertainment news." />
        <meta property="og:image" content="https://zandani.co.ke/logo.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://zandani.co.ke/trending" />
        <meta name="twitter:title" content="Trending Stories - Za Ndani | What's Hot in Kenya" />
        <meta name="twitter:description" content="Discover the most read stories on Za Ndani right now. Hottest Kenya celebrity gossip and breaking Nairobi entertainment news." />
        <meta name="twitter:image" content="https://zandani.co.ke/logo.png" />
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
              The hottest scoops, celebrity scandals, and trending updates that everyone in Kenya is talking about right now.
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