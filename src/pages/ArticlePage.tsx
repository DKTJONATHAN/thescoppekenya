import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getPostBySlug, getLatestPosts } from "@/lib/markdown";
import { Clock, Calendar, Share2, Facebook, Linkedin, ChevronLeft, ArrowUp, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { XIcon } from "@/components/XIcon";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Helmet } from "react-helmet-async";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const post = useMemo(() => getPostBySlug(slug || ""), [slug]);
  const latestPosts = useMemo(() => getLatestPosts(6), []);
  const relatedPosts = useMemo(
    () => latestPosts.filter((p) => p.slug !== slug).slice(0, 4),
    [latestPosts, slug]
  );

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/get-views');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setViewCounts(data);
      } catch (e) {
        console.error("View fetch failed");
      }
    };
    fetchViews();
  }, []);

  const currentPostViews = useMemo(() => {
    if (!post) return 0;
    const cleanSlug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
    const exactPath = `/article/${cleanSlug}`;
    const pathWithSlash = `/article/${cleanSlug}/`;
    const fallbackPath = `/posts/${cleanSlug}`; 

    const gaViews = viewCounts[exactPath] || 
                    viewCounts[pathWithSlash] || 
                    viewCounts[fallbackPath] || 
                    0;

    return gaViews > 0 ? gaViews : 47;
  }, [post, viewCounts]);

  const relatedPostsWithViews = useMemo(() => {
    return relatedPosts.map(p => {
      const cleanSlug = p.slug.replace(/^\//, '').replace(/\.md$/, '');
      const exactPath = `/article/${cleanSlug}`;
      const pathWithSlash = `/article/${cleanSlug}/`;
      const fallbackPath = `/posts/${cleanSlug}`; 

      const gaViews = viewCounts[exactPath] || 
                      viewCounts[pathWithSlash] || 
                      viewCounts[fallbackPath] || 
                      0;

      return {
        ...p,
        views: gaViews > 0 ? gaViews : 47
      };
    });
  }, [relatedPosts, viewCounts]);

  useEffect(() => {
    if (post?.image) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = post.image;
      link.setAttribute("fetchpriority", "high");
      document.head.appendChild(link);
      return () => document.head.removeChild(link);
    }
  }, [post?.image]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 400);

          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = docHeight > 0 
            ? Math.min(Math.max((scrollTop / docHeight) * 100, 0), 100) 
            : 0;

          setProgress(scrollPercent);

          if (progressRef.current) {
            progressRef.current.style.width = `${scrollPercent}%`;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const shareUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.href : `https://zandani.co.ke/article/${post?.slug}`),
    [post?.slug]
  );

  const handleWhatsAppShare = () => {
    const text = `${post?.title} - Read on Za Ndani`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`, "_blank");
  };

  if (!post) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist.</p>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const formattedDate = useMemo(
    () =>
      new Date(post.date).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [post.date]
  );

  const articleSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": post.title,
      "description": post.excerpt,
      "image": {
        "@type": "ImageObject",
        "url": post.image,
        "width": 1200,
        "height": 630,
        "caption": post.imageAlt || post.title
      },
      "datePublished": post.date,
      "dateModified": post.date,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "Za Ndani",
        "logo": {
          "@type": "ImageObject",
          "url": "https://zandani.co.ke/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://zandani.co.ke/article/${post.slug}`
      },
      "keywords": post.tags.join(", "),
      "articleSection": post.category,
      "inLanguage": "en-KE",
      "wordCount": Math.round((post.htmlContent?.length || 0) / 5),
      "articleBody": post.excerpt,
      "isAccessibleForFree": true
    }),
    [post]
  );

  const breadcrumbSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zandani.co.ke" },
        {
          "@type": "ListItem",
          "position": 2,
          "name": post.category,
          "item": `https://zandani.co.ke/category/${post.category.toLowerCase()}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": post.title,
          "item": `https://zandani.co.ke/article/${post.slug}`
        }
      ]
    }),
    [post]
  );

  return (
    <Layout>
      <Helmet>
        <title>{post.title} | Za Ndani - Kenya News & Gossip</title>
        <meta name="description" content={post.excerpt.slice(0, 158) + (post.excerpt.length > 158 ? "..." : "")} />
        <meta name="keywords" content={post.tags.join(", ") + ", za ndani, kenya news"} />
        <link rel="canonical" href={`https://zandani.co.ke/article/${post.slug}`} />

        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://zandani.co.ke/article/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:section" content={post.category} />
        <meta property="article:author" content={post.author} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.image} />
      </Helmet>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Reading Progress Bar */}
      <div 
        ref={progressRef}
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50" 
        style={{ width: "0%" }}
      />

      {/* Back Navigation */}
      <div className="bg-muted/50 border-b border-border">
        <div className="container max-w-4xl py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      <article className="py-8 md:py-12">
        <div className="container max-w-4xl">
          {/* Immersive Header */}
          <header className="mb-10">
            <Link to={`/category/${post.category.toLowerCase()}`}>
              <Badge className="mb-6 gradient-primary text-primary-foreground border-0 hover:opacity-90 text-sm px-5 py-1.5">
                {post.category}
              </Badge>
            </Link>

            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-6">
              {post.title}
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{post.author}</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime} min read
              </span>
              <span className="flex items-center gap-1.5 text-primary font-medium">
                <Eye className="w-4 h-4" />
                {currentPostViews > 999 ? `${(currentPostViews / 1000).toFixed(1)}k` : currentPostViews} views
              </span>
            </div>
          </header>

          {/* Featured Image */}
          <figure className="mb-12 relative">
            <div className="aspect-video rounded-3xl overflow-hidden bg-muted shadow-xl">
              <img
                src={post.image}
                alt={post.imageAlt || post.title}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            </div>
            {post.imageAlt && (
              <figcaption className="mt-3 text-sm text-muted-foreground text-center">
                {post.imageAlt}
              </figcaption>
            )}
          </figure>

          {/* Sticky Share on Desktop */}
          <div className="hidden lg:flex fixed left-[calc(50%-42rem)] top-48 flex-col gap-3 z-30">
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")}>
              <Facebook className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" onClick={() => window.open(`https://x.com/intent/tweet?url=\( {encodeURIComponent(shareUrl)}&text= \){encodeURIComponent(post.title)}`, "_blank")}>
              <XIcon className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}`, "_blank")}>
              <Linkedin className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" onClick={handleWhatsAppShare}>
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" onClick={() => navigator.clipboard.writeText(shareUrl)}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Main Content */}
          <div
            ref={contentRef}
            className="prose prose-lg max-w-none dark:prose-invert 
              prose-headings:font-serif prose-headings:text-foreground 
              prose-p:text-foreground prose-p:leading-[1.85] prose-p:mb-8
              prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline 
              prose-strong:text-foreground prose-strong:font-bold
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:text-muted-foreground prose-blockquote:pl-8 prose-blockquote:italic
              prose-img:rounded-3xl prose-img:my-12 prose-img:shadow-lg
              prose-li:mb-3 prose-li:leading-8
              prose-ul:mb-8 prose-ol:mb-8 first-letter:text-7xl first-letter:font-serif first-letter:font-bold first-letter:text-primary first-letter:mr-3 first-letter:float-left"
            dangerouslySetInnerHTML={{ __html: post.htmlContent }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                {post.tags.map((tag) => (
                  <Link key={tag} to={`/tag/${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio */}
          <div className="mt-16 p-8 bg-muted/50 rounded-3xl border border-divider flex gap-6 items-start">
            <div className="w-20 h-20 bg-muted-foreground/10 rounded-2xl flex-shrink-0" />
            <div>
              <div className="font-medium text-lg mb-1">{post.author}</div>
              <p className="text-sm text-muted-foreground mb-4">Senior Gossip Correspondent at Za Ndani. Always first with the tea.</p>
              <Link to={`/author/${post.author.toLowerCase().replace(/\s+/g, '-')}`} className="text-primary font-medium hover:underline text-sm">
                More stories by {post.author.split(" ")[0]}
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-12 p-8 md:p-10 bg-surface rounded-3xl">
            <h3 className="font-serif font-bold text-2xl text-foreground mb-3">Never miss the tea</h3>
            <p className="text-muted-foreground mb-6">Fresh Kenyan gossip straight to your inbox every morning.</p>
            <NewsletterForm />
          </div>

          {/* Related Stories */}
          {relatedPostsWithViews.length > 0 && (
            <section className="mt-16 pt-10 border-t border-border">
              <h3 className="text-2xl font-serif font-bold mb-8 flex items-center gap-3">
                More Hot Stories 
                <span className="text-primary">→</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                {relatedPostsWithViews.map((relatedPost) => (
                  <div key={relatedPost.slug} className="relative group">
                    <ArticleCard post={relatedPost} variant="compact" />
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-black/70 backdrop-blur-md text-white border-0 flex items-center gap-1.5 px-3 py-1 shadow-lg">
                        <Eye className="w-3.5 h-3.5" />
                        {relatedPost.views > 999 ? `${(relatedPost.views / 1000).toFixed(1)}k` : relatedPost.views}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      {/* Mobile Floating Share Bar */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-3 bg-background/95 backdrop-blur-lg border border-divider rounded-3xl p-3 shadow-2xl">
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")}>
          <Facebook className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl" onClick={() => window.open(`https://x.com/intent/tweet?url=\( {encodeURIComponent(shareUrl)}&text= \){encodeURIComponent(post.title)}`, "_blank")}>
          <XIcon className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl" onClick={handleWhatsAppShare}>
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl" onClick={() => navigator.clipboard.writeText(shareUrl)}>
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 lg:bottom-6 p-3 rounded-full bg-primary text-primary-foreground shadow-xl hover:opacity-90 transition-opacity z-40"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </Layout>
  );
}