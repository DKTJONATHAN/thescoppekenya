import React, {
  useEffect, useState, useMemo, lazy, Suspense, useCallback, useRef,
} from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import {
  ArrowRight, TrendingUp, Flame, Clock, Eye, Zap, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import AdUnit from "@/components/AdUnit";

const CategoryBar = lazy(() =>
  import("@/components/articles/CategoryBar").then(m => ({ default: m.CategoryBar }))
);
const ArticleCard = lazy(() =>
  import("@/components/articles/ArticleCard").then(m => ({ default: m.ArticleCard }))
);

const INITIAL_LOAD    = 9;
const LOAD_MORE_COUNT = 9;

// ─── IMAGE PROXY ──────────────────────────────────────────────────────────────
function img(url: string, w = 800): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:///, ""))}&w=${w}&output=webp&q=80&we`;
}

// ─── RELATIVE TIME ─────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h    = Math.floor(diff / 3_600_000);
  const d    = Math.floor(h / 24);
  if (h < 1)  return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

// ─── CATEGORY COLOR MAP ───────────────────────────────────────────────────────
function catColor(cat: string): string {
  const c = cat?.toLowerCase() || "";
  if (c.includes("entertainment")) return "bg-rose-600";
  if (c.includes("politics"))      return "bg-blue-700";
  if (c.includes("news"))          return "bg-amber-600";
  if (c.includes("gossip"))        return "bg-purple-600";
  if (c.includes("sports"))        return "bg-green-700";
  if (c.includes("tech"))          return "bg-cyan-700";
  return "bg-zinc-600";
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
function isToday(dateStr: string): boolean {
  const postDate = new Date(dateStr);
  const now      = new Date();
  return (
    postDate.getFullYear() === now.getFullYear() &&
    postDate.getMonth()    === now.getMonth()    &&
    postDate.getDate()     === now.getDate()
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════
type Post = ReturnType<typeof getAllPosts>[0] & { views?: number; _stableViews?: number };

type ChunkType = {
  feature:  Post;
  compacts: Post[];
  adAfter:  boolean;
};

// ═════════════════════════════════════════════════════════════════════════════
// PRISM ALGORITHM  — O(n log n) rewrite
// ═════════════════════════════════════════════════════════════════════════════
const EDITORIAL_TIERS: Record<string, number> = {
  scandal:       1.0,
  exclusive:     0.95,
  breaking:      0.9,
  gossip:        0.75,
  entertainment: 0.65,
  politics:      0.6,
  news:          0.5,
  sports:        0.45,
  tech:          0.4,
};

function editorialTier(post: Post): number {
  const cat   = post.category?.toLowerCase() || "";
  const title = post.title?.toLowerCase()    || "";
  if (/breaking|exclusive|scandal|caught|exposed|arrested|cheating/.test(title)) return 1.0;
  for (const [key, val] of Object.entries(EDITORIAL_TIERS)) {
    if (cat.includes(key)) return val;
  }
  return 0.4;
}

function prismScore(
  post:     Post,
  nowMs:    number,
  maxViews: number,
  peerMsGap: number,
): number {
  const ageMs  = nowMs - new Date(post.date).getTime();
  const ageHrs = ageMs / 3_600_000;

  // P — Proximity: 6hr half-life, floor 0.5 for today
  const halfLife = 6;
  const decayedP = Math.exp(-Math.log(2) * ageHrs / halfLife);
  const P        = isToday(post.date) ? Math.max(0.5, decayedP) : decayedP;

  // R — Reach
  const views = post._stableViews ?? 0;
  const R     = maxViews > 0 ? Math.max(0.1, views / maxViews) : 0.1;

  // I — Isolation
  const I = Math.min(1, peerMsGap / (4 * 3_600_000));

  // M — Magnitude
  const M = editorialTier(post);

  // FIX #2: Removed slot-diversity (S) penalty — was the cause of O(n²).
  // Diversity is handled structurally by buildPrismFeed via category interleaving below.
  return (P * 0.45) + (R * 0.25) + (I * 0.20) + (M * 0.10);
}

function buildIsolationMap(posts: Post[]): Map<string, number> {
  const times = posts
    .map(p => ({ slug: p.slug, ms: new Date(p.date).getTime() }))
    .sort((a, b) => a.ms - b.ms);

  const gapMap = new Map<string, number>();
  for (let i = 0; i < times.length; i++) {
    const prev = i > 0               ? times[i].ms - times[i - 1].ms : Infinity;
    const next = i < times.length - 1 ? times[i + 1].ms - times[i].ms : Infinity;
    gapMap.set(times[i].slug, Math.min(prev, next));
  }
  return gapMap;
}

// FIX #2: O(n log n) — score all posts first, sort once, then interleave for diversity
function buildPrismFeed(posts: Post[]): Post[] {
  if (!posts.length) return [];

  const nowMs    = Date.now();
  const maxViews = Math.max(...posts.map(p => p._stableViews ?? 0), 1);
  const isoMap   = buildIsolationMap(posts);

  // Score all posts — O(n)
  const scored = posts.map(p => ({
    post:  p,
    score: prismScore(p, nowMs, maxViews, isoMap.get(p.slug) ?? 3_600_000),
  }));

  // Single sort — O(n log n)
  scored.sort((a, b) => b.score - a.score);

  // Lightweight category interleaving — O(n) pass for diversity
  const buckets = new Map<string, Post[]>();
  for (const { post } of scored) {
    const cat = post.category?.toLowerCase() || "other";
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(post);
  }

  const result: Post[]  = [];
  const lists           = Array.from(buckets.values());
  let   exhausted       = 0;

  while (result.length < scored.length) {
    exhausted = 0;
    for (const list of lists) {
      if (list.length === 0) { exhausted++; continue; }
      result.push(list.shift()!);
    }
    if (exhausted === lists.length) break;
  }

  return result;
}

function selectHero(feed: Post[]): { lead: Post; secondary: Post[] } {
  if (!feed.length) return { lead: feed[0], secondary: [] };

  const lead      = feed[0];
  const secondary: Post[] = [];
  const usedCats  = new Set([lead.category?.toLowerCase()]);

  for (const p of feed.slice(1)) {
    if (secondary.length >= 2) break;
    const cat = p.category?.toLowerCase() || "other";
    if (!usedCats.has(cat)) { secondary.push(p); usedCats.add(cat); }
  }

  if (secondary.length < 2) {
    for (const p of feed.slice(1)) {
      if (secondary.length >= 2) break;
      if (!secondary.includes(p) && p !== lead) secondary.push(p);
    }
  }

  return { lead, secondary };
}

// ─── STABLE FAKE VIEWS ────────────────────────────────────────────────────────
function stableFakeViews(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return 20 + (Math.abs(hash) % 80);
}

// ─── COMPACT CARD ─────────────────────────────────────────────────────────────
// FIX #5 (minor): explicit width/height on img prevents CLS
const CompactCard = React.memo(({ post }: { post: Post }) => (
  <Link to={`/article/${post.slug}`} className="group flex gap-3 items-start">
    <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-zinc-800">
      <img
        src={img(post.image, 160)}
        alt={post.title}
        loading="lazy"
        width={80}
        height={80}
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
));

// ─── AUTHORS ──────────────────────────────────────────────────────────────────
const AUTHORS = [
  { name: "Jonathan Mwaniki",  role: "Editor-in-Chief",        avatar: "JM", color: "bg-zinc-800",   bio: "Content creator and journalist passionate about digital storytelling and Kenyan trends." },
  { name: "Celestine Nzioka",  role: "Politics & News Editor",  avatar: "CN", color: "bg-blue-700",   bio: "Authoritative and unflinching. Celestine cuts through political spin to give you the real story." },
  { name: "Mutheu Ann",        role: "Entertainment Lead",      avatar: "MA", color: "bg-purple-600", bio: "Plugged into the celebrity circuit. If a star breathes wrong, Mutheu Ann notices first." },
  { name: "Martin Mutwiri",    role: "Sports Desk",             avatar: "MM", color: "bg-green-700",  bio: "Deep dive analyst into local football and global athletic championships." },
  { name: "Grace Mkamburi",    role: "Lifestyle & Culture",     avatar: "GM", color: "bg-rose-500",   bio: "Exploring the vibrant pulse of Kenyan lifestyle, fashion, and social evolution." },
  { name: "Timothy Muli",      role: "Tech Correspondent",      avatar: "TM", color: "bg-cyan-700",   bio: "Unpacking the digital revolution and how technology is reshaping Nairobi's landscape." },
  { name: "Za Ndani",          role: "Gossip & Exclusives",     avatar: "ZN", color: "bg-amber-600",  bio: "Sharp, cynical, and always first with the scoop. The voice behind the exclusive tea." },
  { name: "Wanjiku Karanja",   role: "Entertainment Reporter",  avatar: "WK", color: "bg-rose-700",   bio: "First on the scene, last to leave. Wanjiku lives at the intersection of pop culture and breaking news." },
];

// ─── SECTION HEADERS ──────────────────────────────────────────────────────────
const TodaySectionHeader = () => (
  <div className="flex items-center gap-3 mb-6">
    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-rose-500">
      <Flame className="w-4 h-4" /> Today
    </span>
    <div className="h-px flex-1 bg-divider" />
    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
      {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })}
    </span>
  </div>
);

const OlderSectionHeader = () => (
  <div className="flex items-center gap-3 mt-10 mb-6">
    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-400">
      <Clock className="w-4 h-4" /> Older Stories
    </span>
    <div className="h-px flex-1 bg-divider" />
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// FIX #1: FeedChunks MOVED OUTSIDE Index — prevents full remount on every render
// ═════════════════════════════════════════════════════════════════════════════
const FeedChunks = React.memo(({ chunks, adsReady }: { chunks: ChunkType[]; adsReady: boolean }) => (
  <div className="space-y-10">
    {chunks.map((chunk, ci) => (
      <div key={chunk.feature?.slug ?? ci} className="space-y-6">
        {chunk.feature && (
          <div className="border-b border-divider pb-6">
            <Suspense fallback={<div className="h-64 bg-zinc-900 animate-pulse rounded" />}>
              <ArticleCard post={chunk.feature} priority={ci === 0} />
            </Suspense>
          </div>
        )}
        {chunk.compacts.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-5">
            {chunk.compacts.map(post => (
              <CompactCard key={post.slug} post={post} />
            ))}
          </div>
        )}
        {/* FIX #4: Ads only render after page is interactive */}
        {chunk.adAfter && adsReady && (
          <div className="py-4 border-y border-divider/50" style={{ minHeight: 120 }}>
            <AdUnit type="inarticle" />
          </div>
        )}
      </div>
    ))}
  </div>
));

// ─── CHUNK BUILDER — module-level pure function ───────────────────────────────
function buildChunks(posts: Post[]): ChunkType[] {
  const chunks: ChunkType[] = [];
  for (let i = 0; i < posts.length; i += 4) {
    chunks.push({
      feature:  posts[i],
      compacts: posts.slice(i + 1, i + 4),
      adAfter:  (chunks.length + 1) % 2 === 0,
    });
  }
  return chunks;
}

// ═════════════════════════════════════════════════════════════════════════════
// FIX #5 (bundle size): cap at 100 posts — computed once at module level
// ═════════════════════════════════════════════════════════════════════════════
const RAW_POSTS = getAllPosts().slice(0, 100);

// ═════════════════════════════════════════════════════════════════════════════
// INDEX PAGE
// ═════════════════════════════════════════════════════════════════════════════
const Index = () => {
  const [visibleCount, setVisibleCount]     = useState(INITIAL_LOAD);
  const [viewCounts, setViewCounts]         = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string>("all");
  // FIX #4: gate for deferred ad rendering
  const [adsReady, setAdsReady]             = useState(false);
  const loaderRef                           = useRef<HTMLDivElement>(null);

  // Fetch views deferred — never blocks first paint
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/get-views");
        if (res.ok) setViewCounts(await res.json());
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // FIX #4: Defer ads until after page is interactive — prevents TBT + CLS from ad scripts
  useEffect(() => {
    const t = setTimeout(() => setAdsReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // ── Attach stable view counts ──
  const postsWithViews: Post[] = useMemo(() =>
    RAW_POSTS.map(post => {
      const clean        = post.slug.replace(/^//, "").replace(/.md$/, "");
      const real         = viewCounts[`/article/${clean}`] || 0;
      const _stableViews = real > 0 ? real : stableFakeViews(post.slug);
      return { ...post, views: _stableViews, _stableViews };
    }),
    [viewCounts]
  );

  // ── PRISM feed ──
  const prismFeed = useMemo(() => buildPrismFeed(postsWithViews), [postsWithViews]);

  // ── Hero ──
  const { lead: heroLead, secondary: heroSecondary } = useMemo(
    () => selectHero(prismFeed),
    [prismFeed]
  );

  const heroSlugs = useMemo(() =>
    new Set([heroLead?.slug, ...heroSecondary.map(p => p.slug)]),
    [heroLead, heroSecondary]
  );

  // ── Latest strip ──
  const latestStrip = useMemo(() =>
    [...postsWithViews]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [postsWithViews]
  );

  // ── Author posts ──
  const authorPosts = useMemo(() =>
    AUTHORS.map(author => ({
      ...author,
      latest: prismFeed.find(p => p.author?.toLowerCase() === author.name.toLowerCase()),
    })),
    [prismFeed]
  );

  // ── Main feed ──
  const feedSource = useMemo(() => {
    const base = prismFeed.filter(p => !heroSlugs.has(p.slug));
    if (activeCategory === "all") return base;
    return base.filter(p => p.category?.toLowerCase() === activeCategory);
  }, [prismFeed, heroSlugs, activeCategory]);

  // ── Split into TODAY / OLDER ──
  const { todayPosts, olderPosts } = useMemo(() => ({
    todayPosts: feedSource.filter(p => isToday(p.date)),
    olderPosts: feedSource.filter(p => !isToday(p.date)),
  }), [feedSource]);

  const displayedOlder = olderPosts.slice(0, visibleCount);
  const hasMore        = visibleCount < olderPosts.length;

  // ── Infinite scroll ──
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(prev => prev + LOAD_MORE_COUNT); },
      { rootMargin: "400px" }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore]);

  // ── Most read ──
  const mostRead = useMemo(() =>
    [...postsWithViews]
      .sort((a, b) => (b._stableViews ?? 0) - (a._stableViews ?? 0))
      .slice(0, 6),
    [postsWithViews]
  );

  // ── Politics/News sidebar ──
  const politicsPosts = useMemo(() =>
    prismFeed.filter(p => ["news", "politics"].includes(p.category?.toLowerCase())).slice(0, 4),
    [prismFeed]
  );

  const todayChunks = useMemo(() => buildChunks(todayPosts),    [todayPosts]);
  const olderChunks = useMemo(() => buildChunks(displayedOlder), [displayedOlder]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(RAW_POSTS.map(p => p.category?.toLowerCase()).filter(Boolean)));
    return ["all", ...cats];
  }, []);

  const optimizedHeroImage = heroLead?.image
    ? img(heroLead.image, 1400)
    : "/images/placeholder.jpg";

  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
    setVisibleCount(INITIAL_LOAD);
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Breaking Kenya News, Entertainment Gossip & Trending Scoops</title>
        <meta name="description" content="Get the latest breaking news in Kenya today. Za Ndani delivers exclusive Nairobi entertainment gossip, political updates, trending celebrity news, and sports." />
        <link rel="canonical" href="https://zandani.co.ke" />
        {heroLead && (
          <link rel="preload" as="image" href={optimizedHeroImage} fetchPriority="high" />
        )}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "WebSite", "name": "Za Ndani",
          "url": "https://zandani.co.ke",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://zandani.co.ke/tag/{search_term_string}",
            "query-input": "required name=search_term_string",
          },
        })}</script>
        <style>{`
          ins.adsbygoogle[data-ad-status="filled"] { display: block !important; }
          .adsense-no-inject { contain: layout style; }
          .adsbygoogle:not([data-ad-slot]) { min-height: 90px; }
          aside .adsbygoogle { max-width: 100% !important; }
        `}</style>
      </Helmet>

      {/* ══ HERO ══ */}
      {heroLead && (
        <section className="bg-zinc-950 border-b border-zinc-800 adsense-no-inject">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            <div className="grid lg:grid-cols-12 gap-1">

              {/* Lead story — eager load for LCP */}
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
                  width={840}
                  height={480}
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
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{heroLead._stableViews?.toLocaleString()} views</span>
                      <span className="text-zinc-600">By {heroLead.author}</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* FIX #3: Secondary hero images — lazy (not eager) to avoid bandwidth competition */}
              <div className="lg:col-span-5 flex flex-col gap-1">
                {heroSecondary.map(post => (
                  <Link
                    key={post.slug}
                    to={`/article/${post.slug}`}
                    className="group relative overflow-hidden flex-1 block"
                    style={{ minHeight: 235 }}
                  >
                    <img
                      src={img(post.image, 700)}
                      alt={post.title}
                      loading="lazy"
                      width={560}
                      height={235}
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

      {/* ══ LATEST STRIP ══ */}
      <section className="bg-zinc-900 border-b border-zinc-800 py-3 adsense-no-inject">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-rose-500 whitespace-nowrap flex-shrink-0">
              <Zap className="w-3.5 h-3.5" /> Just In
            </span>
            <div className="w-px h-4 bg-zinc-700 flex-shrink-0" />
            {latestStrip.map((post, i) => (
              <React.Fragment key={post.slug}>
                <Link to={`/article/${post.slug}`} className="flex items-center gap-2 group whitespace-nowrap flex-shrink-0">
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

      {/* ══ MAIN CONTENT + SIDEBAR ══ */}
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
                    onClick={() => handleCategoryChange(cat)}
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

              {/* Feed header */}
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  {activeCategory === "all" ? "Latest Stories" : activeCategory}
                  <Flame className="w-5 h-5 text-primary" />
                </h2>
                <div className="h-px flex-1 bg-divider" />
                <span className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" /> PRISM ranked · {feedSource.length} stories
                </span>
              </div>

              {/* ── TODAY'S POSTS ── */}
              {todayChunks.length > 0 && (
                <div>
                  <TodaySectionHeader />
                  <FeedChunks chunks={todayChunks} adsReady={adsReady} />
                </div>
              )}

              {/* ── OLDER POSTS ── */}
              {olderChunks.length > 0 && (
                <div>
                  {todayChunks.length > 0 && <OlderSectionHeader />}
                  <FeedChunks chunks={olderChunks} adsReady={adsReady} />
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={loaderRef} className="py-4 flex justify-center">
                {hasMore ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading more stories…
                  </div>
                ) : (
                  feedSource.length > 0 && (
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      · All stories loaded ·
                    </span>
                  )
                )}
              </div>
            </main>

            {/* ── SIDEBAR ── */}
            <aside className="lg:col-span-4 space-y-10">

              {/* Most Read */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Most Read</h3>
                  <div className="h-px flex-1 bg-divider" />
                </div>
                <div className="space-y-5">
                  {mostRead.map((post, i) => (
                    <Link key={post.slug} to={`/article/${post.slug}`} className="group flex gap-4">
                      <span className="text-3xl font-black text-zinc-800 group-hover:text-primary transition-colors">
                        0{i + 1}
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold leading-tight line-clamp-2 group-hover:underline">
                          {post.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">
                          {post.category}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* FIX #4: Sidebar ad — deferred until adsReady */}
              <div style={{ minHeight: 280 }}>
                {adsReady && <AdUnit type="effectivegate" />}
              </div>

              {/* Politics/News */}
              <div className="bg-zinc-950 p-6 border border-zinc-800">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" /> Politics & News
                </h3>
                <div className="space-y-6">
                  {politicsPosts.map(post => (
                    <CompactCard key={post.slug} post={post} />
                  ))}
                </div>
                <Button variant="link" className="px-0 mt-4 text-xs font-bold uppercase text-blue-500 hover:text-blue-400">
                  View all news <ArrowRight className="ml-1 w-3 h-3" />
                </Button>
              </div>

              {/* Authors */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest">Our Voices</h3>
                <div className="space-y-8">
                  {authorPosts.map(author => (
                    <div key={author.name} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${author.color} flex items-center justify-center text-white font-black text-xs`}>
                          {author.avatar}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">{author.name}</h4>
                          <p className="text-[10px] text-primary uppercase font-black tracking-tighter">{author.role}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">"{author.bio}"</p>
                      {author.latest && (
                        <Link
                          to={`/article/${author.latest.slug}`}
                          className="block bg-zinc-900/50 p-2 border-l-2 border-primary group"
                        >
                          <span className="text-[9px] uppercase text-zinc-500 font-bold">Latest Scoop</span>
                          <p className="text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">
                            {author.latest.title}
                          </p>
                        </Link>
                      )}
                    </div>
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