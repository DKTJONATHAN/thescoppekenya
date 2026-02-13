import { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { FeaturedStoryCard } from "@/components/articles/FeaturedStoryCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { getTodaysTopStory, getSecondaryPosts, getAllPosts, categories } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Zap, Flame, Clock, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

const POSTS_PER_PAGE = 12;

const Index = () => {
  const topStory = getTodaysTopStory();
  const secondaryPosts = getSecondaryPosts(topStory?.slug, 4);
  const allPosts = getAllPosts();
  const tickerPosts = allPosts.slice(0, 3);

  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const displayedPosts = allPosts.slice(0, visibleCount);
  const hasMore = visibleCount < allPosts.length;

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (!hasMore) return;
    const scrollBottom = window.innerHeight + window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    if (scrollBottom >= docHeight - 800) {
      setVisibleCount(prev => Math.min(prev + POSTS_PER_PAGE, allPosts.length));
    }
  }, [hasMore, allPosts.length]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Preload top story image for faster LCP
  useEffect(() => {
    if (topStory?.image) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = topStory.image;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [topStory?.image]);

  return (
    <Layout>
      <Helmet>
        <title>The Scoop KE | Kenya's First Sheng News & Entertainment Website</title>
        <meta name="description" content="Kenya's first Sheng news and entertainment website. Breaking news, celebrity gossip, trending stories na entertainment updates kwa Sheng." />
        <link rel="canonical" href="https://thescoopkenya.co.ke" />
      </Helmet>
      {/* Enhanced SEO Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          "name": "The Scoop Kenya",
          "description": "Kenya's first Sheng news and entertainment website. Breaking news, gossip, and trending stories in Sheng.",
          "url": "https://thescoopkenya.vercel.app",
          "logo": "https://thescoopkenya.vercel.app/logo.png",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://thescoopkenya.vercel.app/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })
      }} />

      {/* Top Stories Ticker */}
      <div className="bg-surface border-b border-divider py-2 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 flex items-center gap-4">
          <Badge variant="default" className="gradient-primary text-primary-foreground border-0 rounded-sm font-bold whitespace-nowrap">
            TOP STORIES
          </Badge>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-marquee hover:pause cursor-pointer text-sm font-medium text-foreground dark:text-white">
              {tickerPosts.map((post, idx) => (
                <span key={post.slug}>
                  • {post.title}
                  <span className="mx-8">{idx === tickerPosts.length - 1 ? '' : '•'}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CategoryBar />

      {/* Bento Grid Hero */}
      <section className="py-6 md:py-10">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Main Feature - Today's Top Story */}
            <div className="lg:col-span-2 lg:row-span-2">
              {topStory && (
                <FeaturedStoryCard post={topStory} />
              )}
            </div>

            {/* Grid Secondary Features */}
            {secondaryPosts.map((post, idx) => (
              <div key={post.slug} className={`${idx === 0 ? 'hidden md:block' : ''}`}>
                <ArticleCard post={post} variant="compact" />
              </div>
            ))}
            
            {/* Hot Topics Horizontal Bar */}
            <div className="lg:col-span-2 bg-surface border border-divider rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold text-foreground dark:text-white whitespace-nowrap">
                <Flame className="w-5 h-5 text-primary" />
                Hot Topics:
              </div>
              <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
                {['Politics', 'CelebrityGossip', 'GenZ', 'NairobiNightlife', 'Rugby7s'].map(tag => (
                  <Link key={tag} to={`/tag/${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors whitespace-nowrap px-4 py-1.5 rounded-full text-foreground dark:text-white">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: All Posts + Trending */}
      <section className="py-10 bg-surface/50 border-y border-divider">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Stories Feed */}
            <div className="lg:col-span-2 space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold text-foreground dark:text-white flex items-center gap-3">
                  <span className="w-1.5 h-9 gradient-primary rounded-full shadow-sm" />
                  Latest Scoops
                </h2>
                <p className="text-sm text-muted-foreground">
                  {displayedPosts.length} of {allPosts.length} stories
                </p>
              </div>

              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8">
                {displayedPosts.map((post) => (
                  <ArticleCard key={post.slug} post={post} />
                ))}
              </div>

              {/* Load More / End */}
              <div className="mt-12 text-center space-y-4">
                {hasMore ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => setVisibleCount(prev => Math.min(prev + POSTS_PER_PAGE, allPosts.length))}
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 py-6 rounded-2xl text-lg font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                      Load More Stories
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-sm text-muted-foreground">Scroll down for more stories</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground font-medium">You've seen all {allPosts.length} stories 🎉</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              <div className="sticky top-24 space-y-8">
                <div className="bg-surface rounded-2xl border border-divider shadow-sm overflow-hidden">
                  <div className="flex border-b border-divider">
                    <button className="flex-1 py-4 text-sm font-bold text-foreground dark:text-white bg-muted/30 border-b-2 border-primary">
                      <TrendingUp className="w-4 h-4 inline mr-2" />
                      Trending
                    </button>
                    <button className="flex-1 py-4 text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-colors">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Recent
                    </button>
                  </div>
                  <div className="p-4">
                    <TrendingSidebar />
                  </div>
                </div>

                {/* Editor's Highlight */}
                <div className="gradient-primary rounded-2xl p-8 text-primary-foreground shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-0">Editor's Pick</Badge>
                    <h3 className="text-2xl font-serif font-bold mb-4 leading-tight">
                      Inside Kenya's Booming Digital Creator Economy
                    </h3>
                    <Button variant="secondary" className="w-full text-foreground font-bold rounded-xl py-6">
                      Read Feature Story
                    </Button>
                  </div>
                </div>

                {/* Ad Placeholder */}
                <div className="bg-muted/30 rounded-2xl p-6 text-center border-2 border-dashed border-divider">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4 block">ADVERTISEMENT</span>
                  <div className="aspect-[4/5] bg-surface rounded-xl flex items-center justify-center border border-divider">
                    <p className="text-muted-foreground font-medium">Standard Ad Slot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Hub */}
      <section className="py-16">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-serif font-bold text-foreground dark:text-white flex items-center gap-3">
              <span className="w-1.5 h-9 gradient-primary rounded-full" />
              Browse the Hub
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={category.slug === 'sports' ? '/sports' : `/category/${category.slug}`}
                className="group relative h-48 rounded-2xl border border-divider overflow-hidden flex flex-col justify-end p-6 hover:shadow-2xl transition-all hover:-translate-y-1 bg-surface"
              >
                <div className="absolute top-0 right-0 p-4 text-divider/20 group-hover:text-primary/10 transition-colors">
                  <Newspaper className="w-16 h-16" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <h3 className="font-serif font-bold text-xl text-foreground dark:text-white group-hover:text-white transition-colors relative z-10">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-1 group-hover:text-white/80 transition-colors relative z-10">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      ` }} />
    </Layout>
  );
};

export default Index;
