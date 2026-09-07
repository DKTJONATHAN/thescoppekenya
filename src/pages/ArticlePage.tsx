import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { getPostBySlug, getLatestPosts, type Post } from "@/lib/markdown";
import { Clock, Calendar, Share2, Facebook, ArrowUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { XIcon } from "@/components/XIcon";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Helmet } from "react-helmet-async";
import AdUnit from "@/components/AdUnit";
import { LiveUpdatesTimeline } from "@/components/news/LiveUpdatesTimeline";
import { ArticleBreadcrumbs } from "@/components/articles/ArticleBreadcrumbs";
import { StickyMobileShare } from "@/components/articles/StickyMobileShare";

const SITE_URL = "https://zandani.co.ke";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/default-og.jpg`;

function catColor(cat: string): string {
  const c = cat?.toLowerCase() || "";
  if (c.includes("gossip")) return "bg-fuchsia-600";
  if (c.includes("showbiz")) return "bg-violet-600";
  if (c.includes("entertainment")) return "bg-rose-600";
  if (c.includes("politics")) return "bg-blue-700";
  if (c.includes("news")) return "bg-amber-600";
  if (c.includes("sports")) return "bg-green-700";
  if (c.includes("tech")) return "bg-cyan-700";
  if (c.includes("business")) return "bg-emerald-700";
  if (c.includes("opinion")) return "bg-orange-700";
  return "bg-zinc-600";
}

function proxyImg(url: string, w = 1200): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=85&we`;
}

function ogImg(url: string): string {
  if (!url) return DEFAULT_OG_IMAGE;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return url;
}

const AUTHOR_BIOS: Record<string, string> = {
  "za ndani": "Sharp, cynical, and always first with the scoop. Za Ndani exposes what the mainstream won't touch.",
  "mutheu ann": "Plugged into Kenya's entertainment circuit.",
  "celestine nzioka": "Authoritative and unflinching. Celestine cuts through political spin.",
  "wanjiku kuria": "Nairobi gossip desk. Receipts first, noise second.",
  "martin kihara": "Showbiz beat for Kenyan stars.",
};

const AUTHOR_COLORS: Record<string, string> = {
  "za ndani": "bg-rose-600",
  "mutheu ann": "bg-purple-600",
  "celestine nzioka": "bg-blue-700",
  "wanjiku kuria": "bg-fuchsia-600",
  "martin kihara": "bg-violet-600",
};

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copied, setCopied] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    getPostBySlug(slug || "").then((p) => {
      setPost(p || null);
      setLoading(false);
    });
  }, [slug]);

  const relatedPosts = useMemo(() => {
    const latest = getLatestPosts(6);
    if (!post) return latest.filter((p) => p.slug !== slug).slice(0, 3);
    return latest.filter((p) => p.slug !== slug).slice(0, 3);
  }, [slug, post]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

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

  const shareUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.href : `${SITE_URL}/article/${post?.slug}`),
    [post?.slug]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <p className="text-muted-foreground mb-6">This story may have been moved or removed.</p>
          <Button asChild>
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const authorKey = (post.author || "Za Ndani").toLowerCase();
  const authorBio = AUTHOR_BIOS[authorKey] || "Za Ndani journalist covering the stories that matter in Kenya.";
  const authorColor = AUTHOR_COLORS[authorKey] || "bg-zinc-600";
  const authorInitials = (post.author || "ZN")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const postOgImage = ogImg(post.image);
  const canonicalUrl = `${SITE_URL}/article/${post.slug}`;
  const metaDescription = (post.excerpt || "").slice(0, 157);
  const dateObj = new Date(post.date);
  const formattedDate = isNaN(dateObj.getTime())
    ? post.date
    : `${dateObj.toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })} at ${dateObj.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true })}`;

  const articleHtml = post.htmlContent || "";

  return (
    <Layout>
      <Helmet>
        <title>{post.title} | Zandani</title>
        <meta name="description" content={metaDescription} />
        <meta name="author" content={post.author} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={postOgImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={postOgImage} />
      </Helmet>

      <div ref={progressRef} className="fixed top-0 left-0 h-0.5 bg-primary z-50 transition-[width] duration-100" style={{ width: 0 }} />

      <div className="container max-w-6xl mx-auto px-4 pt-6 pb-24 lg:pb-12">
        <ArticleBreadcrumbs category={post.category} title={post.title} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <article className="lg:col-span-9 min-w-0">
            <Badge className={`${catColor(post.category)} text-white border-0 mb-3`}>{post.category}</Badge>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.5rem] leading-tight font-bold text-foreground mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-6">
              <Link
                to={`/author/${(post.author || "za-ndani").toLowerCase().replace(/\s+/g, "-")}`}
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black ${authorColor}`}>
                  {authorInitials}
                </span>
                <span className="font-medium text-foreground">{post.author}</span>
              </Link>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              {post.readTime ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTime} min read
                </span>
              ) : null}
            </div>

            {post.image ? (
              <figure className="mb-8 -mx-4 sm:mx-0 overflow-hidden rounded-none sm:rounded-lg">
                <img
                  src={proxyImg(post.image, 1200)}
                  alt={post.imageAlt || post.title}
                  className="w-full max-h-[28rem] object-cover"
                  fetchPriority="high"
                />
              </figure>
            ) : null}

            <div className="flex items-center gap-2 mb-8 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">Share</span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600/15 text-emerald-600"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted"
                aria-label="X"
              >
                <XIcon className="w-4 h-4" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600/15 text-blue-600"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/15 text-primary"
                aria-label="Copy link"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {copied ? <span className="text-xs text-muted-foreground">Copied</span> : null}
            </div>

            <div
              className="prose prose-lg dark:prose-invert measure max-w-[65ch] mx-auto prose-headings:font-serif prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />

            <div className="my-10 flex justify-center border-y border-divider py-4">
              <AdUnit type="horizontal" />
            </div>

            <div className="border border-divider rounded-lg p-5 mt-10">
              <div className="flex gap-4 items-start">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0 ${authorColor}`}>
                  {authorInitials}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    <Link
                      to={`/author/${(post.author || "za-ndani").toLowerCase().replace(/\s+/g, "-")}`}
                      className="hover:text-primary"
                    >
                      {post.author}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{authorBio}</p>
                </div>
              </div>
            </div>

            {relatedPosts.length > 0 ? (
              <section className="mt-12">
                <h2 className="text-lg font-bold mb-4">Related stories</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {relatedPosts.map((rp) => (
                    <Link key={rp.slug} to={`/article/${rp.slug}`} className="group block border border-divider overflow-hidden hover:border-primary/40 transition-colors">
                      <div className="aspect-[16/10] overflow-hidden bg-muted">
                        <img src={proxyImg(rp.image, 400)} alt={rp.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary">{rp.title}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-10">
              <NewsletterForm />
            </div>
          </article>

          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28 space-y-8">
              <div className="border border-divider bg-muted/10 p-3 flex justify-center">
                <AdUnit type="effectivegate" />
              </div>
              <LiveUpdatesTimeline variant="compact" maxItems={8} title="Live Updates" />
            </div>
          </aside>
        </div>
      </div>

      {showScrollTop ? (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-5 lg:bottom-6 lg:right-6 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-xl z-40"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      ) : null}

      <StickyMobileShare title={post.title} url={shareUrl} />
    </Layout>
  );
}
