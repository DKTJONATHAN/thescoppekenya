import { useEffect, useState, useMemo, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

const POSTS_PER_PAGE = 12;

const allPostsFromMarkdown = getAllPosts();

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

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

  // Strict filter: only posts published TODAY
  const isPostedToday = (dateStr: string | Date): boolean => {
    const postDate = new Date(dateStr);
    const today = new Date();
    return postDate.getFullYear() === today.getFullYear() &&
           postDate.getMonth() === today.getMonth() &&
           postDate.getDate() === today.getDate();
  };

  // Most viewed story posted TODAY only
  const topStory = useMemo(() => {
    const todaysPosts = allPostsWithViews.filter(post => isPostedToday(post.date));
    if (todaysPosts.length === 0) return null;
    return [...todaysPosts].sort((a, b) => b.views - a.views)[0];
  }, [allPostsWithViews]);

  // Trending posts (excluding today's top for variety)
  const trendingPosts = useMemo(() => {
    return [...allPostsWithViews]
      .filter(p => p.slug !== topStory?.slug)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  }, [allPostsWithViews, topStory]);

  const displayedPosts = useMemo(() => {
    const filtered = allPostsWithViews.filter(p => p.slug !== topStory?.slug);
    return filtered.slice(0, visibleCount);
  }, [visibleCount, allPostsWithViews, topStory]);

  const hasMore = visibleCount < allPostsWithViews.length - (topStory ? 1 : 0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, allPostsWithViews.length - (topStory ? 1 : 0)));
        }
      },
      { threshold: 0.1, rootMargin: "800px 0px 0px 0px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, allPostsWithViews.length, topStory]);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani - Kenya Celebrity Gossip & Entertainment News | Trending Sheng Stories</title>
        <meta name="description" content="Hottest Kenya celebrity gossip and trending news." />
        <link rel="canonical" href="https://zandani.co.ke" />
      </Helmet>

      <CategoryBar />

      {/* HERO - Strictly Today's Most Viewed Story */}
      {topStory && (
        <section className="relative h-[75vh] min-h-[520px] flex items-end overflow-hidden">
          <img 
            src={topStory.image || topStory.coverImage || '/images/placeholder-hero.jpg'} 
            alt={topStory.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/90" />
          
          <div className="relative container max-w-7xl mx-auto px-4 pb-20 z-10 text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-1.5 rounded-full text-sm mb-6">
              <TrendingUp className="w-4 h-4" />
              TODAY'S MOST VIEWED
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight max-w-4xl tracking-tight">
              {topStory.title}
            </h1>
            
            {topStory.excerpt && (
              <p className="mt-6 max-w-2xl text-lg md:text-xl text-white/90">
                {topStory.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-10">
              <Link to={`/article/${topStory.slug}`}>
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-white/90 text-base px-10 py-7 rounded-2xl font-bold flex items-center gap-3 group"
                >
                  Read Full Story
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </Button>
              </Link>

              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-6 py-3 rounded-2xl">
                <Eye className="w-5 h-5" />
                <span className="font-semibold">
                  {topStory.views > 999 ? `${(topStory.views / 1000).toFixed(1)}K` : topStory.views} views today
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 bg-surface/50 border-y border-divider">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Main Feed */}
            <div className="lg:col-span-8 space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold text-foreground dark:text-white flex items-center gap-3">
                  <span className="w-1.5 h-9 bg-gradient-to-b from-primary to-purple-600 rounded-full" />
                  Latest Za Ndani
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {displayedPosts.map((post) => (
                  <div key={post.slug} className="relative group">
                    <ArticleCard post={post} />
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-black/70 backdrop-blur-md text-white border-0 flex items-center gap-1.5 px-3 py-1 shadow-lg">
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
                    onClick={() => setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, allPostsWithViews.length - (topStory ? 1 : 0)))}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 py-6 rounded-2xl text-lg font-bold"
                  >
                    Load More Hot Stories
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>

            {/* Enhanced Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-8 space-y-8">
                <div className="bg-surface rounded-3xl p-7 border border-divider shadow-sm">
                  <h3 className="text-2xl font-bold mb-7 flex items-center gap-3">
                    <TrendingUp className="text-primary" /> 
                    Trending Now in Kenya
                  </h3>
                  <div className="space-y-7">
                    {trendingPosts.map((post, index) => (
                      <Link 
                        to={`/article/${post.slug}`} 
                        key={post.slug} 
                        className="flex gap-5 group hover:scale-[1.02] transition-transform"
                      >
                        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-2xl">
                          <img 
                            src={post.image || post.coverImage || '/images/placeholder.jpg'} 
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-muted-foreground/40">0{index + 1}</span>
                          </div>
                          <h4 className="font-bold leading-tight group-hover:text-primary line-clamp-3 transition-colors">
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> 
                              {post.views > 999 ? `${(post.views/1000).toFixed(1)}k` : post.views}
                            </span>
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
        </div>
      </section>
    </Layout>
  );
};

export default Index;