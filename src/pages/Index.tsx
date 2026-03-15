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

function catBorder(cat: string): string {
  const c = cat?.toLowerCase() || "";
  if (c.includes("entertainment")) return "border-rose-600";
  if (c.includes("politics") || c.includes("news")) return "border-blue-700";
  if (c.includes("gossip")) return "border-purple-600";
  if (c.includes("sports")) return "border-green-700";
  if (c.includes("tech") || c.includes("business")) return "border-cyan-700";
  return "border-zinc-600";
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

const RAW_POSTS = getAllPosts().slice(0, 60);

// ─── MOBILE TOP CARD — vertical card for 2-col grid ──────────────────────────
const MobileTopCard = React.memo(({ post }: { post: Post }) => (
  <Link to={`/article/${post.slug}`} className="group block">
    <article>
      <div className={`aspect-[4/3] overflow-hidden bg-muted border-t-[3px] ${catBorder(post.category)}`}>
        <img
          src={img(post.image, 360)}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="pt-2">
        <span className={`inline-block text-[8px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 mb-1 ${catColor(post.category)}`}>
          {post.category}
        </span>
        <h3 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-[13px] leading-snug">
          {post.title}
        </h3>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
          <Clock className="w-2.5 h-2.5" />{timeAgo(post.date)}
        </span>
      </div>
    </article>
  </Link>
));

// ─── MOST READ WIDGET — mobile inline ────────────────────────────────────────
const MostReadMobile = React.memo(({ posts }: { posts: Post[] }) => (
  <div className="border border-border bg-card px-4 py-4">
    <div className="flex items-center gap-2 mb-3">
      <TrendingUp className="w-4 h-4 text-primary" />
      <h3 className="text-xs font-black uppercase tracking-widest">Most Read</h3>
      <div className="h-px flex-1 bg-border" />
    </div>
    <div className="space-y-3">
      {posts.map((post, i) => (
        <Link key={post.slug} to={`/article/${post.slug}`} className="group flex gap-3 items-start">
          <span className="text-xl font-black text-muted-foreground/30 group-hover:text-primary transition-colors leading-none mt-0.5 tabular-nums">
            0{i + 1}
          </span>
          <div>
            <h4 className="text-xs font-bold leading-snug line-clamp-2 group-hover:underline">{post.title}</h4>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{post.category}</span>
          </div>
        </Link>
      ))}
    </div>
  </div>
));

// ─── FEED CARD — horizontal list ─────────────────────────────────────────────
const FeedCard = React.memo(({ post }: { post: Post }) => (
  <article className="group flex gap-3 sm:gap-4 border-b border-border py-4">
    <Link to={`/article/${post.slug}`} className="flex-shrink-0 w-24 sm:w-32 md:w-40">
      <div className={`aspect-[4/3] overflow-hidden bg-muted border-t-[3px] ${catBorder(post.category)}`}>
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
        <h3 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm md:text-base mb-1 leading-snug">
          {post.title}
        </h3>
      </Link>
      <p className="text-muted-foreground text-xs line-clamp-1 mb-1.5 hidden md:block">{post.excerpt}</p>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{timeAgo(post.date)}</span>
        <span>·</span>
        <span>{post.readTime} min</span>
      </div>
    </div>
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
    const t = setTimeout(() => setAdsReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // 1 lead + 4 secondary (mobile: 2×2 grid | desktop: 2 stacked)
  const heroLead = RAW_POSTS[0];
  const heroSecondary = RAW_POSTS.slice(1, 5);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(RAW_POSTS.map(p => p.category?.toLowerCase()).filter(Boolean)));
    return ["all", ...cats];
  }, []);

  const feedSource = useMemo(() => {
    const base = RAW_POSTS.slice(5); // skip hero posts
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
          <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-3">

            {/* ── MOBILE HERO (< lg) ── */}
            <div className="lg:hidden space-y-2">
              {/* Lead — full width */}
              <Link to={`/article/${heroLead.slug}`} className="group relative overflow-hidden block aspect-[16/9]">
                <img
                  src={optimizedHeroImage}
                  alt={heroLead.title}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover opacity-80 absolute inset-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                  <span className={`text-[9px] font-black tracking-[0.18em] uppercase text-white px-2 py-0.5 ${catColor(heroLead.category)}`}>
                    {heroLead.category}
                  </span>
                  <h1 className="text-[19px] font-serif font-black text-white leading-tight mt-1.5 line-clamp-3">
                    {heroLead.title}
                  </h1>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1.5">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(heroLead.date)}</span>
                    <span className="font-semibold truncate">{heroLead.author}</span>
                  </div>
                </div>
              </Link>

              {/* Secondary — 2-col compact cards */}
              <div className="grid grid-cols-2 gap-1.5">
                {heroSecondary.map(post => (
                  <Link key={post.slug} to={`/article/${post.slug}`} className="group relative overflow-hidden block aspect-[4/3]">
                    <img
                      src={img(post.image, 400)}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover opacity-65 group-hover:opacity-80 transition-opacity absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                      <span className={`text-[8px] font-black tracking-widest uppercase text-white px-1 py-0.5 mb-1 inline-block ${catColor(post.category)}`}>
                        {post.category}
                      </span>
                      <h2 className="text-white font-bold text-[11px] leading-tight line-clamp-2">
                        {post.title}
                      </h2>
                      <span className="text-zinc-400 text-[9px] flex items-center gap-0.5 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />{timeAgo(post.date)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── DESKTOP HERO (lg+) ── */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-1">
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
                  <h1 className="text-3xl lg:text-4xl font-serif font-black text-white leading-tight mt-3 line-clamp-3">
                    {heroLead.title}
                  </h1>
                  <p className="text-zinc-300 text-sm line-clamp-2 mt-2 max-w-md">{heroLead.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mt-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(heroLead.date)}</span>
                    <span className="font-bold text-zinc-400">{heroLead.author}</span>
                  </div>
                </div>
              </Link>
              <div className="lg:col-span-5 flex flex-col gap-1">
                {heroSecondary.slice(0, 2).map(post => (
                  <Link key={post.slug} to={`/article/${post.slug}`} className="group relative overflow-hidden block flex-1">
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
                      <span className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{timeAgo(post.date)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ MAIN CONTENT + SIDEBAR ══ */}
      <section className="py-4 md:py-8 lg:py-12 bg-background">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4">

          {/* ── CATEGORY TABS — single-row horizontal scroll ── */}
          <div
            className="flex items-center gap-1 overflow-x-auto border-b border-border mb-4 md:mb-6 -mx-3 sm:-mx-4 px-3 sm:px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 text-[11px] font-black uppercase tracking-wider px-3 py-2.5 border-b-2 transition-all -mb-px whitespace-nowrap ${
                  activeCategory === cat
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">

            {/* ── MAIN FEED ── */}
            <main className="lg:col-span-8">

              {/* Feed header */}
              <div className="flex items-center gap-3 mb-4 md:mb-5">
                <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                  {activeCategory === "all" ? "Latest Stories" : activeCategory}
                  <Flame className="w-4 h-4 text-primary" />
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Mobile: 2-col card grid for first 4 posts */}
              <div className="lg:hidden mb-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                  {displayedPosts.slice(0, 4).map(post => (
                    <MobileTopCard key={post.slug} post={post} />
                  ))}
                </div>
              </div>

              {/* Feed list — mobile skips first 4 (shown in grid), desktop shows all */}
              <div>
                {displayedPosts.map((post, i) => (
                  <React.Fragment key={post.slug}>
                    <div className={i < 4 ? "hidden lg:block" : ""}>
                      <FeedCard post={post} />
                    </div>

                    {/* Inject Most Read widget on mobile after post index 5 */}
                    {i === 5 && (
                      <div className="lg:hidden my-5">
                        <MostReadMobile posts={mostRead} />
                      </div>
                    )}

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

            {/* ── SIDEBAR (desktop only) ── */}
            <aside className="hidden lg:block lg:col-span-4 space-y-8">
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
                      <span className="text-2xl font-black text-muted-foreground/30 group-hover:text-primary transition-colors leading-none mt-0.5">
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

export default Index;
