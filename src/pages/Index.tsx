import { useEffect, useState, useMemo, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { FeaturedStoryCard } from "@/components/articles/FeaturedStoryCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { getTodaysTopStory, getSecondaryPosts, getAllPosts, categories } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Zap, Flame, Clock, Newspaper, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

const POSTS_PER_PAGE = 12;

const allPostsFromMarkdown = getAllPosts();
const topStory = getTodaysTopStory();
const secondaryPosts = getSecondaryPosts(topStory?.slug, 4);
const tickerPosts = allPostsFromMarkdown.slice(0, 3);

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // Fetch actual views from our new API
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/get-views');
        const data = await res.json();
        setViewCounts(data);
      } catch (e) {
        console.error("View fetch failed");
      }
    };
    fetchViews();
  }, []);

  // Merge view counts with markdown data
  const allPosts = useMemo(() => {
    return allPostsFromMarkdown.map(post => ({
      ...post,
      views: viewCounts[`/article/${post.slug}`] || 0
    }));
  }, [viewCounts]);

  const displayedPosts = useMemo(
    () => allPosts.slice(0, visibleCount),
    [visibleCount, allPosts]
  );

  const hasMore = visibleCount < allPosts.length;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, allPosts.length));
        }
      },
      { threshold: 0.1, rootMargin: "800px 0px 0px 0px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, allPosts.length]);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani - Kenya Celebrity Gossip & Entertainment News</title>
        <link rel="canonical" href="https://zandani.co.ke" />
      </Helmet>

      <div className="bg-surface border-b border-divider py-2 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 flex items-center gap-4">
          <Badge variant="default" className="gradient-primary text-primary-foreground border-0 rounded-sm font-bold whitespace-nowrap">
            ZA NDANI
          </Badge>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div className="flex items-center animate-marquee hover:pause">
              {[...tickerPosts, ...tickerPosts].map((post, idx) => (
                <span key={idx} className="inline-flex items-center">
                  • {post.title} <span className="mx-8">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CategoryBar />

      <section className="py-10 bg-surface/50 border-y border-divider">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
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
                    {/* The Views Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-black/60 backdrop-blur-md text-white border-0 flex items-center gap-1.5 px-3 py-1">
                        <Eye className="w-3.5 h-3.5" />
                        {post.views > 999 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && <div ref={sentinelRef} className="h-20" />}

              <div className="mt-12 text-center">
                {hasMore ? (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, allPosts.length))}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 py-6 rounded-2xl text-lg font-bold"
                  >
                    Load More Stories
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground font-medium">You've seen all {allPosts.length} stories 🎉</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <TrendingSidebar />
            </div>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 30s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      ` }} />
    </Layout>
  );
};

export default Index;