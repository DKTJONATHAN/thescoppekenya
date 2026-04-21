import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { getPostsByCategory, categories } from "@/lib/markdown";
import { ChevronDown, Eye, Clock, Flame, TrendingUp, Zap } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import AdUnit from "@/components/AdUnit";
import { LiveUpdatesTimeline } from "@/components/news/LiveUpdatesTimeline";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function catColor(cat: string): string {
  const c = cat?.toLowerCase() || "";
  if (c.includes("entertainment")) return "bg-rose-600";
  if (c.includes("politics"))      return "bg-blue-700";
  if (c.includes("news"))          return "bg-amber-600";

  if (c.includes("sports"))        return "bg-green-700";
  if (c.includes("tech"))          return "bg-cyan-700";
  if (c.includes("business"))      return "bg-cyan-700";
  if (c.includes("lifestyle"))     return "bg-purple-600";
  return "bg-zinc-600";
}

function catAccent(cat: string): string {
  const c = cat?.toLowerCase() || "";
  if (c.includes("entertainment")) return "border-rose-600";
  if (c.includes("politics"))      return "border-blue-700";
  if (c.includes("news"))          return "border-amber-600";

  if (c.includes("sports"))        return "border-green-700";
  if (c.includes("tech"))          return "border-cyan-700";
  if (c.includes("business"))      return "border-cyan-700";
  if (c.includes("lifestyle"))     return "border-purple-600";
  return "border-zinc-600";
}

function proxyImg(url: string, w = 600): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=80&we`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

const INITIAL_SHOW = 12;
const LOAD_MORE = 12;

// ─── SEO META MAP ─────────────────────────────────────────────────────────────
const categoryMeta: Record<string, { title: string; description: string; keywords: string }> = {

  news: {
    title: "Breaking Kenya News Today - Latest Updates & Politics | Za Ndani",
    description: "Breaking news Kenya today, Nairobi current affairs, politics, counties & national stories. Real-time verified Kenyan news on Za Ndani.",
    keywords: "breaking news kenya, kenya news today, latest news kenya, nairobi news, kenya politics news, current affairs kenya, za ndani news"
  },
  sports: {
    title: "Kenya Sports News - KPL, Harambee Stars & Athletics | Za Ndani",
    description: "Latest Kenya sports news: Harambee Stars, KPL standings, Gor Mahia, AFC Leopards, athletics & rugby. Live updates and analysis daily.",
    keywords: "kenya sports news, kpl news, harambee stars, kenya premier league, kenyan football news, athletics kenya, za ndani sports"
  },
  entertainment: {
    title: "Kenya Entertainment News - Music, TV, Movies & Nightlife | Za Ndani",
    description: "Latest Kenyan entertainment: music releases, TV shows, movies, Nairobi nightlife, events & celebrity lifestyle updates.",
    keywords: "kenya entertainment news, kenyan music news, nairobi entertainment, kenyan movies, bongo movies kenya, za ndani entertainment"
  },
  business: {
    title: "Kenya Business News - Economy, NSE & Investments | Za Ndani",
    description: "Kenya business news today, economy updates, NSE stock market, Safaricom, corporate deals & financial analysis on Za Ndani.",
    keywords: "kenya business news, kenya economy news, nse kenya, safaricom news, business news kenya today, za ndani business"
  },
  technology: {
    title: "Tech News Kenya - Startups, Safaricom & Innovation | Za Ndani",
    description: "Latest technology news Kenya: Safaricom, M-Pesa updates, Kenyan startups, gadgets, digital innovation & government tech policies.",
    keywords: "tech news kenya, kenya technology news, safaricom news, mpesa updates, kenyan startups, digital kenya, za ndani tech"
  },
  politics: {
    title: "Kenya Politics News - Government, Parliament & Elections | Za Ndani",
    description: "Latest Kenya political news: parliament, county governments, elections, Ruto administration and political analysis from Za Ndani.",
    keywords: "kenya politics news, kenyan government news, kenya parliament, kenya elections, za ndani politics"
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORY PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find(c => c.slug === slug);
  const posts = useMemo(() => getPostsByCategory(slug || ""), [slug]);

  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);

  useEffect(() => {
    fetch('/api/get-views').then(r => r.ok ? r.json() : {}).then(setViewCounts).catch(() => {});
  }, []);

  // Reset on category change
  useEffect(() => { setVisibleCount(INITIAL_SHOW); }, [slug]);

  const postsWithViews = useMemo(() =>
    posts.map(post => {
      const clean = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const v = viewCounts[`/article/${clean}`] || viewCounts[`/article/${clean}/`] || 0;
      return { ...post, views: v };
    }),
    [posts, viewCounts]
  );

  // Lead post = most viewed; rest = date sorted (already from markdown)
  const leadPost = postsWithViews[0];
  const secondaryPosts = postsWithViews.slice(1, 3);
  const feedPosts = postsWithViews.slice(3);
  const displayedFeed = feedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < feedPosts.length;

  // Trending sidebar = top 6 by views
  const trendingPosts = useMemo(() =>
    [...postsWithViews].sort((a, b) => b.views - a.views).slice(0, 6),
    [postsWithViews]
  );

  if (!category) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground">The category you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  const meta = categoryMeta[slug || ""] || {
    title: `${category.name} — Za Ndani`,
    description: category.description || `Latest ${category.name} news and stories on Za Ndani.`,
    keywords: `za ndani, kenya news, ${category.name.toLowerCase()}`
  };

  const colorClass = catColor(category.name);
  const accentClass = catAccent(category.name);

  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": meta.title,
    "description": meta.description,
    "url": `https://zandani.co.ke/category/${category.slug}`
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zandani.co.ke" },
      { "@type": "ListItem", "position": 2, "name": category.name, "item": `https://zandani.co.ke/category/${category.slug}` }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta name="googlebot-news" content="index, follow" />
        <meta name="news_keywords" content={meta.keywords} />
        <link rel="canonical" href={`https://zandani.co.ke/category/${category.slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://zandani.co.ke/category/${category.slug}`} />
        <meta property="og:site_name" content="Za Ndani" />
        <meta property="og:locale" content="en_KE" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content="https://zandani.co.ke/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@zandanikenya" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content="https://zandani.co.ke/logo.png" />
        <script type="application/ld+json">{JSON.stringify(categorySchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `${category.name} News`,
          "url": `https://zandani.co.ke/category/${category.slug}`,
          "numberOfItems": Math.min(posts.length, 20),
          "itemListElement": posts.slice(0, 20).map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `https://zandani.co.ke/article/${p.slug}`,
            "name": p.title,
          })),
        })}</script>
      </Helmet>

      {/* ── Category header ── */}
      <section className="bg-zinc-950 border-b border-zinc-800">
        <div className={`h-1.5 w-full ${colorClass}`} />
        <div className="container max-w-7xl mx-auto px-4 py-10">
          <CategoryBar />
          <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-white px-3 py-1.5 mb-3 ${colorClass}`}>
                <Flame className="w-3 h-3" /> {category.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-white leading-tight">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-zinc-400 text-base mt-2 max-w-xl">{category.description}</p>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-black text-white">{posts.length}</span> Stories
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Updates for this category */}
      <LiveUpdatesTimeline category={slug} title={`${category.name} Live Updates`} maxItems={10} />

      {postsWithViews.length === 0 ? (
        <div className="container py-32 text-center">
          <p className="text-muted-foreground text-lg font-serif italic">No articles in this category yet.</p>
        </div>
      ) : (
        <section className="py-10 md:py-14 bg-background">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-10">

              {/* ── MAIN CONTENT ── */}
              <main className="lg:col-span-8 space-y-10">

                {/* Editorial hero grid */}
                {leadPost && (
                  <div className="grid md:grid-cols-2 gap-1 mb-2">
                    {/* Lead — large */}
                    <Link to={`/article/${leadPost.slug}`}
                      className={`group relative overflow-hidden block border-l-4 ${accentClass} md:col-span-1`}
                      style={{ minHeight: 340 }}>
                      <img src={proxyImg(leadPost.image, 800)} alt={leadPost.title}
                        loading="eager"
                        className="absolute inset-0 w-full h-full object-cover object-[center_20%] opacity-65 group-hover:opacity-80 group-hover:scale-[1.02] transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      <div className="relative flex flex-col justify-end h-full p-6 z-10" style={{ minHeight: 340 }}>
                        <span className={`text-[9px] font-black uppercase tracking-widest text-white px-1.5 py-0.5 mb-2 w-fit ${colorClass}`}>
                          {leadPost.category}
                        </span>
                        <h2 className="text-white font-serif font-black text-xl leading-tight mb-2 group-hover:text-primary transition-colors">
                          {leadPost.title}
                        </h2>
                        <p className="text-zinc-300 text-xs line-clamp-2 mb-3 font-light">{leadPost.excerpt}</p>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(leadPost.date)}</span>
                          <span className="flex items-center gap-1 text-primary font-bold">
                            <Eye className="w-3 h-3" />{leadPost.views > 999 ? `${(leadPost.views / 1000).toFixed(1)}k` : leadPost.views}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Two secondary posts stacked */}
                    <div className="flex flex-col gap-1">
                      {secondaryPosts.map(post => (
                        <Link key={post.slug} to={`/article/${post.slug}`}
                          className="group relative overflow-hidden block flex-1"
                          style={{ minHeight: 165 }}>
                          <img src={proxyImg(post.image, 500)} alt={post.title}
                            loading="eager"
                            className="absolute inset-0 w-full h-full object-cover object-[center_20%] opacity-55 group-hover:opacity-75 group-hover:scale-[1.02] transition-all duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                          <div className="relative flex flex-col justify-end h-full p-4 z-10" style={{ minHeight: 165 }}>
                            <span className={`text-[9px] font-black uppercase tracking-widest text-white px-1.5 py-0.5 mb-1.5 w-fit ${colorClass}`}>
                              {post.category}
                            </span>
                            <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {post.title}
                            </h3>
                            <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1.5">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.date)}</span>
                              <span className="flex items-center gap-1 text-primary">
                                <Eye className="w-3 h-3" />{post.views > 999 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top banner ad */}
                <div className="flex justify-center border border-divider bg-muted/10 p-3">
                  <AdUnit type="horizontal" />
                </div>

                {/* Feed header */}
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    All {category.name} Stories <Flame className="w-5 h-5 text-primary" />
                  </h2>
                  <div className="h-px flex-1 bg-divider" />
                </div>

                {/* 3-column compact grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedFeed.map((post, i) => (
                    <React.Fragment key={post.slug}>
                      <Link to={`/article/${post.slug}`} className="group block border border-divider hover:border-primary transition-colors overflow-hidden">
                        <div className="relative h-40 overflow-hidden">
                          <img src={proxyImg(post.image, 400)} alt={post.title} loading="lazy"
                            className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className={`absolute bottom-2 left-2 text-[9px] font-black uppercase tracking-wider text-white px-1.5 py-0.5 ${colorClass}`}>
                            {post.category}
                          </span>
                          <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-zinc-300 bg-black/50 px-1.5 py-0.5">
                            <Eye className="w-3 h-3" />
                            {post.views > 999 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                            {post.title}
                          </h3>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.date)}</span>
                            <span>{post.author}</span>
                          </div>
                        </div>
                      </Link>

                      {/* Ad every 6 cards */}
                      {(i + 1) % 6 === 0 && i < displayedFeed.length - 1 && (
                        <div className="sm:col-span-2 lg:col-span-3 flex justify-center py-3 border-y border-divider bg-muted/10">
                          <AdUnit type={i % 3 === 0 ? "inarticle" : i % 3 === 1 ? "effectivegate" : "horizontal"} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => setVisibleCount(v => v + LOAD_MORE)}
                      className="group border-2 border-divider hover:border-primary hover:text-primary px-10 py-5 text-xs uppercase tracking-[0.2em] font-black transition-all inline-flex items-center gap-2"
                    >
                      Load More <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                    </button>
                  </div>
                )}

                {!hasMore && postsWithViews.length > 3 && (
                  <div className="py-16 text-center">
                    <p className="text-muted-foreground font-serif italic text-lg">You've read everything in {category.name} 🫖</p>
                  </div>
                )}
              </main>

              {/* ── SIDEBAR ── */}
              <aside className="hidden lg:block lg:col-span-4">
                <div className="sticky top-24 space-y-8">

                  {/* Trending in this category */}
                  <div className="border border-divider">
                    <div className={`h-1 w-full ${colorClass}`} />
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-divider">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-black uppercase tracking-wider">
                        Trending in {category.name}
                      </h3>
                    </div>
                    <div className="divide-y divide-divider">
                      {trendingPosts.map((post, i) => (
                        <Link key={post.slug} to={`/article/${post.slug}`}
                          className="flex gap-3 items-start p-4 group hover:bg-muted/20 transition-colors">
                          <span className="text-2xl font-serif font-black text-muted-foreground/20 leading-none flex-shrink-0 w-6 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.views > 999 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
                              </span>
                              <span>·</span>
                              <span>{timeAgo(post.date)}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar ad */}
                  <div className="flex justify-center bg-muted/10 p-4 border border-divider">
                    <AdUnit type="effectivegate" />
                  </div>

                  {/* Browse other categories */}
                  <div className="border border-divider">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-divider">
                      <Zap className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-black uppercase tracking-wider">Browse Categories</h3>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {categories
                        .filter(c => c.slug !== slug)
                        .map(c => (
                          <Link key={c.slug} to={`/category/${c.slug}`}
                            className={`text-[10px] font-black uppercase tracking-wider text-white px-2.5 py-1.5 hover:opacity-80 transition-opacity ${catColor(c.name)}`}>
                            {c.name}
                          </Link>
                        ))
                      }
                    </div>
                  </div>

                  {/* Second sidebar ad */}
                  <div className="flex justify-center bg-muted/10 p-4 border border-divider">
                    <AdUnit type="inarticle" />
                  </div>

                </div>
              </aside>

            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
