import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getPostBySlug, getLatestPosts } from "@/lib/markdown";
import { Clock, Calendar, Share2, Facebook, Linkedin, ChevronLeft, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo, useCallback } from "react";
import { XIcon } from "@/components/XIcon";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Helmet } from "react-helmet-async";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────────
  // MEMOIZED DATA – no more re-parsing markdown on every render
  // ──────────────────────────────────────────────────────────────
  const post = useMemo(() => getPostBySlug(slug || ""), [slug]);
  const latestPosts = useMemo(() => getLatestPosts(5), []); // fetch extra for filter buffer
  const relatedPosts = useMemo(
    () => latestPosts.filter((p) => p.slug !== slug).slice(0, 3),
    [latestPosts, slug]
  );

  const [showScrollTop, setShowScrollTop] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // Preload featured image for maximum LCP (Critical for Core Web Vitals)
  // ──────────────────────────────────────────────────────────────
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

  // Scroll to top on article change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  // Throttled scroll with RAF – zero jank
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 400);
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

  const shareUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.href : `https://zandani.co.ke/article/${post.slug}`),
    [post.slug]
  );

  // ──────────────────────────────────────────────────────────────
  // RICH SEO SCHEMA (Article + BreadcrumbList)
  // ──────────────────────────────────────────────────────────────
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
      },
      "datePublished": post.date,
      "author": { "@type": "Person", "name": post.author },
      "publisher": {
        "@type": "Organization",
        "name": "Za Ndani",
        "logo": {
          "@type": "ImageObject",
          "url": "https://zandani.co.ke/logo.png",
        },
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://zandani.co.ke/article/${post.slug}`,
      },
      "keywords": post.tags.join(", "),
      "articleSection": post.category,
      "inLanguage": "en-KE",
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
          "item": `https://zandani.co.ke/category/${post.category.toLowerCase()}`,
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": post.title,
          "item": `https://zandani.co.ke/article/${post.slug}`,
        },
      ],
    }),
    [post]
  );

  return (
    <Layout>
      <Helmet>
        <title>{post.title} | Za Ndani</title>
        <meta name="description" content={post.excerpt} />
        <meta name="keywords" content={post.tags.join(", ")} />
        <link rel="canonical" href={`https://zandani.co.ke/article/${post.slug}`} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://zandani.co.ke/article/${post.slug}`} />
        <meta property="og:title" content={`${post.title} | Za Ndani`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.image} />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:section" content={post.category} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.title} | Za Ndani`} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.image} />
      </Helmet>

      {/* SEO JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

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
          {/* Header */}
          <header className="mb-8">
            <Link to={`/category/${post.category.toLowerCase()}`}>
              <Badge className="mb-4 gradient-primary text-primary-foreground border-0 hover:opacity-90">
                {post.category}
              </Badge>
            </Link>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{post.author}</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime} min read
              </span>
            </div>
          </header>

          {/* Featured Image – optimized for LCP */}
          <figure className="mb-8">
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
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
              <figcaption className="mt-2 text-sm text-muted-foreground text-center">
                {post.imageAlt}
              </figcaption>
            )}
          </figure>

          {/* Share Buttons */}
          <div className="flex items-center gap-3 pb-6 mb-8 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground">Share:</span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() =>
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")
              }
            >
              <Facebook className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() =>
                window.open(
                  `https://x.com/intent/tweet?url=\( {encodeURIComponent(shareUrl)}&text= \){encodeURIComponent(post.title)}`,
                  "_blank"
                )
              }
            >
              <XIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() =>
                window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}`, "_blank")
              }
            >
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Article Content */}
          <div
            className="prose prose-lg max-w-none dark:prose-invert 
              prose-headings:font-serif prose-headings:text-foreground 
              prose-p:text-foreground prose-p:leading-[1.8] prose-p:mb-6
              prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline 
              prose-strong:text-foreground prose-strong:font-bold
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:pl-6
              prose-img:rounded-xl prose-img:my-8 prose-img:loading-lazy
              prose-li:mb-2 prose-li:leading-7
              prose-ul:mb-6 prose-ol:mb-6"
            dangerouslySetInnerHTML={{ __html: post.htmlContent }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                {post.tags.map((tag) => (
                  <Link key={tag} to={`/tag/${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter */}
          <div className="mt-12 p-6 md:p-8 bg-muted rounded-xl">
            <h3 className="font-serif font-bold text-xl text-foreground mb-2">Stay Updated</h3>
            <p className="text-muted-foreground mb-4">Get the latest insider news delivered to your inbox.</p>
            <NewsletterForm />
          </div>

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <h3 className="text-xl font-serif font-bold text-foreground mb-6">Related Stories</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <ArticleCard key={relatedPost.slug} post={relatedPost} variant="compact" />
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity z-40"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </Layout>
  );
}