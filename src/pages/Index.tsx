import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Flame, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";
import AdUnit from "@/components/AdUnit";

const INITIAL_LOAD = 12;
const LOAD_MORE_COUNT = 12;

// ─── IMAGE PROXY ──────────────────────────────────────────────────────────────
function img(url: string, w = 800): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=75&we`;
}

// ─── RELATIVE TIME ─────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

// ─── CATEGORY COLOR MAP ───────────────────────────────────────────────────────
function catColor(cat: string): string {
  const c = cat?.toLowerCase() || "";
  if (c.includes("entertainment")) return "bg-rose-600";
  if (c.includes("politics") || c.includes("news")) return "bg-blue-700";
  if (c.includes("gossip")) return "bg-purple-600";
  if (c.includes("sports")) return "bg-green-700";
  if (c.includes("tech") || c.includes("business")) return "bg-cyan-700";
  return "bg-zinc-600";
}

// ─── STABLE FAKE VIEWS ────────────────────────────────────────────────────────
function stableViews(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return 20 + (Math.abs(hash) % 80);
}

type Post = ReturnType<typeof getAllPosts>[0];

// ═══════════════════════════════════════════════════════════════════════════════
// Cap at 60 posts — less DOM, faster paint
// ═══════════════════════════════════════════════════════════════════════════════
const RAW_POSTS = getAllPosts().slice(0, 60);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEX PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const Index = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [activeCategory, setActiveCategory] = useState("all");
  const [adsReady, setAdsReady] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAdsReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const heroLead = RAW_POSTS[0];
  const heroSecondary = RAW_POSTS.slice(1, 3);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(RAW_POSTS.map(p => p.category?.toLowerCase()).filter(Boolean)));
    return ["all", ...cats];
  }, []);

  const feedSource = useMemo(() => {
    const base = RAW_POSTS.slice(3); // skip hero posts
    if (activeCategory === "all") return base;
    return base.filter(p => p.category?.toLowerCase() === activeCategory);
  }, [activeCategory]);

  const displayedPosts = feedSource.slice(0, visibleCount);
  const hasMore = visibleCount < feedSource.length;

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(prev => prev + LOAD_MORE_COUNT); },
      { rootMargin: "400px" }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore]);

  const mostRead = useMemo(() =>
    [...RAW_POSTS].sort((a, b) => stableViews(b.slug) - stableViews(a.slug)).slice(0, 5),
    []
  );

  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
    setVisibleCount(INITIAL_LOAD);
  }, []);

  const optimizedHeroImage = heroLead ? img(heroLead.image, 1200) : "/images/placeholder.jpg";

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Breaking Kenya News, Entertainment Gossip & Trending Scoops</title>
        <meta name="description" content="Get the latest breaking news in Kenya today. Za Ndani delivers exclusive Nairobi entertainment gossip, political updates, trending celebrity news, and sports." />
        <link rel="canonical" href="https://zandani.co.ke" />
        {heroLead && <link rel="preload" as="image" href={optimizedHeroImage} fetchPriority="high" />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "WebSite", "name": "Za Ndani",
          "url": "https://zandani.co.ke",
          "potentialAction": { "@type": "SearchAction", "target": "https://zandani.co.ke/tag/{search_term_string}", "query-input": "required name=search_term_string" },
        })}</script>
      </Helmet>

      {/* ══ HERO ══ */}
      {heroLead && (
        <section className="bg-zinc-950 border-b border-zinc-800">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="grid lg:grid-cols-12 gap-1">
              {/* Lead story */}
              <Link to={`/article/${heroLead.slug}`} className="lg:col-span-7 group relative overflow-hidden block aspect-[16/10]">
                <img
                  src={optimizedHeroImage}
                  alt={heroLead.title}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  width={840}
                  height={525}
                  className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity duration-500 absolute inset-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                  <span className={`text-[10px] font-black tracking-[0.2em] uppercase text-white px-2 py-1 ${catColor(heroLead.category)}`}>
                    {heroLead.category}
                  </span>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-black text-white leading-tight mt-3 line-clamp-3">
                    {heroLead.title}
                  </h1>
                  <p className="text-zinc-300 text-sm line-clamp-2 mt-2 max-w-md">{heroLead.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mt-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(heroLead.date)}</span>
                    <span className="font-bold text-zinc-400">{heroLead.author}</span>
                  </div>
                </div>
              </Link>

              {/* Secondary stories */}
              <div className="lg:col-span-5 flex flex-col gap-1">
                {heroSecondary.map(post => (
                  <Link key={post.slug} to={`/article/${post.slug}`} className="group relative overflow-hidden block flex-1 aspect-[16/9] lg:aspect-auto">
                    <img
                      src={img(post.image, 600)}
                      alt={post.title}
                      loading="lazy"
                      width={560}
                      height={235}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <span className={`text-[9px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 mb-2 inline-block ${catColor(post.category)}`}>
                        {post.category}
                      </span>
                      <h2 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <span className="text-zinc-500 text-xs mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ MAIN CONTENT + SIDEBAR ══ */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8">

            {/* ── MAIN FEED ── */}
            <main className="lg:col-span-8">

              {/* Category filter pills */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 border transition-all ${
                      activeCategory === cat
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
              </div>

              {/* Feed header */}
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  {activeCategory === "all" ? "Latest Stories" : activeCategory}
                  <Flame className="w-4 h-4 text-primary" />
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* ── POSTS GRID ── */}
              <div className="space-y-8">
                {displayedPosts.map((post, i) => (
                  <React.Fragment key={post.slug}>
                    <FeedCard post={post} />
                    {/* Ad every 6 posts */}
                    {(i + 1) % 6 === 0 && adsReady && (
                      <div className="py-3 border-y border-border/50" style={{ minHeight: 120 }}>
                        <AdUnit type="inarticle" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={loaderRef} className="py-6 flex justify-center">
                {hasMore ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading…
                  </div>
                ) : (
                  feedSource.length > 0 && (
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">· All stories loaded ·</span>
                  )
                )}
              </div>
            </main>

            {/* ── SIDEBAR ── */}
            <aside className="lg:col-span-4 space-y-8">
              {/* Most Read */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Most Read</h3>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-4">
                  {mostRead.map((post, i) => (
                    <Link key={post.slug} to={`/article/${post.slug}`} className="group flex gap-3">
                      <span className="text-2xl font-black text-muted-foreground/30 group-hover:text-primary transition-colors">
                        0{i + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold leading-tight line-clamp-2 group-hover:underline">{post.title}</h4>
                        <span className="text-[10px] text-muted-foreground uppercase">{post.category}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sidebar ad */}
              <div style={{ minHeight: 280 }}>
                {adsReady && <AdUnit type="effectivegate" />}
              </div>

              {/* More stories */}
              <div className="bg-card p-5 border border-border">
                <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" /> More Stories
                </h3>
                <div className="space-y-4">
                  {RAW_POSTS.slice(10, 16).map(post => (
                    <Link key={post.slug} to={`/article/${post.slug}`} className="group block">
                      <h4 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h4>
                      <span className="text-[10px] text-muted-foreground">{post.category} · {timeAgo(post.date)}</span>
                    </Link>
                  ))}
                </div>
                <Link to="/trending" className="flex items-center gap-1 text-xs font-bold text-primary mt-4 hover:underline">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// ─── FEED CARD — simple, lightweight ──────────────────────────────────────────
const FeedCard = React.memo(({ post }: { post: Post }) => (
  <article className="group flex gap-4 border-b border-border pb-6">
    <Link to={`/article/${post.slug}`} className="flex-shrink-0 w-28 md:w-40">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={img(post.image, 320)}
          alt={post.title}
          loading="lazy"
          decoding="async"
          width={320}
          height={240}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
    </Link>
    <div className="flex flex-col justify-center min-w-0">
      <span className={`inline-block text-[9px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 mb-1.5 w-fit ${catColor(post.category)}`}>
        {post.category}
      </span>
      <Link to={`/article/${post.slug}`}>
        <h3 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm md:text-base mb-1">
          {post.title}
        </h3>
      </Link>
      <p className="text-muted-foreground text-xs line-clamp-1 mb-1.5 hidden md:block">{post.excerpt}</p>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.date)}</span>
        <span>·</span>
        <span>{post.readTime} min</span>
      </div>
    </div>
  </article>
));

export default Index;