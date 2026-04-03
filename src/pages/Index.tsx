import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Flame, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";
import AdUnit from "@/components/AdUnit";

const INITIAL_LOAD = 12;
const LOAD_MORE_COUNT = 12;
const SITE_URL = "https://zandani.co.ke";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/default-og.jpg`;

// â”€â”€â”€ IMAGE PROXY (rendered images â€” WebP conversion) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function img(url: string, w = 800): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=75&we`;
}

// â”€â”€â”€ OG IMAGE (absolute URL, forced dimensions, for meta tags only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ogImg(url: string): string {
  if (!url) return DEFAULT_OG_IMAGE;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=1200&h=630&fit=cover&output=webp&q=85`;
}

// â”€â”€â”€ RELATIVE TIME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

// â”€â”€â”€ CATEGORY COLOR MAP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ STABLE FAKE VIEWS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ MOBILE TOP CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ MOST READ WIDGET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ FEED CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        <span>Â·</span>
        <span>{post.readTime} min</span>
      </div>
    </div>
  </article>
));

// â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�
// INDEX PAGE
// â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�
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
  const heroSecondary = RAW_POSTS.slice(1, 5);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(RAW_POSTS.map(p => p.category?.toLowerCase()).filter(Boolean)));
    return ["all", ...cats];
  }, []);

  const feedSource = useMemo(() => {
    const base = RAW_POSTS.slice(5);
    if (activeCategory === "all") return base;
    return base.filter(p => p.category?.toLowerCase() === activeCategory);
  }, [activeCategory]);

  const displayedPosts = feedSource.slice(0, visibleCount);
  const hasMore = visibleCount < feedSource.length;

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

  // â”€â”€ OG image: use hero lead's image (proxied to 1200Ã—630) or fallback â”€â”€
  const homeOgImage = heroLead ? ogImg(heroLead.image) : DEFAULT_OG_IMAGE;

  // â”€â”€ WebSite schema â”€â”€
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Za Ndani",
    "url": SITE_URL,
    "description": "Breaking Kenyan news, entertainment gossip, politics, and sports.",
    "inLanguage": "en-KE",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/tag/{search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  // â”€â”€ ItemList schema for top articles (helps Google index article links) â”€â”€
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Latest Stories",
    "url": SITE_URL,
    "itemListElement": RAW_POSTS.slice(0, 10).map((post, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `${SITE_URL}/article/${post.slug}`,
      "name": post.title,
    })),
  };

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani | Breaking Kenya News, Entertainment Gossip & Trending Scoops</title>
        <meta name="description" content="Get the latest breaking news in Kenya today. Za Ndani delivers exclusive Nairobi entertainment gossip, political updates, trending celebrity news, and sports." />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={SITE_URL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="Za Ndani" />
        <meta property="og:locale" content="en_KE" />
        <meta property="og:title" content="Za Ndani | Breaking Kenya News, Entertainment & Gossip" />
        <meta property="og:description" content="Get the latest breaking news in Kenya today. Za Ndani delivers exclusive Nairobi entertainment gossip, political updates, trending celebrity news, and sports." />
        <meta property="og:image" content={homeOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Za Ndani â€” Kenya News & Gossip" />
        <meta property="og:image:type" content="image/webp" />

        {/* Twitter / X Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@zandanikenya" />
        <meta name="twitter:title" content="Za Ndani | Breaking Kenya News, Entertainment & Gossip" />
        <meta name="twitter:description" content="Get the latest breaking news in Kenya today. Za Ndani delivers exclusive Nairobi entertainment gossip, political updates, trending celebrity news, and sports." />
        <meta name="twitter:image" content={homeOgImage} />
        <meta name="twitter:image:alt" content="Za Ndani â€” Kenya News & Gossip" />

        {/* Preload hero image for LCP */}
        {heroLead && <link rel="preload" as="image" href={optimizedHeroImage} fetchPriority="high" />}

        {/* JSON-LD schemas */}
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      {/* â•�â•� HERO â•�â•� */}
      {heroLead && (
        <section className="bg-zinc-950 border-b border-zinc-800">
          <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-3">

            {/* â”€â”€ MOBILE HERO â”€â”€ */}
            <div className="lg:hidden space-y-2">
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
              <div className="grid grid-cols-2 gap-1.5">
                {heroSecondary.map(post => (
                  <Link key={post.slug} to={`/article/${post.slug}`} className="group relative overflow-hidden block aspect-[4/3]">
                    <img src={img(post.image, 400)} alt={post.title} loading="lazy" className="w-full h-full object-cover opacity-65 group-hover:opacity-80 transition-opacity absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                      <span className={`text-[8px] font-black tracking-widest uppercase text-white px-1 py-0.5 mb-1 inline-block ${catColor(post.category)}`}>{post.category}</span>
                      <h2 className="text-white font-bold text-[11px] leading-tight line-clamp-2">{post.title}</h2>
                      <span className="text-zinc-400 text-[9px] flex items-center gap-0.5 mt-0.5"><Clock className="w-2.5 h-2.5" />{timeAgo(post.date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* â”€â”€ DESKTOP HERO â”€â”€ */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-1">
              <Link to={`/article/${heroLead.slug}`} className="lg:col-span-7 group relative overflow-hidden block aspect-[16/10]">
                <img src={optimizedHeroImage} alt={heroLead.title} fetchPriority="high" loading="eager" decoding="async" width={840} height={525} className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity duration-500 absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                  <span className={`text-[10px] font-black tracking-[0.2em] uppercase text-white px-2 py-1 ${catColor(heroLead.category)}`}>{heroLead.category}</span>
                  <h1 className="text-3xl lg:text-4xl font-serif font-black text-white leading-tight mt-3 line-clamp-3">{heroLead.title}</h1>
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
                    <img src={img(post.image, 600)} alt={post.title} loading="lazy" width={560} height={235} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <span className={`text-[9px] font-black tracking-widest uppercase text-white px-1.5 py-0.5 mb-2 inline-block ${catColor(post.category)}`}>{post.category}</span>
                      <h2 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h2>
                      <span className="text-zinc-500 text-xs mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* â•�â•� MAIN CONTENT + SIDEBAR â•�â•� */}
      <section className="py-4 md:py-8 lg:py-12 bg-background">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4">

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
            <main className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-4 md:mb-5">
                <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                  {activeCategory === "all" ? "Latest Stories" : activeCategory}
                  <Flame className="w-4 h-4 text-primary" />
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="lg:hidden mb-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                  {displayedPosts.slice(0, 4).map(post => (
                    <MobileTopCard key={post.slug} post={post} />
                  ))}
                </div>
              </div>

              <div>
                {displayedPosts.map((post, i) => (
                  <React.Fragment key={post.slug}>
                    <div className={i < 4 ? "hidden lg:block" : ""}>
                      <FeedCard post={post} />
                    </div>
                    {i === 5 && (
                      <div className="lg:hidden my-5">
                        <MostReadMobile posts={mostRead} />
                      </div>
                    )}
                    {(i + 1) % 6 === 0 && adsReady && (
                      <div className="py-3 border-y border-border/50" style={{ minHeight: 120 }}>
                        <AdUnit type="inarticle" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div ref={loaderRef} className="py-6 flex justify-center">
                {hasMore ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loadingâ€¦
                  </div>
                ) : (
                  feedSource.length > 0 && (
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Â· All stories loaded Â·</span>
                  )
                )}
              </div>
            </main>

            <aside className="hidden lg:block lg:col-span-4 space-y-8">
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
              <div style={{ minHeight: 280 }}>
                {adsReady && <AdUnit type="effectivegate" />}
              </div>
              <div className="bg-card p-5 border border-border">
                <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" /> More Stories
                </h3>
                <div className="space-y-4">
                  {RAW_POSTS.slice(10, 16).map(post => (
                    <Link key={post.slug} to={`/article/${post.slug}`} className="group block">
                      <h4 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h4>
                      <span className="text-[10px] text-muted-foreground">{post.category} Â· {timeAgo(post.date)}</span>
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