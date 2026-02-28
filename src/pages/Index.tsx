import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Eye, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

const CategoryBar = lazy(() => import("@/components/articles/CategoryBar").then(m => ({ default: m.CategoryBar })));
const ArticleCard = lazy(() => import("@/components/articles/ArticleCard").then(m => ({ default: m.ArticleCard })));

// PERFORMANCE: Increased to 20 for user engagement, but kept logic light for CPU
const INITIAL_POSTS = 20;
const LOAD_MORE_COUNT = 10;
const allPostsFromMarkdown = getAllPosts();

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_POSTS);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // PERFORMANCE: Wait until the page is fully interactive before fetching views
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/get-views');
        if (res.ok) setViewCounts(await res.json());
      } catch (e) { console.error("View sync deferred"); }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const allPosts = useMemo(() => {
    return allPostsFromMarkdown.map(post => {
      const cleanSlug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const views = viewCounts[`/article/${cleanSlug}`] || 0;
      return { ...post, views: views > 0 ? views : 47 };
    });
  }, [viewCounts]);

  const topStory = allPosts[0];
  const feedPosts = useMemo(() => allPosts.slice(1), [allPosts]);
  const displayedPosts = feedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < feedPosts.length;

  const handleLoadMore = () => setVisibleCount(prev => prev + LOAD_MORE_COUNT);

  // Layout Logic: 2 list items -> 3 bento items -> repeat
  const renderedContent = useMemo(() => {
    const elements = [];
    let i = 0;
    while (i < displayedPosts.length) {
      // 1. Add a pair of regular cards
      const pair = displayedPosts.slice(i, i + 2);
      elements.push(
        <div key={`pair-${i}`} className="grid md:grid-cols-2 gap-6 md:gap-8">
          {pair.map(post => (
            <div key={post.slug} className="min-h-[300px]">
              <ArticleCard post={post} />
            </div>
          ))}
        </div>
      );
      i += 2;

      // 2. Add a Bento break if we have 3 more posts available
      if (i + 3 <= displayedPosts.length) {
        const bento = displayedPosts.slice(i, i + 3);
        elements.push(
          <div key={`bento-${i}`} className="grid grid-cols-1 md:grid-cols-3 gap-4 py-10">
            <div className="md:col-span-2 aspect-[16/9] md:aspect-auto md:h-[450px] rounded-3xl overflow-hidden shadow-lg border border-divider">
              <ArticleCard post={bento[0]} variant="featured" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="h-full rounded-2xl overflow-hidden bg-surface border border-divider">
                <ArticleCard post={bento[1]} variant="compact" />
              </div>
              <div className="h-full rounded-2xl overflow-hidden bg-surface border border-divider">
                <ArticleCard post={bento[2]} variant="compact" />
              </div>
            </div>
          </div>
        );
        i += 3;
      }
    }
    return elements;
  }, [displayedPosts]);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Kenya's #1 Gossip Hub</title>
        {/* CRITICAL FOR PERFORMANCE: Preload the LCP Image */}
        {topStory && <link rel="preload" as="image" href={topStory.image} fetchpriority="high" />}
      </Helmet>

      {/* TIGHT HERO - 55vh: Dramatic but compact */}
      {topStory && (
        <section className="relative h-[55vh] min-h-[400px] flex items-center bg-zinc-950 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={topStory.image || '/images/placeholder.jpg'} 
              alt=""
              fetchpriority="high"
              loading="eager"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          </div>

          <div className="relative container max-w-7xl mx-auto px-4 z-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md border border-primary/30 px-3 py-1 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                <Sparkles className="w-3 h-3" /> Trending Now
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black text-white leading-[1.1] tracking-tight mb-6">
                {topStory.title}
              </h1>
              <Link to={`/article/${topStory.slug}`}>
                <Button className="bg-primary hover:bg-white hover:text-black text-white rounded-full px-10 py-7 text-lg font-bold transition-all shadow-2xl shadow-primary/20 group">
                  READ THE SCOOP <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Suspense fallback={<div className="h-16 bg-zinc-900 animate-pulse" />}>
        <CategoryBar />
      </Suspense>

      <section className="py-12 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-serif font-black italic text-headline">Fresh News</h2>
                <div className="flex-1 h-[1px] bg-divider ml-6" />
              </div>

              {/* INTERWOVEN FEED */}
              <div className="space-y-12 min-h-[1000px]">
                {renderedContent}
              </div>

              {/* READ MORE ACTION */}
              {hasMore && (
                <div className="mt-20 py-10 border-t border-divider text-center">
                  <Button 
                    onClick={handleLoadMore}
                    size="lg"
                    className="bg-zinc-900 text-white hover:bg-primary rounded-2xl px-16 py-8 text-xl font-black transition-all group"
                  >
                    Fetch More Juice
                    <ChevronDown className="ml-2 w-6 h-6 group-hover:translate-y-1 transition" />
                  </Button>
                </div>
              )}

              {!hasMore && (
                <div className="mt-20 text-center text-muted-foreground font-serif italic">
                  That's all for today! Check back in a few. 🌶️
                </div>
              )}
            </div>

            {/* SIDEBAR: Performance optimized - Hidden on small mobile */}
            <aside className="lg:col-span-4 hidden md:block">
              <div className="sticky top-24 space-y-8">
                <div className="p-8 rounded-[2.5rem] bg-surface border border-divider shadow-sm">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                    <TrendingUp className="text-primary w-5 h-5" /> MOST CLICKED
                  </h3>
                  <div className="space-y-8">
                    {allPosts.slice(0, 6).map((post, i) => (
                      <Link key={i} to={`/article/${post.slug}`} className="flex gap-4 group">
                        <span className="text-3xl font-black text-muted-foreground/10 italic">0{i+1}</span>
                        <div>
                          <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {post.views} views
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;