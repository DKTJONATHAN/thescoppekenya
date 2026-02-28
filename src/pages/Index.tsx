import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Eye, Flame, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

// PERFORMANCE: Lazy load components that are not visible on initial mobile screen
const CategoryBar = lazy(() => import("@/components/articles/CategoryBar").then(m => ({ default: m.CategoryBar })));
const ArticleCard = lazy(() => import("@/components/articles/ArticleCard").then(m => ({ default: m.ArticleCard })));

const POSTS_PER_PAGE = 8; // Reduced for mobile initial speed
const allPostsFromMarkdown = getAllPosts();

// Loading placeholder to prevent Layout Shift (CLS)
const SectionLoader = () => (
  <div className="flex items-center justify-center py-20 w-full">
    <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
  </div>
);

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  // PERFORMANCE: Delay view fetching until after the first paint
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/get-views');
        if (res.ok) {
          const data = await res.json();
          setViewCounts(data);
        }
      } catch (e) {
        console.error("View sync deferred");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // PERFORMANCE: Memoize expensive slug matching to keep Main Thread clear
  const allPostsWithViews = useMemo(() => {
    return allPostsFromMarkdown.map(post => {
      const cleanSlug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const gaViews = viewCounts[`/article/${cleanSlug}`] || 
                     viewCounts[`/article/${cleanSlug}/`] || 0;
      return { ...post, views: gaViews > 0 ? gaViews : 47 };
    });
  }, [viewCounts]);

  const topStory = useMemo(() => {
    const today = new Date().toDateString();
    const todays = allPostsWithViews.filter(p => new Date(p.date).toDateString() === today);
    return todays.length > 0 ? [...todays].sort((a, b) => b.views - a.views)[0] : allPostsWithViews[0];
  }, [allPostsWithViews]);

  const recentPostsForBento = useMemo(() => 
    allPostsWithViews.filter(p => p.slug !== topStory?.slug).slice(0, 6)
  , [allPostsWithViews, topStory]);

  const trendingPosts = useMemo(() => 
    [...allPostsWithViews].sort((a, b) => b.views - a.views).slice(0, 5)
  , [allPostsWithViews]);

  const displayedPosts = allPostsWithViews.slice(0, visibleCount);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount(prev => prev + POSTS_PER_PAGE);
    }, { rootMargin: "400px" });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani - Kenya's Hottest Celebrity Gossip</title>
        {/* Critical CSS for LCP */}
        <style>{`
          .hero-gradient { background: linear-gradient(to right, black, rgba(0,0,0,0.4), transparent); }
          @media (max-width: 768px) { .hero-gradient { background: linear-gradient(to top, black, rgba(0,0,0,0.2)); } }
        `}</style>
      </Helmet>

      {/* 1. HERO SECTION (NON-LAZY) */}
      {topStory && (
        <section className="relative h-[80vh] md:h-[85vh] flex items-center bg-black overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={topStory.image || '/images/placeholder-hero.jpg'} 
              alt=""
              // PERFORMANCE: Fetch Priority "high" tells browser to grab this before JS
              fetchpriority="high" 
              loading="eager"
              className="w-full h-full object-cover opacity-60 scale-105"
            />
            <div className="absolute inset-0 hero-gradient z-10" />
          </div>

          <div className="relative container max-w-7xl mx-auto px-4 z-20">
            <div className="max-w-4xl space-y-6">
              <Badge className="bg-primary hover:bg-primary text-white border-0 px-4 py-1 rounded-full animate-pulse">
                <Flame className="w-3 h-3 mr-2 fill-current" /> SENSATIONAL
              </Badge>
              <h1 className="text-4xl md:text-7xl font-serif font-black text-white leading-[0.9] tracking-tighter">
                {topStory.title}
              </h1>
              <p className="text-zinc-300 text-lg md:text-xl max-w-xl line-clamp-2 italic border-l-4 border-primary pl-4">
                {topStory.excerpt}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to={`/article/${topStory.slug}`}>
                  <Button size="lg" className="bg-primary text-white rounded-full px-8 py-7 text-lg font-black group transition-all">
                    READ SCOOP <ArrowRight className="ml-2 group-hover:translate-x-2 transition" />
                  </Button>
                </Link>
                <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-2 text-white font-bold">
                  <Eye className="w-4 h-4" /> {topStory.views} fans reading
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. LAZY LOADED CATEGORY BAR */}
      <Suspense fallback={<div className="h-12 bg-zinc-900" />}>
        <CategoryBar />
      </Suspense>

      {/* 3. BENTO GRID (LAZY) */}
      <Suspense fallback={<SectionLoader />}>
        <section className="py-16 bg-[#050505]">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-10">
              <Sparkles className="text-primary w-6 h-6" />
              <h2 className="text-3xl font-serif font-black text-white italic">The Latest Juice</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 aspect-[16/10] md:aspect-auto md:h-[500px] rounded-[2rem] overflow-hidden border border-white/5">
                <ArticleCard post={recentPostsForBento[0]} variant="featured" />
              </div>
              <div className="md:col-span-4 grid grid-cols-1 gap-6">
                {recentPostsForBento.slice(1, 3).map(post => (
                  <div key={post.slug} className="rounded-[2rem] overflow-hidden bg-zinc-900/50 border border-white/5">
                    <ArticleCard post={post} variant="compact" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Suspense>

      {/* 4. MAIN FEED & SIDEBAR (LAZY) */}
      <Suspense fallback={<SectionLoader />}>
        <section className="py-20 border-t border-white/5">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-16">
              {/* Feed */}
              <div className="lg:col-span-8 space-y-12">
                <h3 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <div className="w-10 h-[2px] bg-primary" /> More Stories
                </h3>
                <div className="grid md:grid-cols-2 gap-10">
                  {displayedPosts.map(post => (
                    <ArticleCard key={post.slug} post={post} />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-10 w-full" />
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                <div className="sticky top-24 p-8 rounded-[2.5rem] bg-zinc-950 border border-white/5 shadow-2xl">
                  <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2">
                    <TrendingUp className="text-primary w-5 h-5" /> TRENDING NOW
                  </h3>
                  <div className="space-y-8">
                    {trendingPosts.map((post, i) => (
                      <Link key={post.slug} to={`/article/${post.slug}`} className="group flex gap-4 items-center">
                        <span className="text-4xl font-black text-zinc-800 group-hover:text-primary/30 transition-colors italic">
                          {i + 1}
                        </span>
                        <h4 className="text-zinc-300 font-bold group-hover:text-white transition-colors line-clamp-2 leading-tight">
                          {post.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </Suspense>
    </Layout>
  );
};

export default Index;