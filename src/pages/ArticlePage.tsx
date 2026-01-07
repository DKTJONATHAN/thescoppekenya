import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getPostBySlug, getLatestPosts } from "@/lib/markdown";
import { Clock, Calendar, Share2, Facebook, Linkedin, Instagram, Bookmark, MessageCircle, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import { XIcon } from "@/components/XIcon";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const post = getPostBySlug(slug || "");
  const relatedPosts = getLatestPosts(4).filter(p => p.slug !== slug);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("trending");
  const articleRef = useRef<HTMLDivElement>(null);

  // Reading Progress Bar
  useEffect(() => {
    const updateProgress = () => {
      if (!articleRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  if (!post) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-headline mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const formattedDate = new Date(post.date).toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Enhanced Article structured data for Google News
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "alternativeHeadline": post.excerpt,
    "description": post.excerpt,
    "image": {
      "@type": "ImageObject",
      "url": post.image,
      "width": 1200,
      "height": 675
    },
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": post.author,
      "url": `https://thescoopkenya.co.ke/author/${post.author.toLowerCase().replace(/ /g, '-')}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "The Scoop Kenya",
      "logo": {
        "@type": "ImageObject",
        "url": "https://thescoopkenya.co.ke/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://thescoopkenya.co.ke/article/${post.slug}`
    },
    "articleSection": post.category,
    "keywords": post.tags.join(', '),
    "wordCount": post.readTime * 200,
    "inLanguage": "en-KE"
  };

  return (
    <Layout>
      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary to-secondary z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Preload hero image */}
      <link rel="preload" as="image" href={post.image} />

      {/* Enhanced SEO Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* Breadcrumb */}
      <nav className="bg-surface border-b border-divider py-3" aria-label="Breadcrumb">
        <div className="container max-w-7xl mx-auto px-4">
          <ol className="flex items-center gap-2 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/" className="text-muted-foreground hover:text-primary" itemProp="item">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <span className="text-muted-foreground">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to={`/category/${post.category.toLowerCase()}`} className="text-muted-foreground hover:text-primary" itemProp="item">
                <span itemProp="name">{post.category}</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <span className="text-muted-foreground">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="text-foreground truncate max-w-[200px]">
              <span itemProp="name">{post.title}</span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </div>
      </nav>

      <article className="py-8 md:py-12" ref={articleRef}>
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Header */}
              <header className="mb-8">
                <Badge className="mb-4 gradient-primary text-primary-foreground border-0">
                  {post.category}
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-headline leading-tight mb-6">
                  {post.title}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-6 leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Author & Meta */}
                <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-divider">
                  <div className="flex items-center gap-3">
                    {post.authorImage && (
                      <img src={post.authorImage} alt={post.author} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20" loading="lazy" />
                    )}
                    <div>
                      <p className="font-semibold text-headline">{post.author}</p>
                      <p className="text-sm text-muted-foreground">Staff Writer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {post.readTime} min read
                    </span>
                  </div>
                </div>
              </header>

              {/* Featured Image with WebP support */}
              <figure className="mb-8">
                <div className="aspect-video rounded-2xl overflow-hidden bg-muted shadow-lg">
                  <picture>
                    <source srcSet={post.image.replace(/.(jpg|jpeg|png)$/, '.webp')} type="image/webp" />
                    <img
                      src={post.image}
                      alt={post.imageAlt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="eager"
                      width="1200"
                      height="675"
                    />
                  </picture>
                </div>
                <figcaption className="mt-3 text-sm text-muted-foreground text-center">
                  {post.imageAlt}
                </figcaption>
              </figure>

              {/* Share Bar - Sticky */}
              <div className="flex items-center justify-between py-4 mb-8 border-y border-divider sticky top-20 bg-surface/95 backdrop-blur-sm z-10 rounded-lg px-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground mr-2">Share:</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-primary/10 hover:text-primary" 
                    aria-label="Share on Facebook"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  >
                    <Facebook className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-primary/10 hover:text-primary" 
                    aria-label="Share on X"
                    onClick={() => window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')}
                  >
                    <XIcon className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-primary/10 hover:text-primary" 
                    aria-label="Share on LinkedIn"
                    onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(post.title)}`, '_blank')}
                  >
                    <Linkedin className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-primary/10 hover:text-primary" 
                    aria-label="Share on Instagram"
                    onClick={() => navigator.share ? navigator.share({ title: post.title, url: window.location.href }) : null}
                  >
                    <Instagram className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-primary/10 hover:text-primary" 
                    aria-label="Copy link"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>


              {/* Article Content - Rendered from Markdown */}
              <div 
                className="prose prose-xl max-w-none dark:prose-invert prose-headings:font-serif prose-headings:text-headline prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-blockquote:border-l-primary prose-img:rounded-xl prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: post.htmlContent }}
              />

              {/* Newsletter Signup */}
              <div className="my-12 p-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20">
                <div className="text-center mb-6">
                  <h3 className="font-serif font-bold text-3xl text-headline mb-3">Never Miss the Tea</h3>
                  <p className="text-muted-foreground text-lg">Get the hottest gossip and entertainment news delivered to your inbox daily.</p>
                </div>
                <form className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 px-6 py-4 rounded-xl border border-divider bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <Button type="submit" className="gradient-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-bold whitespace-nowrap">
                    Subscribe Free
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-4">No spam. Unsubscribe anytime.</p>
              </div>

              {/* Tags */}
              <div className="mt-8 pt-8 border-t border-divider">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Tags:</span>
                  {post.tags.map((tag) => (
                    <Link key={tag} to={`/tag/${tag.toLowerCase().replace(/ /g, '-')}`}>
                      <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Author Box */}
              <div className="mt-8 p-6 bg-surface rounded-2xl border border-divider">
                <div className="flex items-start gap-4">
                  {post.authorImage && (
                    <img src={post.authorImage} alt={post.author} className="w-20 h-20 rounded-full object-cover" loading="lazy" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-serif font-bold text-xl text-headline mb-1">{post.author}</h4>
                    <p className="text-sm text-primary mb-3">Staff Writer</p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      Passionate journalist covering entertainment, lifestyle, and breaking news across Kenya and East Africa.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="hover:bg-primary/10">
                        <Twitter className="w-4 h-4 mr-1" />
                        Follow
                      </Button>
                      <Button variant="outline" size="sm" className="hover:bg-primary/10">
                        <Instagram className="w-4 h-4 mr-1" />
                        Follow
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-12 pt-12 border-t border-divider">
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-headline mb-6 flex items-center gap-3">
                  <MessageCircle className="w-7 h-7 text-primary" />
                  Join the Conversation
                </h3>
                
                {/* Disqus Integration */}
                <div id="disqus_thread" className="min-h-[400px]">
                  <noscript>Please enable JavaScript to view comments.</noscript>
                </div>
                
                {/* Alternative: Simple comment form placeholder */}
                <div className="space-y-4">
                  <textarea 
                    placeholder="Share your thoughts..." 
                    className="w-full px-6 py-4 rounded-xl border border-divider bg-surface focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                  />
                  <Button className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl">
                    Post Comment
                  </Button>
                </div>
              </div>

              {/* Related Articles */}
              <section className="mt-12 pt-12 border-t border-divider">
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-headline mb-6 flex items-center gap-3">
                  <span className="w-1 h-8 gradient-primary rounded-full" />
                  Related Stories
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {relatedPosts.slice(0, 2).map((relatedPost) => (
                    <ArticleCard key={relatedPost.slug} post={relatedPost} />
                  ))}
                </div>
              </section>
            </div>

            {/* Enhanced Sidebar with Tabs */}
            <aside className="lg:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6">
                {/* Tabbed Content */}
                <div className="bg-surface rounded-2xl border border-divider overflow-hidden">
                  <div className="flex border-b border-divider">
                    <button
                      onClick={() => setActiveTab("trending")}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                        activeTab === "trending" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-surface text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Trending
                    </button>
                    <button
                      onClick={() => setActiveTab("latest")}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                        activeTab === "latest" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-surface text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Zap className="w-4 h-4 inline mr-1" />
                      Latest
                    </button>
                  </div>
                  <div className="p-4">
                    {activeTab === "trending" ? <TrendingSidebar /> : <TrendingSidebar />}
                  </div>
                </div>


                {/* Ad Placeholder */}
                <div className="bg-surface rounded-2xl p-6 text-center border border-divider">
                  <p className="text-xs text-muted-foreground mb-2">ADVERTISEMENT</p>
                  <div className="aspect-[4/5] bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">Ad Space</span>
                  </div>
                </div>

                {/* Social Follow */}
                <div className="bg-surface rounded-2xl p-6 border border-divider">
                  <h4 className="font-serif font-bold text-lg text-headline mb-4">Follow The Scoop</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="h-12 hover:bg-primary/10">
                      <Facebook className="w-5 h-5 mr-2" />
                      Facebook
                    </Button>
                    <Button variant="outline" size="sm" className="h-12 hover:bg-primary/10">
                      <Twitter className="w-5 h-5 mr-2" />
                      Twitter
                    </Button>
                    <Button variant="outline" size="sm" className="h-12 hover:bg-primary/10">
                      <Instagram className="w-5 h-5 mr-2" />
                      Instagram
                    </Button>
                    <Button variant="outline" size="sm" className="h-12 hover:bg-primary/10">
                      <Zap className="w-5 h-5 mr-2" />
                      TikTok
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Disqus Configuration */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            var disqus_config = function () {
              this.page.url = window.location.href;
              this.page.identifier = '${post.slug}';
            };
            (function() {
              var d = document, s = d.createElement('script');
              s.src = 'https://thescoopkenya.disqus.com/embed.js';
              s.setAttribute('data-timestamp', +new Date());
              (d.head || d.body).appendChild(s);
            })();
          `,
        }}
      />
    </Layout>
  );
}