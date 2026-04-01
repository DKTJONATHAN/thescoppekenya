import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Flame, Clock, Eye } from "lucide-react";
import { Helmet } from "react-helmet-async";
import AdUnit from "@/components/AdUnit";

const INITIAL_LOAD = 16;
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
  if (c.includes("lifestyle")) return "bg-amber-600";
  if (c.includes("global")) return "bg-indigo-600";
  return "bg-zinc-600";
}

// ─── STABLE FAKE VIEWS ────────────────────────────────────────────────────────
function stableViews(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return 200 + (Math.abs(hash) % 8000);
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

type Post = ReturnType<typeof getAllPosts>[0];

const RAW_POSTS = getAllPosts().slice(0, 60);

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
const SectionHeader = React.memo(({ title, accent = "bg-primary", href }: { title: string; accent?: string; href?: string }) => (
  <div className="flex items-center gap-0 mb-4">
    <div className={`w-1 h-6 ${accent} mr-3 flex-shrink-0`} />
    <h2 className="text-sm md:text-base font-black uppercase tracking-wide text-foreground flex-shrink-0">{title}</h2>
    <div className="h-px flex-1 bg-border ml-3" />
    {href && (
      <Link to={href} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 ml-3 flex-shrink-0">
        More <ArrowRight className="w-3 h-3" />
      </Link>
    )}
  </div>
));

// ─── HERO LEAD CARD — Large featured story ───────────────────────────────────
const HeroLead = React.memo(({ post, imageUrl }: { post: Post; imageUrl: string }) => (
  <Link to={`/article/${post.slug}`} className="group relative block overflow-hidden">
    <div className="aspect-[16/9] lg:aspect-[16/10]">
      <img
        src={imageUrl}
        alt={post.title}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8">
      <span className={`inline-block text-[10px] font-black tracking-[0.2em] uppercase text-white px-2.5 py-1 ${catColor(post.category)}`}>
        {post.category}
      </span>
      <h1 className="text-xl md:text-2xl lg:text-4xl font-serif font-black text-white leading-tight mt-2 lg:mt-3 line-clamp-3">
        {post.title}
      </h1>
      <p className="hidden md:block text-zinc-300 text-sm line-clamp-2 mt-2 max-w-lg">{post.excerpt}</p>
      <div className="flex items-center gap-3 text-[11px] md:text-xs text-zinc-400 mt-2">
        <span className="font-semibold text-zinc-300">{post.author}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.date)}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:flex items-center gap-1"><Eye className="w-3 h-3" />{formatViews(stableViews(post.slug))}</span>
      </div>
    </div>
  </Link>
));

// ─── HERO SIDE CARD — Stacked secondary stories ─────────────────────────────
const HeroSideCard = React.memo(({ post }: { post: Post }) => (
  <Link to={`/article/${post.slug}`} className="group flex gap-3 py-3 border-b border-zinc-700/50 last:border-b-0">
    <div className="flex-shrink-0 w-20 md:w-24">
      <div className="aspect-[4/3] overflow-hidden bg-zinc-800">
        <img
          src={img(post.image, 200)}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <span className={`inline-block text-[8px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 mb-1 ${catColor(post.category)}`}>
        {post.category}
      </span>
      <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {post.title}
      </h3>
      <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
        <Clock className="w-2.5 h-2.5" />{timeAgo(post.date)}
      </span>
    </div>
  </Link>
));

// ─── NEWS GRID CARD — Vertical card for grid sections ────────────────────────
const NewsGridCard = React.memo(({ post, priority = false }: { post: Post; priority?: boolean }) => (
  <Link to={`/article/${post.slug}`} className="group block">
    <article>
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={img(post.image, priority ? 600 : 400)}
          alt={post.title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="pt-2.5 pb-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`inline-block text-[8px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 ${catColor(post.category)}`}>
            {post.category}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />{timeAgo(post.date)}
          </span>
        </div>
        <h3 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-[15px] leading-snug">
          {post.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 hidden sm:block">{post.excerpt}</p>
      </div>
    </article>
  </Link>
));

// ─── HEADLINE LIST ITEM — Compact text-only story ────────────────────────────
const HeadlineItem = React.memo(({ post, index }: { post: Post; index: number }) => (
  <Link to={`/article/${post.slug}`} className="group flex gap-3 py-2.5 border-b border-border last:border-b-0">
    <span className="text-2xl font-black text-primary/20 group-hover:text-primary transition-colors leading-none mt-0.5 tabular-nums w-8 text-right flex-shrink-0">
      {String(index + 1).padStart(2, "0")}
    </span>
    <div className="min-w-0 flex-1">
      <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h4>
      <div className="flex items-center gap-2 mt-0.5">
        <span className={`text-[8px] font-black tracking-widest uppercase text-white px-1 py-0 ${catColor(post.category)}`}>
          {post.category}
        </span>
        <span className="text-[10px] text-muted-foreground">{timeAgo(post.date)}</span>
      </div>
    </div>
  </Link>
));

// ─── FEED CARD — Horizontal list card ────────────────────────────────────────
const FeedCard = React.memo(({ post }: { post: Post }) => (
  <article className="group border-b border-border">
    <Link to={`/article/${post.slug}`} className="flex gap-3 sm:gap-4 py-4">
      <div className="flex-shrink-0 w-28 sm:w-36 md:w-44">
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={img(post.image, 360)}
            alt={post.title}
            loading="lazy"
            decoding="async"
            width={360}
            height={225}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-block text-[8px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 ${catColor(post.category)}`}>
            {post.category}
          </span>
        </div>
        <h3 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm md:text-base leading-snug">
          {post.title}
        </h3>
        <p className="text-muted-foreground text-xs line-clamp-1 mt-1 hidden md:block">{post.excerpt}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1.5">
          <span className="font-semibold text-foreground/70">{post.author}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{timeAgo(post.date)}</span>
          <span>·</span>
          <span>{post.readTime} min read</span>
        </div>
      </div>
    </Link>
  </article>
));

// ═══════════════════════════════════════════════════════════════════════════════
// INDEX PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const Index = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [activeCategory, setActiveCategory] = useState("all");
  const [adsReady, setAdsReady] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAdsReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Hero posts
  const heroLead = RAW_POSTS[0];
  const heroSide = RAW_POSTS.slice(1, 5);
  // Top grid stories (after hero)
  const topGrid = RAW_POSTS.slice(5, 9);
  // Editor's picks
  const editorPicks = useMemo(() =>
    [...RAW_POSTS].sort((a, b) => stableViews(b.slug) - stableViews(a.slug)).slice(0, 5),
    []
  );
  // Category stories for sections
  const entertainmentPosts = useMemo(() => RAW_POSTS.filter(p => p.category?.toLowerCase().includes("entertainment")).slice(0, 4), []);
  const politicsPosts = useMemo(() => RAW_POSTS.filter(p => {
    const c = p.category?.toLowerCase() || "";
    return c.includes("news") || c.includes("politic") || c.includes("global");
  }).slice(0, 4), []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(RAW_POSTS.map(p => p.category?.toLowerCase()).filter(Boolean)));
    return ["all", ...cats];
  }, []);

  const feedSource = useMemo(() => {
    const base = RAW_POSTS.slice(9);
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

      {/* ══ HERO SECTION — Newspaper-style lead + sidebar ══ */}
      {heroLead && (
        <section className="bg-zinc-950">
          <div className="container max-w-7xl mx-auto">
            <div className="lg:grid lg:grid-cols-12">
              {/* Lead story */}
              <div className="lg:col-span-8 lg:border-r lg:border-zinc-800">
                <HeroLead post={heroLead} imageUrl={optimizedHeroImage} />
              </div>
              {/* Sidebar stories */}
              <div className="lg:col-span-4 px-3 lg:px-4 py-3 lg:py-4">
                <div className="flex items-center gap-2 mb-2 lg:mb-3">
                  <Flame className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Top Stories</span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
                {/* Mobile: 2-col grid | Desktop: stacked list */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-0">
                  {heroSide.map(post => (
                    <div key={post.slug} className="lg:block">
                      {/* Mobile compact card */}
                      <Link to={`/article/${post.slug}`} className="lg:hidden group relative block aspect-[4/3] overflow-hidden">
                        <img src={img(post.image, 300)} alt={post.title} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                          <span className={`text-[7px] font-black tracking-widest uppercase text-white px-1 py-0.5 ${catColor(post.category)}`}>{post.category}</span>
                          <h3 className="text-white font-bold text-[11px] leading-tight line-clamp-2 mt-0.5">{post.title}</h3>
                        </div>
                      </Link>
                      {/* Desktop list card */}
                      <div className="hidden lg:block">
                        <HeroSideCard post={post} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ LEADERBOARD AD ══ */}
      {adsReady && (
        <div className="bg-muted/50 border-y border-border">
          <div className="container max-w-7xl mx-auto py-2 flex justify-center">
            <AdUnit type="horizontal" />
          </div>
        </div>
      )}

      {/* ══ TOP STORIES GRID — 4-col newspaper grid ══ */}
      <section className="bg-background border-b border-border">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-5 md:py-8">
          <SectionHeader title="Latest News" accent="bg-primary" href="/trending" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {topGrid.map((post, i) => (
              <NewsGridCard key={post.slug} post={post} priority={i < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ MAIN CONTENT AREA — Feed + Sidebar ══ */}
      <section className="bg-background">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-5 md:py-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">

            {/* ── LEFT: Category-specific sections + Feed ── */}
            <div className="lg:col-span-8">

              {/* Entertainment section */}
              {entertainmentPosts.length > 0 && (
                <div className="mb-8">
                  <SectionHeader title="Entertainment" accent="bg-rose-600" href="/category/entertainment" />
                  <div className="grid grid-cols-2 gap-3">
                    {/* Feature card — first post large */}
                    <div className="col-span-2 sm:col-span-1">
                      <Link to={`/article/${entertainmentPosts[0].slug}`} className="group block">
                        <div className="aspect-[16/10] overflow-hidden bg-muted relative">
                          <img src={img(entertainmentPosts[0].image, 600)} alt={entertainmentPosts[0].title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="font-serif font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">{entertainmentPosts[0].title}</h3>
                            <span className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{timeAgo(entertainmentPosts[0].date)}</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                    {/* Secondary stories stacked */}
                    <div className="col-span-2 sm:col-span-1 space-y-0 divide-y divide-border">
                      {entertainmentPosts.slice(1).map(post => (
                        <Link key={post.slug} to={`/article/${post.slug}`} className="group flex gap-3 py-3 first:pt-0">
                          <div className="flex-shrink-0 w-20">
                            <div className="aspect-[4/3] overflow-hidden bg-muted">
                              <img src={img(post.image, 160)} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h4>
                            <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{timeAgo(post.date)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mid-feed ad */}
              {adsReady && (
                <div className="mb-8 py-3 border-y border-border/50 flex justify-center" style={{ minHeight: 100 }}>
                  <AdUnit type="inarticle" />
                </div>
              )}

              {/* News / Politics section */}
              {politicsPosts.length > 0 && (
                <div className="mb-8">
                  <SectionHeader title="News & Politics" accent="bg-blue-700" href="/category/news" />
                  <div className="grid grid-cols-2 gap-3">
                    {politicsPosts.map(post => (
                      <NewsGridCard key={post.slug} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── ALL STORIES FEED ── */}
              <div className="mt-6">
                <SectionHeader title="All Stories" accent="bg-foreground" />

                {/* Category filter tabs */}
                <div
                  className="flex items-center gap-0.5 overflow-x-auto mb-5 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-px"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                        activeCategory === cat
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat === "all" ? "All" : cat}
                    </button>
                  ))}
                </div>

                {/* Feed */}
                <div>
                  {displayedPosts.map((post, i) => (
                    <React.Fragment key={post.slug}>
                      <FeedCard post={post} />
                      {/* Ad every 5 posts */}
                      {(i + 1) % 5 === 0 && adsReady && (
                        <div className="py-3 border-b border-border/50 flex justify-center" style={{ minHeight: 120 }}>
                          <AdUnit type="inarticle" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={loaderRef} className="py-8 flex justify-center">
                  {hasMore ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading more stories…
                    </div>
                  ) : (
                    feedSource.length > 0 && (
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">— End of stories —</span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR (desktop) ── */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-20 space-y-6">

                {/* Editor's Picks */}
                <div className="border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-wider">Editor's Picks</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div>
                    {editorPicks.map((post, i) => (
                      <HeadlineItem key={post.slug} post={post} index={i} />
                    ))}
                  </div>
                </div>

                {/* Sidebar ad */}
                <div className="flex justify-center" style={{ minHeight: 280 }}>
                  {adsReady && <AdUnit type="effectivegate" />}
                </div>

                {/* Don't Miss */}
                <div className="border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-wider">Don't Miss</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="space-y-3">
                    {RAW_POSTS.slice(15, 21).map(post => (
                      <Link key={post.slug} to={`/article/${post.slug}`} className="group flex gap-3">
                        <div className="flex-shrink-0 w-16">
                          <div className="aspect-square overflow-hidden bg-muted">
                            <img src={img(post.image, 120)} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h4>
                          <span className="text-[10px] text-muted-foreground">{post.category} · {timeAgo(post.date)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link to="/trending" className="flex items-center gap-1 text-xs font-bold text-primary mt-4 hover:underline">
                    View all stories <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Second sidebar ad */}
                <div className="flex justify-center" style={{ minHeight: 280 }}>
                  {adsReady && <AdUnit type="inarticle" />}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ══ MOBILE-ONLY: Editor's Picks (below feed) ══ */}
      <section className="lg:hidden bg-card border-t border-border">
        <div className="container max-w-7xl mx-auto px-3 py-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider">Editor's Picks</h3>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div>
            {editorPicks.map((post, i) => (
              <HeadlineItem key={post.slug} post={post} index={i} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
