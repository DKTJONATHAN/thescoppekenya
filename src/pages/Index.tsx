import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const POSTS_PER_PAGE = 20;

// WARNING: If this function loads the full markdown body for all posts, 
// your FCP will never improve. Ensure it only loads frontmatter (title, image, excerpt).
const allPostsFromMarkdown = getAllPosts();

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // 1. FIX TBT: Push analytics fetching completely out of the critical rendering path
  useEffect(() => {
    const fetchGA4 = async () => {
      try {
        const res = await fetch('/api/get-views');
        if (res.ok) setViewCounts(await res.json());
      } catch (e) { /* silent fail */ }
    };
    // Wait 3 seconds. Let the browser paint the images first.
    const timer = setTimeout(fetchGA4, 3000);
    return () => clearTimeout(timer);
  }, []);

  const allPosts = useMemo(() => {
    return allPostsFromMarkdown.map(post => {
      const slug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const views = viewCounts[`/article/${slug}`] || viewCounts[`/article/${slug}/`] || 0;
      return { ...post, views: views > 0 ? views : 47 };
    });
  }, [viewCounts]);

  const topStory = allPosts[0];
  const feedPosts = allPosts.slice(1);
  const displayedPosts = feedPosts.slice(0, visibleCount);

  // 2. FIX CLS & TBT: Restored Bento Layout with strict container boundaries
  const renderedContent = useMemo(() => {
    const elements = [];
    let i = 0;
    
    while (i < displayedPosts.length) {
      // Pair Layout
      const pair = displayedPosts.slice(i, i + 2);
      if (pair.length > 0) {
        elements.push(
          <div key={`pair-${i}`} className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8">
            {pair.map(post => (
              // Explicit minimum height prevents layout shift while waiting for children
              <div key={post.slug} className="min-h-[380px] w-full flex flex-col">
                <ArticleCard post={post} />
              </div>
            ))}
          </div>
        );
      }
      i += 2;

      // Bento Layout
      if (i + 3 <= displayedPosts.length) {
        const bento = displayedPosts.slice(i, i + 3);
        elements.push(
          <div key={`bento-${i}`} className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8 mb-8 border-y border-divider">
            {/* Primary Bento Item: Strict aspect ratio */}
            <div className="md:col-span-2 relative w-full aspect-video md:aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 isolation-auto">
              <ArticleCard post={bento[0]} variant="featured" />
            </div>
            {/* Secondary Bento Items */}
            <div className="grid grid-rows-2 gap-4 h-full">
              <div className="relative w-full h-full min-h-[180px] rounded-2xl overflow-hidden bg-zinc-900">
                <ArticleCard post={bento[1]} variant="compact" />
              </div>
              <div className="relative w-full h-full min-h-[180px] rounded-2xl overflow-hidden bg-zinc-900">
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
        <title>Za Ndani - Kenya's Number 1 Gossip Hub</title>
        {/* 3. FIX LCP: Force the browser to grab this image immediately */}
        {topStory?.image && <link rel="preload" as="image" href={topStory.image} fetchpriority="high" />}
      </Helmet>

      {/* 4. FIX LCP & CLS: Strict 55vh height, absolutely positioned image */}
      {topStory && (
        <section className="relative h-[55vh] min-h-[400px] w-full bg-black flex items-end overflow-hidden">
          <img 
            src={topStory.image || '/images/placeholder-hero.jpg'} 
            alt=""
            fetchpriority="high"
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          <div className="relative container max-w-7xl mx-auto px-4 pb-12 z-10">
            <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">
              Hot Story
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black text-white leading-[1.1] mb-6 max-w-3xl">
              {topStory.title}
            </h1>
            <Link to={`/article/${topStory.slug}`}>
              <Button className="bg-white text-black hover:bg-primary hover:text-white px-8 py-6 rounded-xl font-bold">
                Read Full Story <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      <CategoryBar />

      <section className="py-12 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-8">
              <h2 className="text-2xl font-serif font-black italic mb-8 border-b border-divider pb-4">
                Fresh Off The Press
              </h2>

              <div className="space-y-4">
                {renderedContent}
              </div>

              {visibleCount < feedPosts.length && (
                <div className="pt-8 text-center">
                  <Button
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    className="w-full md:w-auto bg-zinc-900 text-white hover:bg-primary px-12 py-8 rounded-xl text-lg font-black transition-all"
                  >
                    LOAD MORE STORIES <ChevronDown className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>

            <aside className="lg:col-span-4 hidden md:block">
              <div className="sticky top-24 p-8 rounded-[2rem] bg-surface border border-divider shadow-sm">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <TrendingUp className="text-primary w-5 h-5" /> Trending Now
                </h3>
                <div className="space-y-6">
                  {allPosts.slice(0, 6).map((post, i) => (
                    <Link key={post.slug} to={`/article/${post.slug}`} className="flex gap-4 group">
                      <span className="text-3xl font-black text-muted-foreground/20 italic">0{i + 1}</span>
                      <div>
                        <h4 className="font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
                          {post.views > 999 ? `${(post.views / 1000).toFixed(1)}k` : post.views} views
                        </p>
                      </div>
                    </Link>
                  ))}
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