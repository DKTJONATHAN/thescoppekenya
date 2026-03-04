import React, { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, ChevronDown, Flame, Clock, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import AdUnit from "@/components/AdUnit";

const CategoryBar = lazy(() => import("@/components/articles/CategoryBar").then(m => ({ default: m.CategoryBar })));
const ArticleCard = lazy(() => import("@/components/articles/ArticleCard").then(m => ({ default: m.ArticleCard })));

const INITIAL_LOAD = 9;
const LOAD_MORE_COUNT = 9;

// ─── IMAGE PROXY ────────────────────────────────────────────────────────────
function img(url: string, w = 800): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=80&we`;
}

// ─── RELATIVE TIME ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

// ─── CATEGORY COLOR MAP ─────────────────────────────────────────────────────
function catColor(cat: string): string {
  const c = cat?.toLowerCase() || "";
  if (c.includes("entertainment")) return "bg-rose-600";
  if (c.includes("politics")) return "bg-blue-700";
  if (c.includes("news")) return "bg-amber-600";
  if (c.includes("gossip")) return "bg-purple-600";
  if (c.includes("sports")) return "bg-green-700";
  if (c.includes("tech")) return "bg-cyan-700";
  return "bg-zinc-600";
}

// ─── MIXED FEED BUILDER ──────────────────────────────────────────────────────
function buildMixedFeed(posts: ReturnType<typeof getAllPosts>) {
  const byCategory: Record<string, ReturnType<typeof getAllPosts>> = {};
  for (const post of posts) {
    const key = (post.category?.toLowerCase() || "other").trim();
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(post);
  }
  for (const key of Object.keys(byCategory)) {
    byCategory[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  const ent = byCategory["entertainment"] || [];
  const news = [...(byCategory["news"] || []), ...(byCategory["politics"] || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const other = [
    ...(byCategory["gossip"] || []),
    ...(byCategory["sports"] || []),
    ...(byCategory["technology"] || []),
    ...(byCategory["lifestyle"] || []),
    ...(byCategory["other"] || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const mixed: ReturnType<typeof getAllPosts> = [];
  let ei = 0, ni = 0, oi = 0;
  while (ei < ent.length || ni < news.length || oi < other.length) {
    if (ei < ent.length) mixed.push(ent[ei++]);
    if (ni < news.length) mixed.push(news[ni++]);
    if (ei < ent.length) mixed.push(ent[ei++]);
    if (oi < other.length) mixed.push(other[oi++]);
    if (ni < news.length) mixed.push(news[ni++]);
  }
  return mixed;
}

const rawPosts = getAllPosts();
const allSorted = buildMixedFeed(rawPosts);
const byDate = [...rawPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// ─── COMPACT CARD ────────────────────────────────────────────────────────────
const CompactCard = ({ post }: { post: ReturnType<typeof getAllPosts>[0] }) => (
  <Link to={`/article/${post.slug}`} className="group flex gap-3 items-start">
    <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-zinc-800">
      <img
        src={img(post.image, 160)}
        alt={post.title}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="flex-1 min-w-0">
      <span className={`inline-block text-[9px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 mb-1 ${catColor(post.category)}`}>
        {post.category}
      </span>
      <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {post.title}
      </h4>
      <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
        <Clock className="w-3 h-3" />{timeAgo(post.date)}
      </span>
    </div>
  </Link>
);

// ─── FEATURE CARD (medium, for grid) ────────────────────────────────────────
const FeatureCard = ({ post }: { post: ReturnType<typeof getAllPosts>[0] }) => (
  <Link to={`/article/${post.slug}`} className="group block relative overflow-hidden bg-zinc-900 h-64">
    <img
      src={img(post.image, 600)}
      alt={post.title}
      loading="lazy"
      className="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <span className={`inline-block text-[9px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 mb-2 ${catColor(post.category)}`}>
        {post.category}
      </span>
      <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {post.title}
      </h3>
      <span className="text-zinc-400 text-[11px] mt-1 flex items-center gap-1">
        <Clock className="w-3 h-3" />{timeAgo(post.date)}
      </span>
    </div>
  </Link>
);

// ─── AUTHOR CARD ─────────────────────────────────────────────────────────────
const AUTHORS = [
  {
    name: "Za Ndani",
    role: "Entertainment & Gossip",
    avatar: "ZN",
    color: "bg-rose-600",
    bio: "Sharp, cynical, and always first with the scoop. Za Ndani exposes what the mainstream won't touch.",
  },
  {
    name: "Mutheu Ann",
    role: "Celebrity & Pop Culture",
    avatar: "MA",
    color: "bg-purple-600",
    bio: "Plugged into the global entertainment circuit. If a celebrity breathes wrong, Mutheu Ann notices.",
  },
  {
    name: "Celestine Nzioka",
    role: "News & Politics",
    avatar: "CN",
    color: "bg-blue-700",
    bio: "Authoritative and unflinching. Celestine cuts through political spin to give you the real story.",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// INDEX PAGE
// ════════════════════════════════════════════════════════════════════════════
const Index = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/get-views");
        if (res.ok) setViewCounts(await res.json());
      } catch {}
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  const withViews = useMemo(() =>
    allSorted.map(post => {
      const clean = post.slug.replace(/^\//, "").replace(/\.md$/, "");
      const v = viewCounts[`/article/${clean}`] || 0;
      return { ...post, views: v > 0 ? v : Math.floor(Math.random() * 80) + 20 };
    }), [viewCounts]);

  // ── Hero grid: top 3 posts (lead + 2 secondary) ──
  const heroLead = withViews[0];
  const heroSecondary = withViews.slice(1, 3);

  // ── Latest posts strip (newest 5 regardless of category) ──
  const latestStrip = useMemo(() =>
    [...withViews]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [withViews]
  );

  // ── Author latest posts ──
  const authorPosts = useMemo(() =>
    AUTHORS.map(author => ({
      ...author,
      latest: withViews.find(p => p.author.toLowerCase() === author.name.toLowerCase()),
    })),
    [withViews]
  );

  // ── Main feed (filtered, excludes hero posts) ──
  const heroSlugs = new Set([heroLead?.slug, ...heroSecondary.map(p => p.slug)]);
  const feedSource = useMemo(() => {
    const base = withViews.filter(p => !heroSlugs.has(p.slug));
    if (activeCategory === "all") return base;
    return base.filter(p => p.category?.toLowerCase() === activeCategory);
  }, [withViews, activeCategory]);

  const displayedFeed = feedSource.slice(0, visibleCount);
  const hasMore = visibleCount < feedSource.length;

  // ── Most read sidebar ──
  const mostRead = useMemo(() =>
    [...withViews].sort((a, b) => b.views - a.views).slice(0, 6),
    [withViews]
  );

  // ── Politics sidebar ──
  const politicsPosts = useMemo(() =>
    withViews.filter(p => ["news", "politics"].includes(p.category?.toLowerCase())).slice(0, 4),
    [withViews]
  );

  // ── Feed chunks: every 3 cards = 1 full-width feature + 3 compact, with ads ──
  const feedChunks = useMemo(() => {
    const chunks: { feature: typeof displayedFeed[0]; compacts: typeof displayedFeed; adAfter: boolean }[] = [];
    for (let i = 0; i < displayedFeed.length; i += 4) {
      chunks.push({
        feature: displayedFeed[i],
        compacts: displayedFeed.slice(i + 1, i + 4),
        adAfter: (chunks.length + 1) % 2 === 0,
      });
    }
    return chunks;
  }, [displayedFeed]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(rawPosts.map(p => p.category?.toLowerCase()).filter(Boolean)));
    return ["all", ...cats];
  }, []);

  const optimizedHeroImage = heroLead?.image ? img(heroLead.image, 1400) : "/images/placeholder.jpg";

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Breaking Kenya News, Entertainment Gossip & Trending Scoops</title>
        <meta name="description" content="Get the latest breaking news in Kenya today. Za Ndani delivers exclusive Nairobi entertainment gossip, political updates, trending celebrity news, and sports." />
        <link rel="canonical" href="https://zandani.co.ke" />
        {heroLead && <link rel="preload" as="image" href={optimizedHeroImage} fetchPriority="high" />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Za Ndani",
          "url": "https://zandani.co.ke",
          "potentialAction": { "@type": "SearchAction", "target": "https://zandani.co.ke/tag/{search_term_string}", "query-input": "required name=search_term_string" }
        })}</script>
      </Helmet>

      {/* ══════════════════════════════════════════════════════════════
          EDITORIAL HERO GRID
      ══════════════════════════════════════════════════════════════ */}
      {heroLead && (
        <section className="bg-zinc-950 border-b border-zinc-800">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            <div className="grid lg:grid-cols-12 gap-1">

              {/* Lead story — large left panel */}
              <Link
                to={`/article/${heroLead.slug}`}
                className="lg:col-span-7 group relative overflow-hidden block"
                style={{ minHeight: 480 }}
              >
                <img
                  src={optimizedHeroImage}
                  alt={heroLead.title}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover object-[center_20%] opacity-75 group-hover:opacity-90 group-hover:scale-[1.02] transition-all duration-700 absolute inset-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-8 z-10" style={{ minHeight: 480 }}>
                  <div className="space-y-3 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black tracking-[0.2em] uppercase text-white px-2 py-1 ${catColor(heroLead.category)}`}>
                        {heroLead.category}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400 text-xs">
                        <Flame className="w-3 h-3 text-rose-500" /> Top Story
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-serif font-black text-white leading-tight tracking-tight">
                      {heroLead.title}
                    </h1>
                    <p className="text-zinc-300 text-sm line-clamp-2 font-light">{heroLead.excerpt}</p>
                    <div className="flex items-center gap-4 text-zinc-500 text-xs pt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(heroLead.date)}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{heroLead.views?.toLocaleString()} views</span>
                      <span className="text-zinc-600">By {heroLead.author}</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Two secondary stories — right panel */}
              <div className="lg:col-span-5 flex flex-col gap-1">
                {heroSecondary.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/article/${post.slug}`}
                    className="group relative overflow-hidden flex-1 block"
                    style={{ minHeight: 235 }}
                  >
                    <img
                      src={img(post.image, 700)}
                      alt={post.title}
                      loading="eager"
                      className="w-full h-full object-cover object-[center_20%] opacity-65 group-hover:opacity-80 group-hover:scale-[1.02] transition-all duration-700 absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="relative h-full flex flex-col justify-end p-5 z-10" style={{ minHeight: 235 }}>
                      <span className={`text-[9px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 mb-2 w-fit ${catColor(post.category)}`}>
                        {post.category}
                      </span>
                      <h2 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <div className="flex items-center gap-3 text-zinc-500 text-xs mt-2">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.date)}</span>
                        <span>{post.author}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          LATEST STRIP
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-zinc-900 border-b border-zinc-800 py-3">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-rose-500 whitespace-nowrap flex-shrink-0">
              <Zap className="w-3.5 h-3.5" /> Just In
            </span>
            <div className="w-px h-4 bg-zinc-700 flex-shrink-0" />
            {latestStrip.map((post, i) => (
              <React.Fragment key={post.slug}>
                <Link
                  to={`/article/${post.slug}`}
                  className="flex items-center gap-2 group whitespace-nowrap flex-shrink-0"
                >
                  <span className={`text-[9px] font-black uppercase text-white px-1.5 py-0.5 flex-shrink-0 ${catColor(post.category)}`}>
                    {post.category}
                  </span>
                  <span className="text-zinc-300 text-xs group-hover:text-white transition-colors line-clamp-1 max-w-[200px]">
                    {post.title}
                  </span>
                  <span className="text-zinc-600 text-[10px] flex-shrink-0">{timeAgo(post.date)}</span>
                </Link>
                {i < latestStrip.length - 1 && <span className="text-zinc-700 flex-shrink-0">·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Category bar */}
      <Suspense fallback={<div className="h-14 bg-zinc-900 border-b border-zinc-800" />}>
        <CategoryBar />
      </Suspense>

      {/* ══════════════════════════════════════════════════════════════
          MAIN CONTENT + SIDEBAR
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-16 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-10">

            {/* ── MAIN FEED ── */}
            <main className="lg:col-span-8 space-y-10">

              {/* Category filter pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setVisibleCount(INITIAL_LOAD); }}
                    className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 border transition-all ${
                      activeCategory === cat
                        ? "bg-primary border-primary text-white"
                        : "border-divider text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {cat === "all" ? "All Stories" : cat}
                  </button>
                ))}
              </div>

              {/* Feed section header */}
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  {activeCategory === "all" ? "Latest Stories" : activeCategory}
                  <Flame className="w-5 h-5 text-primary" />
                </h2>
                <div className="h-px flex-1 bg-divider" />
              </div>

              {/* Chunked feed: 1 wide ArticleCard + up to 3 compact cards, repeat */}
              <div className="space-y-10">
                {feedChunks.map((chunk, ci) => (
                  <div key={ci} className="space-y-6">

                    {/* Full-width feature card */}
                    {chunk.feature && (
                      <div className="border-b border-divider pb-6">
                        <Suspense fallback={<div className="h-64 bg-zinc-900 animate-pulse" />}>
                          <ArticleCard post={chunk.feature} priority={ci === 0} />
                        </Suspense>
                      </div>
                    )}

                    {/* Row of up to 3 compact image+text cards */}
                    {chunk.compacts.length > 0 && (
                      <div className="grid sm:grid-cols-3 gap-5">
                        {chunk.compacts.map(post => (
                          <Link key={post.slug} to={`/article/${post.slug}`} className="group block">
                            <div className="relative overflow-hidden h-40 mb-3">
                              <img
                                src={img(post.image, 400)}
                                alt={post.title}
                                loading="lazy"
                                className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <span className={`absolute bottom-2 left-2 text-[9px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 ${catColor(post.category)}`}>
                                {post.category}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
                              {post.title}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.date)}</span>
                              <span>·</span>
                              <span>{post.author}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Ad every 2 chunks */}
                    {chunk.adAfter && (
                      <div className="flex justify-center py-3 border-y border-divider bg-muted/10">
                        <AdUnit type={ci % 3 === 0 ? "inarticle" : ci % 3 === 1 ? "effectivegate" : "horizontal"} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Load more */}
              {hasMore ? (
                <div className="pt-6 text-center">
                  <Button
                    onClick={() => setVisibleCount(v => v + LOAD_MORE_COUNT)}
                    variant="outline"
                    className="group border-2 border-divider hover:border-primary hover:bg-primary hover:text-white rounded-none px-10 py-6 text-xs uppercase tracking-[0.2em] font-black transition-all"
                  >
                    Load More <ChevronDown className="ml-2 w-4 h-4 group-hover:translate-y-1 transition" />
                  </Button>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <p className="text-muted-foreground font-serif italic text-lg">You've reached the bottom of the tea cup 🫖</p>
                </div>
              )}
            </main>

            {/* ── SIDEBAR ── */}
            <aside className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-24 space-y-10">

                {/* Most Read */}
                <div className="border border-divider">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-divider bg-muted/30">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-wider">Most Read</h3>
                  </div>
                  <div className="divide-y divide-divider">
                    {mostRead.map((post, i) => (
                      <Link key={post.slug} to={`/article/${post.slug}`} className="flex gap-3 items-start p-4 group hover:bg-muted/20 transition-colors">
                        <span className="text-2xl font-serif font-black text-muted-foreground/20 leading-none flex-shrink-0 w-6">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <span className={`text-[9px] font-black uppercase tracking-widest text-white px-1.5 py-0.5 mb-1 inline-block ${catColor(post.category)}`}>
                            {post.category}
                          </span>
                          <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h4>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                            <Eye className="w-3 h-3" />{post.views?.toLocaleString()} views
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sidebar ad */}
                <div className="flex justify-center bg-muted/10 p-4 border border-divider">
                  <AdUnit type="effectivegate" />
                </div>

                {/* Latest in News & Politics */}
                {politicsPosts.length > 0 && (
                  <div className="border border-divider">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-divider bg-blue-950/40">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-blue-300">News & Politics</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {politicsPosts.map(post => (
                        <CompactCard key={post.slug} post={post} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Second sidebar ad */}
                <div className="flex justify-center bg-muted/10 p-4 border border-divider">
                  <AdUnit type="inarticle" />
                </div>

              </div>
            </aside>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FROM THE AUTHORS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-zinc-950 border-t border-zinc-800">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl font-black uppercase tracking-tight text-white">From The Authors</h2>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {authorPosts.map(author => (
              <div key={author.name} className="border border-zinc-800 bg-zinc-900 p-5 space-y-4">
                {/* Author identity */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${author.color}`}>
                    {author.avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{author.name}</p>
                    <p className="text-zinc-500 text-xs">{author.role}</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed border-l-2 border-zinc-700 pl-3">
                  {author.bio}
                </p>
                {/* Latest article from this author */}
                {author.latest ? (
                  <Link to={`/article/${author.latest.slug}`} className="group block">
                    <div className="relative overflow-hidden h-32 mb-3">
                      <img
                        src={img(author.latest.image, 400)}
                        alt={author.latest.title}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[9px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{timeAgo(author.latest.date)}
                      </span>
                    </div>
                    <h4 className="text-white text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {author.latest.title}
                    </h4>
                  </Link>
                ) : (
                  <p className="text-zinc-600 text-xs italic">No articles yet.</p>
                )}
                <Link
                  to={`/author/${author.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  All stories <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

    </Layout>
  );
};

export default Index;