import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

// Lazy load below-the-fold components to slash TBT
const CategoryBar = lazy(() => import("@/components/articles/CategoryBar").then(m => ({ default: m.CategoryBar })));
const ArticleCard = lazy(() => import("@/components/articles/ArticleCard").then(m => ({ default: m.ArticleCard })));

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(6); // Start small to save CPU
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const allPostsFromMarkdown = useMemo(() => getAllPosts(), []);

  useEffect(() => {
    // Analytics: Wait until the user is actually interacting
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/get-views');
        if (res.ok) setViewCounts(await res.json());
      } catch (e) { console.error("GA4 Deferred"); }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const topStory = allPostsFromMarkdown[0];
  const displayPosts = allPostsFromMarkdown.slice(1, visibleCount);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Kenya's Hottest Stories</title>
        {/* RESOURCE HINT: Tells browser to fetch image BEFORE JS is ready */}
        {topStory?.image && (
          <link rel="preload" as="image" href={topStory.image} fetchpriority="high" />
        )}
      </Helmet>

      {/* HERO SECTION - Optimized for LCP */}
      {topStory && (
        <section className="relative h-[45vh] bg-zinc-900 overflow-hidden flex items-end">
          <img 
            src={topStory.image} 
            alt=""
            fetchpriority="high" // Critical for LCP
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          <div className="relative container mx-auto px-4 pb-10 z-20">
            <h1 className="text-3xl md:text-6xl font-serif font-black text-white leading-tight line-clamp-2 max-w-4xl">
              {topStory.title}
            </h1>
            <Link to={`/article/${topStory.slug}`} className="mt-4 inline-flex items-center text-primary font-bold text-sm">
               READ FULL STORY <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      <Suspense fallback={<div className="h-12 bg-zinc-100 animate-pulse" />}>
        <CategoryBar />
      </Suspense>

      <main className="container max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            
            {/* BENTO GRID 1 */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {displayPosts.slice(0, 2).map(post => (
                <div key={post.slug} className="min-h-[350px]">
                  <Suspense fallback={<div className="w-full h-64 bg-zinc-100 rounded-2xl" />}>
                    <ArticleCard post={post} />
                  </Suspense>
                </div>
              ))}
            </div>

            {/* BENTO FEATURE SECTION */}
            {displayPosts.length > 2 && (
              <div className="grid md:grid-cols-3 gap-4 mb-12">
                <div className="md:col-span-2 aspect-video bg-zinc-900 rounded-3xl overflow-hidden">
                  <Suspense fallback={<div className="w-full h-full bg-zinc-200" />}>
                    <ArticleCard post={displayPosts[2]} variant="featured" />
                  </Suspense>
                </div>
                <div className="space-y-4">
                  {displayPosts.slice(3, 5).map(post => (
                    <div key={post.slug} className="h-[calc(50%-8px)]">
                       <ArticleCard post={post} variant="compact" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visibleCount < allPostsFromMarkdown.length && (
              <div className="text-center py-10">
                <Button 
                  onClick={() => setVisibleCount(v => v + 8)}
                  className="bg-black text-white px-12 py-7 rounded-2xl font-black hover:bg-primary transition-all"
                >
                  LOAD MORE SCOOPS <ChevronDown className="ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* SIDEBAR - Keep it simple to avoid TBT */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-100">
              <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                <TrendingUp className="text-primary" /> TRENDING
              </h3>
              {allPostsFromMarkdown.slice(0, 5).map((post, i) => (
                <Link key={i} to={`/article/${post.slug}`} className="flex gap-4 mb-6 group">
                  <span className="text-2xl font-black text-zinc-200 italic">{i+1}</span>
                  <h4 className="text-sm font-bold leading-snug group-hover:text-primary line-clamp-2">
                    {post.title}
                  </h4>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </Layout>
  );
};

export default Index;