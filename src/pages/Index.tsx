import { useEffect, useState, useMemo, useRef } from "react";
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

// ──────────────────────────────────────────────────────────────
// STATIC DATA – computed ONCE when the module loads (huge win)
// ──────────────────────────────────────────────────────────────
const allPosts = getAllPosts();
const topStory = getTodaysTopStory();
const secondaryPosts = getSecondaryPosts(topStory?.slug, 4);
const tickerPosts = allPosts.slice(0, 3);

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const displayedPosts = useMemo(
    () => allPosts.slice(0, visibleCount),
    [visibleCount]
  );
  const hasMore = visibleCount < allPosts.length;

  // ──────────────────────────────────────────────────────────────
  // IntersectionObserver – reliable infinite scroll (no more browser issues)
  // ──────────────────────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + POSTS_PER_PAGE, allPosts.length)
          );
        }
      },
      {
        threshold: 0.1,
        rootMargin: "800px 0px 0px 0px", // same trigger distance as before
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore]);

  // Preload top story image
  useEffect(() => {
    if (topStory?.image) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = topStory.image;
      document.head.appendChild(link);
      return () => document.head.removeChild(link);
    }
  }, [topStory?.image]);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani - Kenya Celebrity Gossip & Entertainment News | Trending Sheng Stories</title>
        <meta
          name="description"
          content="Hottest Kenya celebrity gossip, latest Nairobi entertainment news, trending Sheng stories, celebrity scandals & insider scoops. Bold, unbiased updates daily on Za Ndani."
        />
        <meta
          name="keywords"
          content="kenya celebrity gossip, kenyan entertainment news, nairobi gossip, celebrity news kenya, za ndani, trending news kenya, kenyan celebrities, latest gossip kenya, sheng news, nairobi entertainment"
        />

        {/* Canonical */}
        <link rel="canonical" href="https://zandani.co.ke" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zandani.co.ke" />
        <meta property="og:title" content="Za Ndani - Kenya Celebrity Gossip & Entertainment News" />
        <meta
          property="og:description"
          content="Hottest Kenya celebrity gossip, breaking Nairobi entertainment news & exclusive insider scoops. Bold updates daily."
        />
        <meta property="og:image" content="https://zandani.co.ke/logo.png" />
        <meta property="og:site_name" content="Za Ndani" />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://zandani.co.ke" />
        <meta name="twitter:title" content="Za Ndani - Kenya Celebrity Gossip & Entertainment News" />
        <meta
          name="twitter:description"
          content="Hottest Kenya celebrity gossip, trending entertainment news & insider scoops daily."
        />
        <meta name="twitter:image" content="https://zandani.co.ke/logo.png" />
      </Helmet>

      {/* Schema stays the same */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsMediaOrganization",
            "name": "Za Ndani",
            "description": "Za Ndani - habari kutoka ndani, bila bias. Kenya's boldest Sheng news and entertainment website.",
            "url": "https://zandani.co.ke",
            "logo": "https://zandani.co.ke/logo.png",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://zandani.co.ke/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />

      {/* Top Stories Ticker – now seamless */}
      <div className="bg-surface border-b border-divider py-2 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 flex items-center gap-4">
          <Badge variant="default" className="gradient-primary text-primary-foreground border-0 rounded-sm font-bold whitespace-nowrap">
            ZA NDANI
          </Badge>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div className="flex items-center animate-marquee hover:pause">
              {[...tickerPosts, ...tickerPosts].map((post, idx) => (  // duplicated for seamless loop
                <span key={idx} className="inline-flex items-center">
                  • {post.title}
                  <span className="mx-8">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CategoryBar />

      {/* Rest of your JSX stays 99% the same – only the feed part changes slightly */}
      <section className="py-6 md:py-10">
        {/* ... your bento grid stays exactly the same ... */}
      </section>

      <section className="py-10 bg-surface/50 border-y border-divider">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Stories Feed */}
            <div className="lg:col-span-2 space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold text-foreground dark:text-white flex items-center gap-3">
                  <span className="w-1.5 h-9 gradient-primary rounded-full shadow-sm" />
                  Latest Za Ndani
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

              {/* Sentinel for auto-load + manual button */}
              {hasMore && <div ref={sentinelRef} className="h-20" />}

              <div className="mt-12 text-center space-y-4">
                {hasMore ? (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, allPosts.length))}
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

            {/* Sidebar stays exactly the same */}
            <div className="lg:col-span-1 space-y-8">...</div>
          </div>
        </div>
      </section>

      {/* Categories Hub stays the same */}
      <section className="py-16">...</section>

      {/* Global CSS – improved marquee */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </Layout>
  );
};

export default Index;