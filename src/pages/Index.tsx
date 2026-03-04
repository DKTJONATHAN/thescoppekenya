import React, { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, ChevronDown, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import AdUnit from "@/components/AdUnit";

const CategoryBar = lazy(() => import("@/components/articles/CategoryBar").then(m => ({ default: m.CategoryBar })));
const ArticleCard = lazy(() => import("@/components/articles/ArticleCard").then(m => ({ default: m.ArticleCard })));

const INITIAL_POSTS = 6;
const LOAD_MORE_COUNT = 6;

// HELPER: The Heat Algorithm to prioritize Entertainment -> News -> Gossip
const getCategoryHeatScore = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('entertainment')) return 3;
  if (cat.includes('news')) return 2;
  if (cat.includes('gossip')) return 1;
  return 0;
};

// HELPER: The Image Proxy for the Hero Section
function getOptimizedImageUrl(url: string, width: number = 1200): string {
  if (!url) return "";
  if (url.endsWith('.svg') || url.startsWith('/')) return url;
  const cleanUrl = url.replace(/^https?:\/\//, '');
  return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&output=webp&q=80&we`;
}

// Fetch and sort posts by Heat Score first, then by Date
const rawPosts = getAllPosts();
const sortedPosts = [...rawPosts].sort((a, b) => {
  const heatA = getCategoryHeatScore(a.category);
  const heatB = getCategoryHeatScore(b.category);
  
  if (heatA !== heatB) {
    return heatB - heatA; 
  }
  return new Date(b.date).getTime() - new Date(a.date).getTime();
});

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
    return sortedPosts.map(post => {
      const cleanSlug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const views = viewCounts[`/article/${cleanSlug}`] || 0;
      return { ...post, views: views > 0 ? views : Math.floor(Math.random() * 50) + 20 };
    });
  }, [viewCounts]);

  // Top story: always the latest post by "Za Ndani", fallback to first overall
  const topStory = useMemo(() => {
    const zaNdaniPost = allPosts.find(p => p.author.toLowerCase() === 'za ndani');
    return zaNdaniPost || allPosts[0];
  }, [allPosts]);
  const feedPosts = useMemo(() => allPosts.filter(p => p.slug !== topStory?.slug), [allPosts, topStory]);
  const displayedPosts = feedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < feedPosts.length;

  // Process the hero image through the proxy to prevent LCP bottlenecks
  const optimizedHeroImage = topStory?.image ? getOptimizedImageUrl(topStory.image, 1200) : '/images/placeholder.jpg';

  const handleLoadMore = () => setVisibleCount(prev => prev + LOAD_MORE_COUNT);

  // Build feed with ads after every card
  const renderedContent = useMemo(() => {
    const elements: React.ReactNode[] = [];
    let adIndex = 0;
    const adTypes: Array<'inarticle' | 'effectivegate' | 'horizontal'> = ['inarticle', 'effectivegate', 'horizontal'];

    displayedPosts.forEach((post, i) => {
      elements.push(
        <div key={post.slug}>
          <ArticleCard post={post} priority={i === 0} />
        </div>
      );

      // Ad after every card (except the last)
      if (i < displayedPosts.length - 1) {
        elements.push(
          <div key={`feed-ad-${adIndex}`} className="flex justify-center py-4 border-y border-divider my-4 bg-muted/20">
            <AdUnit type={adTypes[adIndex % adTypes.length]} />
          </div>
        );
        adIndex++;
      }
    });

    return elements;
  }, [displayedPosts]);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Breaking Kenya News, Entertainment Gossip & Trending Scoops</title>
        <meta name="description" content="Get the latest breaking news in Kenya today. Za Ndani delivers exclusive Nairobi entertainment gossip, political updates, trending celebrity news, and sports." />
        <link rel="canonical" href="https://zandani.co.ke" />
        {topStory && optimizedHeroImage && (
          <link rel="preload" as="image" href={optimizedHeroImage} fetchPriority="high" />
        )}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Za Ndani",
          "url": "https://zandani.co.ke",
          "description": "Breaking Kenya News, Entertainment Gossip & Trending Scoops",
          "publisher": {
            "@type": "Organization",
            "name": "Za Ndani",
            "logo": { "@type": "ImageObject", "url": "https://zandani.co.ke/logo.png" }
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://zandani.co.ke/tag/{search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}</script>
      </Helmet>

      {/* HERO SECTION */}
      {topStory && (
        <section className="relative h-[70vh] min-h-[560px] flex items-end bg-black overflow-hidden group">
          <div className="absolute inset-0">
            <img 
              src={optimizedHeroImage} 
              alt={topStory.title}
              fetchPriority="high"
              loading="eager"
              decoding="async" 
              className="w-full h-full object-cover object-[center_20%] opacity-70 group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent z-10" />
          </div>
          <div className="relative container max-w-7xl mx-auto px-4 pb-16 z-20">
            <div className="max-w-4xl space-y-5">
              <Badge className="bg-primary text-white font-black px-4 py-1.5 rounded-sm text-xs tracking-[0.2em] shadow-lg shadow-primary/20 flex w-fit items-center gap-2">
                <Flame className="w-4 h-4" /> EXCLUSIVE SCOOP
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black text-white leading-[1.1] tracking-tight text-balance">
                {topStory.title}
              </h1>
              <p className="text-zinc-300 text-lg md:text-xl line-clamp-2 max-w-2xl font-light">
                {topStory.excerpt}
              </p>
              <Link to={`/article/${topStory.slug}`} className="inline-block mt-4">
                <Button className="bg-white text-black hover:bg-primary hover:text-white rounded-none px-8 py-6 text-sm font-black tracking-widest uppercase transition-all">
                  Read The Tea <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Suspense fallback={<div className="h-14 bg-zinc-900 border-b border-divider" />}>
        <CategoryBar />
      </Suspense>

      {/* FEED */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12">

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                  Latest Juice <Flame className="w-6 h-6 text-primary" />
                </h2>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-divider to-transparent" />
              </div>

              <div className="space-y-4">
                {renderedContent}
              </div>

              {hasMore && (
                <div className="pt-12 text-center">
                  <Button 
                    onClick={handleLoadMore}
                    variant="outline"
                    className="group border-2 border-divider hover:border-primary hover:bg-primary hover:text-white rounded-none px-12 py-8 text-sm uppercase tracking-[0.2em] font-black transition-all"
                  >
                    Load More Gossip
                    <ChevronDown className="ml-3 w-5 h-5 group-hover:translate-y-1 transition" />
                  </Button>
                </div>
              )}

              {!hasMore && (
                <div className="py-20 text-center">
                  <p className="text-muted-foreground font-serif italic text-xl">You've reached the bottom of the tea cup! 🫖</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-24 space-y-8">
                <div className="p-8 bg-surface border border-divider">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-wider border-b border-divider pb-4">
                    <TrendingUp className="text-primary w-5 h-5" /> Trending Now
                  </h3>
                  <div className="space-y-6">
                    {allPosts.slice(0, 6).map((post, i) => (
                      <Link key={i} to={`/article/${post.slug}`} className="flex gap-4 group items-start">
                        <span className="text-3xl font-serif font-black text-muted-foreground/20 leading-none mt-1">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <Badge variant="secondary" className="text-[10px] mb-2 px-1.5 py-0 rounded-sm">
                            {post.category}
                          </Badge>
                          <h4 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sidebar Ad */}
                <div className="flex justify-center bg-muted/10 p-4 border border-divider">
                  <AdUnit type="effectivegate" />
                </div>

                {/* Second sidebar ad lower down */}
                <div className="flex justify-center mt-8 bg-muted/10 p-4 border border-divider">
                  <AdUnit type="inarticle" />
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
