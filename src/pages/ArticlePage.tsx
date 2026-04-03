import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { getPostBySlug, getLatestPosts } from "@/lib/markdown";
import {
  Clock, Calendar, Share2, Facebook, Linkedin,
  ChevronLeft, ArrowUp, Eye, MessageCircle, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { XIcon } from "@/components/XIcon";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Helmet } from "react-helmet-async";
import AdUnit from "@/components/AdUnit";

// ─── CATEGORY COLOR MAP ───────────────────────────────────────────────────────
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

// ─── IMAGE PROXY (for rendered images — WebP conversion) ─────────────────────
function proxyImg(url: string, w = 1200): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=85&we`;
}

// ─── OG IMAGE (absolute URL, forced 1200×630, for social/SEO use only) ───────
const SITE_URL = "https://zandani.co.ke";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/default-og.jpg`; // 1200×630 fallback

function ogImg(url: string): string {
  if (!url) return DEFAULT_OG_IMAGE;
  // Local/relative image — make absolute
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  // External (imgbb / postimages) — proxy to enforce 1200×630 + WebP
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=1200&h=630&fit=cover&output=webp&q=85`;
}

// ─── WORD COUNT (accurate: strips HTML tags first) ───────────────────────────
function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;
}

// ─── AUTHOR BIOS ──────────────────────────────────────────────────────────────
const AUTHOR_BIOS: Record<string, string> = {
  "za ndani": "Sharp, cynical, and always first with the scoop. Za Ndani exposes what the mainstream won't touch — from celebrity scandals to industry secrets.",
  "mutheu ann": "Plugged into the global entertainment circuit. If a celebrity breathes wrong, Mutheu Ann notices — and she will write about it.",
  "celestine nzioka": "Authoritative and unflinching. Celestine cuts through political spin and media noise to give you the story behind the story.",
};

const AUTHOR_COLORS: Record<string, string> = {
  "za ndani": "bg-rose-600",
  "mutheu ann": "bg-purple-600",
  "celestine nzioka": "bg-blue-700",
};

// ─── AD TYPES CYCLE ───────────────────────────────────────────────────────────
const adTypes: Array<'inarticle' | 'effectivegate' | 'horizontal'> = ['inarticle', 'effectivegate', 'horizontal'];

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const post = useMemo(() => getPostBySlug(slug || ""), [slug]);
  const latestPosts = useMemo(() => getLatestPosts(6), []);
  const relatedPosts = useMemo(
    () => latestPosts.filter((p) => p.slug !== slug).slice(0, 3),
    [latestPosts, slug]
  );

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Views ──
  useEffect(() => {
    fetch('/api/get-views')
      .then(r => r.ok ? r.json() : {})
      .then(setViewCounts)
      .catch(() => {});
  }, []);

  const currentPostViews = useMemo(() => {
    if (!post) return 47;
    const clean = post.slug.replace(/^\//, '').replace(/\.md$/, '');
    return viewCounts[`/article/${clean}`] || viewCounts[`/article/${clean}/`] || 47;
  }, [post, viewCounts]);

  const relatedWithViews = useMemo(() =>
    relatedPosts.map(p => {
      const clean = p.slug.replace(/^\//, '').replace(/\.md$/, '');
      const v = viewCounts[`/article/${clean}`] || viewCounts[`/article/${clean}/`] || 47;
      return { ...p, views: v };
    }),
    [relatedPosts, viewCounts]
  );

  // ── Preload hero image ──
  useEffect(() => {
    if (!post?.image) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = proxyImg(post.image, 1200);
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [post?.image]);

  // ── Reset scroll on slug change ──
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [slug]);

  // ── Scroll events: progress bar + scroll-to-top ──
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setShowScrollTop(window.scrollY > 500);
        const pct = Math.min(
          (window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)) * 100,
          100
        );
        if (progressRef.current) progressRef.current.style.width = `${pct}%`;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  const shareUrl = useMemo(() =>
    typeof window !== "undefined" ? window.location.href : `${SITE_URL}/article/${post?.slug}`,
    [post?.slug]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  const handleWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(post?.title + " " + shareUrl)}`, "_blank");
  }, [post?.title, shareUrl]);

  // ── Content with ads injected every 3 paragraphs ──
  const contentWithAds = useMemo(() => {
    if (!post?.htmlContent) return [];
    const html = post.htmlContent;
    const blocks: string[] = [];
    let lastIndex = 0;
    const tagRegex = /<(p|h[1-6]|ul|ol|blockquote|figure|table|pre|hr)[\s>]/gi;
    const tagStarts: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = tagRegex.exec(html)) !== null) {
      const before = html.slice(0, m.index);
      const opens = (before.match(/<(?:div|section|aside|blockquote)\b/gi) || []).length;
      const closes = (before.match(/<\/(?:div|section|aside|blockquote)>/gi) || []).length;
      if (opens - closes <= 0) tagStarts.push(m.index);
    }
    for (let i = 0; i < tagStarts.length; i++) {
      if (tagStarts[i] > lastIndex) {
        const gap = html.slice(lastIndex, tagStarts[i]).trim();
        if (gap) blocks.push(gap);
      }
      const end = i + 1 < tagStarts.length ? tagStarts[i + 1] : html.length;
      blocks.push(html.slice(tagStarts[i], end));
      lastIndex = end;
    }
    if (lastIndex < html.length) {
      const rem = html.slice(lastIndex).trim();
      if (rem) blocks.push(rem);
    }
    const nodes: React.ReactNode[] = [];
    let paraCount = 0;
    let adCount = 0;
    blocks.forEach((block, i) => {
      nodes.push(<div key={`b-${i}`} dangerouslySetInnerHTML={{ __html: block }} />);
      if (/^<p[\s>]/i.test(block)) {
        paraCount++;
        if (paraCount % 3 === 0) {
          nodes.push(
            <div key={`ad-${adCount}`} className="my-8 flex justify-center border-y border-divider py-4 bg-muted/10">
              <AdUnit type={adTypes[adCount % adTypes.length]} />
            </div>
          );
          adCount++;
        }
      }
    });
    return nodes;
  }, [post?.htmlContent]);

  // ── Formatted date ──
  const formattedDate = useMemo(() =>
    post ? new Date(post.date).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }) : "",
    [post?.date]
  );

  // ── SEO-ready OG image (absolute, 1200×630) ──
  const postOgImage = useMemo(() => post ? ogImg(post.image) : DEFAULT_OG_IMAGE, [post?.image]);

  // ── Canonical URL ──
  const canonicalUrl = useMemo(() =>
    post ? `${SITE_URL}/article/${post.slug}` : SITE_URL,
    [post?.slug]
  );

  // ── Truncated description (155 chars max) ──
  const metaDescription = useMemo(() =>
    post ? post.excerpt.slice(0, 155) + (post.excerpt.length > 155 ? "…" : "") : "",
    [post?.excerpt]
  );

  // ── ISO datetime for machine-readable timestamps ──
  const isoPublished = useMemo(() => {
    if (!post) return "";
    const d = new Date(post.date);
    return isNaN(d.getTime()) ? post.date : d.toISOString();
  }, [post?.date]);

  // ── Schema: NewsArticle (enhanced for Google News) ──
  const articleSchema = useMemo(() => post ? {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": metaDescription,
    "image": [
      {
        "@type": "ImageObject",
        "url": postOgImage,
        "width": 1200,
        "height": 630,
      },
    ],
    "datePublished": isoPublished,
    "dateModified": isoPublished,
    "author": {
      "@type": "Person",
      "name": post.author,
      "url": `${SITE_URL}/author/${post.author.toLowerCase().replace(/\s+/g, '-')}`,
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "Za Ndani",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/logo.png`,
        "width": 600,
        "height": 60,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "Za Ndani",
      "url": SITE_URL,
    },
    "keywords": post.tags.join(", "),
    "articleSection": post.category,
    "articleBody": post.content?.substring(0, 500),
    "inLanguage": "en-KE",
    "isAccessibleForFree": true,
    "wordCount": wordCount(post.htmlContent || ""),
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".article-headline", ".article-excerpt"],
    },
    "copyrightHolder": {
      "@type": "Organization",
      "name": "Za Ndani",
    },
    "copyrightYear": new Date(post.date).getFullYear(),
  } : null, [post, metaDescription, postOgImage, canonicalUrl, isoPublished]);

  // ── Schema: BreadcrumbList ──
  const breadcrumbSchema = useMemo(() => post ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": post.category, "item": `${SITE_URL}/category/${post.category.toLowerCase()}` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": canonicalUrl },
    ],
  } : null, [post, canonicalUrl]);

  // ── 404 ──
  if (!post) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">This article may have been moved or deleted.</p>
          <Button asChild><Link to="/">Back to Home</Link></Button>
        </div>
      </Layout>
    );
  }

  const authorKey = post.author.toLowerCase();
  const authorBio = AUTHOR_BIOS[authorKey] || "Za Ndani journalist covering the stories that matter in Kenya.";
  const authorColor = AUTHOR_COLORS[authorKey] || "bg-zinc-600";
  const authorInitials = post.author.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Layout>
      {/* ════ ALL META TAGS + JSON-LD INSIDE HELMET ════ */}
      <Helmet>
        <title>{post.title} | Za Ndani</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={post.tags.join(", ") + ", za ndani, kenya news"} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Za Ndani" />
        <meta property="og:locale" content="en_KE" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={postOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={post.title} />
        <meta property="og:image:type" content="image/webp" />

        {/* Article specific */}
        <meta property="article:published_time" content={post.date} />
        <meta property="article:modified_time" content={post.date} />
        <meta property="article:section" content={post.category} />
        <meta property="article:author" content={post.author} />
        {post.tags.map((tag: string) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter / X Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@zandanikenya" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={postOgImage} />
        <meta name="twitter:image:alt" content={post.title} />

        {/* JSON-LD — MUST be inside Helmet so it lands in <head> */}
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      {/* Reading progress bar */}
      <div ref={progressRef} className="fixed top-0 left-0 h-[3px] bg-primary z-[60] transition-none" style={{ width: "0%" }} />

      {/* ════ HERO ════ */}
      <section className="relative w-full bg-zinc-950 overflow-hidden" style={{ minHeight: 540 }}>
        <img
          src={proxyImg(post.image, 1400)}
          alt={post.title}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[center_20%] opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />

        <div className="relative z-10 pt-6 px-4">
          <div className="container max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <span>/</span>
              <Link to={`/category/${post.category.toLowerCase()}`} className="hover:text-zinc-300 transition-colors capitalize">
                {post.category}
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 container max-w-5xl mx-auto px-4 pb-14 pt-8">
          <div className="max-w-3xl space-y-5">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-white px-3 py-1.5 ${catColor(post.category)}`}>
              <Flame className="w-3 h-3" /> {post.category}
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black text-white leading-[1.08] tracking-tight">
              {post.title}
            </h1>
            <p className="text-zinc-300 text-base md:text-lg leading-relaxed max-w-2xl font-light">
              {post.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm pt-1">
              <Link to={`/author/${post.author.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-2 group">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 ${authorColor}`}>
                  {authorInitials}
                </div>
                <span className="text-white font-bold text-sm group-hover:text-primary transition-colors">{post.author}</span>
              </Link>
              <span className="text-zinc-500">·</span>
              <span className="flex items-center gap-1.5 text-zinc-400"><Calendar className="w-3.5 h-3.5" /> {formattedDate}</span>
              <span className="text-zinc-500">·</span>
              <span className="flex items-center gap-1.5 text-zinc-400"><Clock className="w-3.5 h-3.5" /> {post.readTime} min read</span>
              <span className="text-zinc-500">·</span>
              <span className="flex items-center gap-1.5 text-primary font-semibold">
                <Eye className="w-3.5 h-3.5" />
                {currentPostViews > 999 ? `${(currentPostViews / 1000).toFixed(1)}k` : currentPostViews} views
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ════ ARTICLE BODY + SIDEBAR ════ */}
      <div className="bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-12 gap-10">

            {/* Left sticky share */}
            <div className="hidden lg:flex lg:col-span-1 flex-col items-center">
              <div className="sticky top-28 flex flex-col gap-3">
                <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")} className="w-9 h-9 rounded-full border border-divider flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground" aria-label="Share on Facebook"><Facebook className="w-4 h-4" /></button>
                <button onClick={() => window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`, "_blank")} className="w-9 h-9 rounded-full border border-divider flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground" aria-label="Share on X"><XIcon className="w-4 h-4" /></button>
                <button onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}`, "_blank")} className="w-9 h-9 rounded-full border border-divider flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground" aria-label="Share on LinkedIn"><Linkedin className="w-4 h-4" /></button>
                <button onClick={handleWhatsApp} className="w-9 h-9 rounded-full border border-divider flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-colors text-muted-foreground" aria-label="Share on WhatsApp"><MessageCircle className="w-4 h-4" /></button>
                <button onClick={handleCopy} className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${copied ? "border-primary text-primary" : "border-divider text-muted-foreground hover:border-primary hover:text-primary"}`} aria-label="Copy link"><Share2 className="w-4 h-4" /></button>
                {copied && <span className="text-[10px] text-primary font-bold text-center leading-tight">Copied!</span>}
              </div>
            </div>

            {/* Article content */}
            <article className="lg:col-span-8 min-w-0">
              <div className="mb-8 flex justify-center border border-divider bg-muted/10 p-3">
                <AdUnit type="horizontal" />
              </div>
              <div ref={contentRef} className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-serif prose-headings:font-black prose-headings:text-foreground prose-headings:tracking-tight prose-headings:mt-10 prose-headings:mb-4 prose-h2:text-2xl prose-h2:border-l-4 prose-h2:border-primary prose-h2:pl-4 prose-h3:text-xl prose-p:text-foreground prose-p:leading-[1.9] prose-p:mb-6 prose-p:text-[17px] prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-black prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/40 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:text-foreground prose-blockquote:rounded-r-lg prose-blockquote:my-8 prose-img:rounded-lg prose-img:shadow-lg prose-img:my-10 prose-li:mb-2 prose-li:leading-8 prose-ul:mb-6 prose-ol:mb-6 first-letter:text-6xl first-letter:font-serif first-letter:font-black first-letter:text-primary first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:mt-1">
                {contentWithAds}
              </div>

              {post.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-divider">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Tags:</span>
                    {post.tags.map((tag: string) => (
                      <Link key={tag} to={`/tag/${encodeURIComponent(tag)}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-xs px-3 py-1 rounded-none">{tag}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-12 border border-divider bg-surface">
                <div className={`h-1 w-full ${authorColor}`} />
                <div className="p-6 flex gap-5 items-start">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0 ${authorColor}`}>{authorInitials}</div>
                  <div>
                    <Link to={`/author/${post.author.toLowerCase().replace(/\s+/g, '-')}`} className="font-black text-base hover:text-primary transition-colors">{post.author}</Link>
                    <p className="text-muted-foreground text-sm leading-relaxed mt-1 mb-3">{authorBio}</p>
                    <Link to={`/author/${post.author.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1">All stories by {post.author.split(" ")[0]} →</Link>
                  </div>
                </div>
              </div>

              <div className="mt-10 border border-divider bg-zinc-950 p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <h3 className="font-black text-xl text-white uppercase tracking-tight">Never Miss The Tea</h3>
                </div>
                <p className="text-zinc-400 text-sm mb-6">Fresh Kenyan gossip and news straight to your inbox every morning.</p>
                <NewsletterForm />
              </div>

              <div className="mt-10 flex justify-center border border-divider bg-muted/10 p-3">
                <AdUnit type="horizontal" />
              </div>

              {relatedWithViews.length > 0 && (
                <section className="mt-14 pt-8 border-t border-divider">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight">More Hot Stories</h3>
                    <div className="h-px flex-1 bg-divider" />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-5">
                    {relatedWithViews.map((rp: any) => (
                      <Link key={rp.slug} to={`/article/${rp.slug}`} className="group block">
                        <div className="relative overflow-hidden h-36 mb-3">
                          <img src={proxyImg(rp.image, 400)} alt={rp.title} loading="lazy" className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase tracking-wider text-white px-1.5 py-0.5 ${catColor(rp.category)}`}>{rp.category}</span>
                            <span className="flex items-center gap-1 text-[10px] text-zinc-300 bg-black/50 px-1.5 py-0.5"><Eye className="w-3 h-3" />{rp.views > 999 ? `${(rp.views / 1000).toFixed(1)}k` : rp.views}</span>
                          </div>
                        </div>
                        <h4 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{rp.title}</h4>
                        <span className="text-xs text-muted-foreground mt-1 block">{rp.author}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-28 space-y-8">
                <div className="border border-divider bg-muted/10 p-3 flex justify-center"><AdUnit type="effectivegate" /></div>
                <div className="border border-divider">
                  <div className={`h-1 w-full ${authorColor}`} />
                  <div className="px-4 py-3 border-b border-divider">
                    <h4 className="text-xs font-black uppercase tracking-wider">More from {post.author.split(" ")[0]}</h4>
                  </div>
                  <div className="divide-y divide-divider">
                    {relatedWithViews.slice(0, 3).map((rp: any) => (
                      <Link key={rp.slug} to={`/article/${rp.slug}`} className="flex gap-3 p-3 group hover:bg-muted/20 transition-colors">
                        <div className="w-16 h-16 flex-shrink-0 overflow-hidden">
                          <img src={proxyImg(rp.image, 120)} alt={rp.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{rp.title}</h5>
                          <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Eye className="w-3 h-3" />{rp.views > 999 ? `${(rp.views / 1000).toFixed(1)}k` : rp.views}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="border border-divider bg-muted/10 p-3 flex justify-center"><AdUnit type="inarticle" /></div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile share bar */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-3 bg-background/95 backdrop-blur-lg border border-divider p-3 shadow-2xl">
        <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")} className="h-10 w-10 rounded-full border border-divider flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground"><Facebook className="w-4 h-4" /></button>
        <button onClick={() => window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`, "_blank")} className="h-10 w-10 rounded-full border border-divider flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground"><XIcon className="w-4 h-4" /></button>
        <button onClick={handleWhatsApp} className="h-10 w-10 rounded-full border border-divider flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-colors text-muted-foreground"><MessageCircle className="w-4 h-4" /></button>
        <button onClick={handleCopy} className={`h-10 w-10 rounded-full border flex items-center justify-center transition-colors ${copied ? "border-primary text-primary" : "border-divider text-muted-foreground"}`}><Share2 className="w-4 h-4" /></button>
        {copied && <span className="text-xs text-primary font-bold absolute -top-6 right-4">Copied!</span>}
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-24 right-5 lg:bottom-6 lg:right-6 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:opacity-90 transition-opacity z-40" aria-label="Scroll to top">
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </Layout>
  );
}
