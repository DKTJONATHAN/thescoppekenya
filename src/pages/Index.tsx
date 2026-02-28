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
// Note: If getAllPosts() bundles ALL your markdown into the JS bundle, 
// this alone is killing your mobile score.
const allPostsFromMarkdown = getAllPosts(); 

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // 1. SIMPLE, PREDICTABLE DATA FETCHING
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/get-views');
        if (res.ok) setViewCounts(await res.json());
      } catch (e) {
        console.warn("View fetch failed");
      }
    };
    // Let the initial paint finish, then fetch views
    const timer = setTimeout(fetchViews, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 2. EFFICIENT MEMOIZATION
  const allPosts = useMemo(() => {
    return allPostsFromMarkdown.map(post => {
      const slug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const exactPath = `/article/${slug}`;
      const pathWithSlash = `/article/${slug}/`;
      
      const gaViews = viewCounts[exactPath] || viewCounts[pathWithSlash] || 0;
      return { ...post, views: gaViews > 0 ? gaViews : 47 };
    });
  }, [viewCounts]); // Only recalculate when GA4 data arrives

  // 3. SEPARATE LISTS TO AVOID UNNECESSARY SORTS
  const topStory = allPosts[0];
  
  const trendingPosts = useMemo(() => {
    // Only sort a slice to save CPU
    return [...allPosts].slice(0, 50).sort((a, b) => b.views - a.views).slice(0, 6);
  }, [allPosts]);

  const displayedPosts = allPosts.slice(1, visibleCount + 1);
  const hasMore = visibleCount < allPosts.length - 1;

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani - Kenya Celebrity Gossip & Entertainment News</title>
        <meta name="description" content="Hottest Kenya celebrity gossip and trending news." />
        <link rel="canonical" href="https://zandani.co.ke" />
        {topStory?.image && <link rel="preload" as="image" href={topStory.image} fetchpriority="high" />}
      </Helmet>

      {/* FIXED HERO: Simple, absolute positioning, no heavy gradients */}
      {topStory && (
        <section className="relative h-[55vh] min-h-[400px] w-full bg-black flex items-end">
          <img 
            src={topStory.image || topStory.coverImage || '/images/placeholder-hero.jpg'} 
            alt={topStory.title}
            fetchpriority="high"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="relative container max-w-7xl mx-auto px-4 pb-12 z-10">
            <span className="inline-block bg-primary text-white text-[10px] font-bold px-2 py-1 rounded mb-3 tracking-widest uppercase">
              Hot Story
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black text-white leading-tight mb-6 max-w-3xl">
              {topStory.title}
            </h1>
            <Link to={`/article/${topStory.slug}`}>
              <Button className="bg-white text-black hover:bg-primary hover:text-white px-8 py-6 rounded-xl font-bold transition-colors">
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
            
            {/* MAIN FEED: No complex layout logic, just a clean grid */}
            <div className="lg:col-span-8 space-y-10">
              <h2 className="text-2xl font-serif font-black italic border-b border-divider pb-4">
                Fresh Off The Press
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {displayedPosts.map((post) => (
                  <div key={post.slug} className="min-h-[300px]">
                    <ArticleCard post={post} />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="pt-8 text-center">
                  <Button
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    variant="outline"
                    className="w-full md:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-white px-12 py-8 rounded-xl text-lg font-bold"
                  >
                    Load More Stories
                    <ChevronDown className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>

            {/* SIDEBAR: Standard list */}
            <aside className="lg:col-span-4 hidden md:block">
              <div className="sticky top-24 p-8 rounded-3xl bg-surface border border-divider">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <TrendingUp className="text-primary w-5 h-5" /> Trending Now
                </h3>
                <div className="space-y-6">
                  {trendingPosts.map((post, i) => (
                    <Link key={post.slug} to={`/article/${post.slug}`} className="flex gap-4 group">
                      <span className="text-3xl font-black text-muted-foreground/20 italic">0{i + 1}</span>
                      <div>
                        <h4 className="font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-bold uppercase">
                          <span>{post.views > 999 ? `${(post.views / 1000).toFixed(1)}k` : post.views} views</span>
                        </div>
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