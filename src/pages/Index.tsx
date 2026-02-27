import { useEffect, useState, useMemo, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getTodaysTopStory, getSecondaryPosts, getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

const POSTS_PER_PAGE = 12;

const allPostsFromMarkdown = getAllPosts();
const topStory = getTodaysTopStory();

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
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
  const allPostsWithViews = useMemo(() => {
    return allPostsFromMarkdown.map(post => {
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
  }, [viewCounts]);

  // Sort posts for the Trending Sidebar
  const trendingPosts = useMemo(() => {
    return [...allPostsWithViews]
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  }, [allPostsWithViews]);

  const displayedPosts = useMemo(
    () => allPostsWithViews.slice(0, visibleCount),
    [visibleCount, allPostsWithViews]
  );

  const hasMore = visibleCount < allPostsWithViews.length;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, allPostsWithViews.length));
        }
      },
      { threshold: 0.1, rootMargin: "800px 0px 0px 0px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, allPostsWithViews.length]);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani - Kenya Celebrity Gossip & Entertainment News | Trending Sheng Stories</title>
        <meta name="description" content="Hottest Kenya celebrity gossip and trending news." />
        <link rel="canonical" href="https://zandani.co.ke" />
      </Helmet>

      <CategoryBar />

      <section className="py-10 bg-surface/50 border-y border-divider">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold text-foreground dark:text-white flex items-center gap-3">
                  <span className="w-1.5 h-9 gradient-primary rounded-full shadow-sm" />
                  Latest Za Ndani
                </h2>
              </div>

              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8">
                {displayedPosts.map((post) => (
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

              {hasMore && <div ref={sentinelRef} className="h-20" />}

              {hasMore && (
                <div className="mt-12 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, allPostsWithViews.length))}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 py-6 rounded-2xl text-lg font-bold"
                  >
                    Load More Stories
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-surface rounded-3xl p-6 border border-divider shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="text-primary" /> Trending Now
                </h3>
                <div className="space-y-6">
                  {trendingPosts.map((post, index) => (
                    <Link to={`/article/${post.slug}`} key={post.slug} className="flex gap-4 group">
                      <span className="text-2xl font-black text-muted-foreground/30 italic">0{index + 1}</span>
                      <div className="space-y-1">
                        <h4 className="font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views}</span>
                            <span>•</span>
                            <span>{post.date}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;