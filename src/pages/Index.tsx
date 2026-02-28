import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

// PERFORMANCE: CategoryBar and ArticleCard are likely heavy. 
// Moving them to Lazy loading reduces the initial JS bundle size.
const CategoryBar = lazy(() => import("@/components/articles/CategoryBar").then(m => ({ default: m.CategoryBar })));
const ArticleCard = lazy(() => import("@/components/articles/ArticleCard").then(m => ({ default: m.ArticleCard })));

const INITIAL_VISIBLE = 10; // Reduced from 20 to lower TBT immediately
const allPostsFromMarkdown = getAllPosts();

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // 1. DATA DEFERRAL: Fetch GA4 data only when the browser is idle
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/get-views');
        if (res.ok) setViewCounts(await res.json());
      } catch (e) { console.warn("Analytics deferred"); }
    };
    
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => setTimeout(fetchViews, 2000));
    } else {
      setTimeout(fetchViews, 4000);
    }
  }, []);

  // 2. LIGHTWEIGHT MAPPING: Normalize data without heavy computation
  const allPosts = useMemo(() => {
    return allPostsFromMarkdown.map(post => {
      const slug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const views = viewCounts[`/article/${slug}`] || 0;
      return { ...post, views: views > 0 ? views : 47 };
    });
  }, [viewCounts]);

  const topStory = allPosts[0];
  const feedPosts = allPosts.slice(1);
  const displayedPosts = feedPosts.slice(0, visibleCount);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Trending Now</title>
        {/* LCP HACK: Preconnect to image CDN if you use one */}
        <link rel="preconnect" href="https://your-image-source.com" />
      </Helmet>

      {/* 3. LIGHTWEIGHT HERO: Reduced height (40vh) for faster mobile paint */}
      {topStory && (
        <section className="relative h-[40vh] min-h-[300px] bg-zinc-950 flex items-end overflow-hidden">
          <img 
            src={topStory.image} 
            alt=""
            fetchpriority="high"
            loading="eager" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
          <div className="relative container mx-auto px-4 pb-10 z-20">
            <h1 className="text-2xl md:text-5xl font-serif font-black text-white leading-tight line-clamp-2 mb-4">
              {topStory.title}
            </h1>
            <Link to={`/article/${topStory.slug}`}>
              <Button size="sm" className="bg-primary text-white font-bold rounded-full px-6">
                READ SCOOP <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      <Suspense fallback={<div className="h-12 bg-zinc-900" />}>
        <CategoryBar />
      </Suspense>

      <main className="container max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8">
            <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>}>
              <div className="space-y-10">
                {/* 4. THE BENTO LOGIC: Simplified for performance */}
                {displayedPosts.map((post, i) => (
                  <div key={post.slug}>
                    {i % 5 === 0 ? (
                      <div className="py-4 border-y border-zinc-800 my-8">
                         <ArticleCard post={post} variant="featured" />
                      </div>
                    ) : (
                      <ArticleCard post={post} />
                    )}
                  </div>
                ))}
              </div>
            </Suspense>

            {visibleCount < feedPosts.length && (
              <div className="mt-12 text-center">
                <Button 
                  onClick={() => setVisibleCount(v => v + 10)}
                  className="bg-zinc-900 text-white hover:bg-primary px-10 py-6 rounded-xl font-black"
                >
                  LOAD MORE STORIES
                </Button>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 p-6 rounded-3xl bg-zinc-950 border border-zinc-800">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <TrendingUp className="text-primary" /> TRENDING
              </h3>
              {allPosts.slice(0, 5).map((post, i) => (
                <Link key={i} to={`/article/${post.slug}`} className="flex gap-4 mb-6 group">
                  <span className="text-xl font-black text-zinc-700 italic">{i+1}</span>
                  <h4 className="text-sm font-bold text-zinc-300 group-hover:text-white line-clamp-2 leading-snug">
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