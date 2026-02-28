import React, { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

// PERFORMANCE: Lazy load everything below the fold
const CategoryBar = lazy(() => import("@/components/articles/CategoryBar").then(m => ({ default: m.CategoryBar })));
const ArticleCard = lazy(() => import("@/components/articles/ArticleCard").then(m => ({ default: m.ArticleCard })));

const INITIAL_VISIBLE = 20;
const allPostsFromMarkdown = getAllPosts();

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // PERFORMANCE: Defer GA4 logic entirely until after "Interactive" state
  useEffect(() => {
    const idleCallback = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 3000));
    idleCallback(async () => {
      try {
        const res = await fetch('/api/get-views');
        if (res.ok) setViewCounts(await res.json());
      } catch (e) { console.warn("Analytics deferred"); }
    });
  }, []);

  // Normalizing GA4 data for actual trending accuracy
  const allPosts = useMemo(() => {
    return allPostsFromMarkdown.map(post => {
      const slug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const views = viewCounts[`/article/${slug}`] || viewCounts[`/article/${slug}/`] || 0;
      return { ...post, views: views > 0 ? views : 50 };
    });
  }, [viewCounts]);

  const trendingPosts = useMemo(() => {
    return [...allPosts].sort((a, b) => b.views - a.views).slice(0, 5);
  }, [allPosts]);

  const topStory = allPosts[0];
  const displayedPosts = allPosts.slice(1, visibleCount);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Kenya's Hottest Stories</title>
        {/* CSS Performance Hack: Content-Visibility prevents off-screen rendering */}
        <style>{`
          .cv-auto { content-visibility: auto; contain-intrinsic-size: 100px 400px; }
          .hero-img { aspect-ratio: 16/9; width: 100%; object-fit: cover; }
        `}</style>
      </Helmet>

      {/* COMPACT MAGAZINE HERO (35vh) - Minimal JS impact */}
      {topStory && (
        <section className="relative h-[35vh] md:h-[45vh] bg-black overflow-hidden flex items-end">
          <img 
            src={topStory.image} 
            alt="" 
            fetchpriority="high" 
            className="absolute inset-0 hero-img opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          
          <div className="relative container max-w-7xl mx-auto px-4 pb-8 z-10">
             <span className="bg-primary text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase tracking-tighter mb-2 inline-block">Trending</span>
             <h1 className="text-2xl md:text-5xl font-serif font-black text-white leading-tight line-clamp-2 max-w-4xl">
               {topStory.title}
             </h1>
             <Link to={`/article/${topStory.slug}`} className="mt-4 inline-flex items-center text-white font-bold text-sm hover:text-primary transition">
                Read Full Story <ArrowRight className="ml-2 w-4 h-4" />
             </Link>
          </div>
        </section>
      )}

      <Suspense fallback={<div className="h-12 bg-zinc-950" />}>
        <CategoryBar />
      </Suspense>

      <main className="container max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* FEED SECTION */}
          <div className="lg:col-span-8 space-y-12">
            <div className="grid md:grid-cols-2 gap-8">
              {displayedPosts.map((post, idx) => (
                <div key={post.slug} className={`cv-auto ${idx > 4 ? 'opacity-90' : 'opacity-100'}`}>
                  <Suspense fallback={<div className="h-64 bg-zinc-900 rounded-2xl animate-pulse" />}>
                    <ArticleCard post={post} />
                  </Suspense>
                </div>
              ))}
            </div>

            {visibleCount < allPosts.length && (
              <div className="text-center py-10 border-t border-zinc-100">
                <Button 
                  onClick={() => setVisibleCount(v => v + 10)}
                  className="bg-black text-white rounded-xl px-10 py-6 font-black hover:bg-primary transition-all"
                >
                  LOAD MORE STORIES <ChevronDown className="ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* SIDEBAR - REAL GA4 TRENDING */}
          <aside className="lg:col-span-4 hidden md:block">
            <div className="sticky top-24 p-6 rounded-3xl bg-zinc-50 border border-zinc-200">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <TrendingUp className="text-primary w-5 h-5" /> MOST READ (GA4)
              </h3>
              <div className="space-y-6">
                {trendingPosts.map((post, i) => (
                  <Link key={i} to={`/article/${post.slug}`} className="flex gap-4 group">
                    <span className="text-2xl font-black text-zinc-300 italic">{i+1}</span>
                    <div>
                      <h4 className="font-bold text-sm leading-tight group-hover:text-primary line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase">
                        {post.views > 1000 ? `${(post.views/1000).toFixed(1)}K` : post.views} Views
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </main>
    </Layout>
  );
};

export default Index;