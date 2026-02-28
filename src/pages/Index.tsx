import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Eye, Flame, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

const CategoryBar = lazy(() => import("@/components/articles/CategoryBar").then(m => ({ default: m.CategoryBar })));
const ArticleCard = lazy(() => import("@/components/articles/ArticleCard").then(m => ({ default: m.ArticleCard })));

const INITIAL_POSTS = 6;
const LOAD_MORE_COUNT = 6;
const allPostsFromMarkdown = getAllPosts();

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_POSTS);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/get-views');
        if (res.ok) setViewCounts(await res.json());
      } catch (e) { console.error("View sync deferred"); }
    }, 1000);
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

  // Helper to chunk posts for the "2 list + 1 bento" pattern
  const renderedContent = useMemo(() => {
    const elements = [];
    for (let i = 0; i < displayedPosts.length; i += 2) {
      // Add 2 regular list items
      elements.push(
        <div key={`pair-${i}`} className="grid md:grid-cols-2 gap-8">
          {displayedPosts.slice(i, i + 2).map(post => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      );

      // After every 2 items, if there are more posts, insert a Mini Bento
      const bentoStart = i + 2;
      const bentoChunk = feedPosts.slice(bentoStart, bentoStart + 3);
      if (bentoChunk.length === 3 && i < displayedPosts.length - 2) {
        elements.push(
          <div key={`bento-${i}`} className="grid grid-cols-2 md:grid-cols-3 gap-4 py-8">
            <div className="col-span-2 md:col-span-2 h-64 rounded-3xl overflow-hidden">
              <ArticleCard post={bentoChunk[0]} variant="featured" />
            </div>
            <div className="col-span-2 md:col-span-1 grid gap-4">
              <div className="h-30 rounded-2xl overflow-hidden bg-zinc-900">
                <ArticleCard post={bentoChunk[1]} variant="compact" />
              </div>
              <div className="h-30 rounded-2xl overflow-hidden bg-zinc-900">
                <ArticleCard post={bentoChunk[2]} variant="compact" />
              </div>
            </div>
          </div>
        );
        i += 3; // Skip these since they are now in a bento
      }
    }
    return elements;
  }, [displayedPosts, feedPosts]);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Trending News & Gossip</title>
      </Helmet>

      {/* COMPACT HERO - 65vh for better mobile flow */}
      {topStory && (
        <section className="relative h-[65vh] min-h-[500px] flex items-end bg-black overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={topStory.image || '/images/placeholder.jpg'} 
              alt=""
              fetchpriority="high"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
          </div>

          <div className="relative container max-w-7xl mx-auto px-4 pb-12 z-20">
            <div className="max-w-3xl space-y-4">
              <Badge className="bg-primary text-white font-black px-3 py-0.5 rounded-full text-[10px] tracking-widest">
                HOT STORY
              </Badge>
              <h1 className="text-4xl md:text-6xl font-serif font-black text-white leading-tight tracking-tighter">
                {topStory.title}
              </h1>
              <Link to={`/article/${topStory.slug}`}>
                <Button className="mt-4 bg-white text-black hover:bg-primary hover:text-white rounded-xl px-8 py-6 font-bold transition-all">
                  Read Full Story <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Suspense fallback={<div className="h-12 bg-zinc-900" />}>
        <CategoryBar />
      </Suspense>

      {/* DYNAMIC FEED WITH RECURSIVE BENTO LAYOUT */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-12">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">The Latest</span>
                <div className="h-[1px] flex-1 bg-divider" />
              </div>

              {/* The Interwoven List and Bento Items */}
              <div className="space-y-12">
                {renderedContent}
              </div>

              {/* READ MORE BUTTON */}
              {hasMore && (
                <div className="pt-12 text-center">
                  <Button 
                    onClick={handleLoadMore}
                    variant="outline"
                    className="group border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-2xl px-12 py-8 text-xl font-black transition-all shadow-xl shadow-primary/10"
                  >
                    Load More Stories
                    <ChevronDown className="ml-2 w-6 h-6 group-hover:translate-y-1 transition" />
                  </Button>
                </div>
              )}
              
              {!hasMore && (
                <div className="py-20 text-center">
                  <p className="text-muted-foreground font-serif italic text-lg">You're all caught up with the juice! 🌶️</p>
                </div>
              )}
            </div>

            {/* Sticky Sidebar */}
            <aside className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-24 space-y-8">
                <div className="p-8 rounded-[2.5rem] bg-surface border border-divider">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <TrendingUp className="text-primary w-5 h-5" /> Trending
                  </h3>
                  <div className="space-y-6">
                    {allPosts.slice(0, 5).map((post, i) => (
                      <Link key={i} to={`/article/${post.slug}`} className="flex gap-4 group">
                        <span className="text-2xl font-black text-muted-foreground/20 italic">{i+1}</span>
                        <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h4>
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