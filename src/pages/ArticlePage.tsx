import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getPostBySlug, getLatestPosts } from "@/lib/markdown";
import { Clock, Calendar, Share2, Facebook, Twitter, Linkedin, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const post = getPostBySlug(slug || "");
  const relatedPosts = getLatestPosts(3).filter(p => p.slug !== slug);

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

  // Article structured data for SEO
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image,
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": post.author
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
    }
  };

  return (
    <Layout>
      {/* SEO Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* Breadcrumb */}
      <nav className="bg-surface border-b border-divider py-3" aria-label="Breadcrumb">
        <div className="container">
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

      <article className="py-8 md:py-12">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Header */}
              <header className="mb-8">
                <Badge className="mb-4 gradient-primary text-primary-foreground border-0">
                  {post.category}
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-headline leading-tight mb-6">
                  {post.title}
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  {post.excerpt}
                </p>

                {/* Author & Meta */}
                <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-divider">
                  <div className="flex items-center gap-3">
                    {post.authorImage && (
                      <img src={post.authorImage} alt={post.author} className="w-12 h-12 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-headline">{post.author}</p>
                      <p className="text-sm text-muted-foreground">Staff Writer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime} min read
                    </span>
                  </div>
                </div>
              </header>

              {/* Featured Image */}
              <figure className="mb-8">
                <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
                  <img
                    src={post.image}
                    alt={post.imageAlt}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                <figcaption className="mt-2 text-sm text-muted-foreground text-center">
                  {post.imageAlt}
                </figcaption>
              </figure>

              {/* Share Bar */}
              <div className="flex items-center justify-between py-4 mb-8 border-y border-divider">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground mr-2">Share:</span>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary" aria-label="Share on Facebook">
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary" aria-label="Share on Twitter">
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary" aria-label="Share on LinkedIn">
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary" aria-label="Copy link">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>

              {/* Article Content - Rendered from Markdown */}
              <div 
                className="prose-article prose prose-lg max-w-none dark:prose-invert prose-headings:font-serif prose-headings:text-headline prose-a:text-primary prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: post.htmlContent }}
              />

              {/* Tags */}
              <div className="mt-8 pt-8 border-t border-divider">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Tags:</span>
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Author Box */}
              <div className="mt-8 p-6 bg-surface rounded-2xl">
                <div className="flex items-start gap-4">
                  {post.authorImage && (
                    <img src={post.authorImage} alt={post.author} className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <div>
                    <h4 className="font-serif font-bold text-headline mb-1">{post.author}</h4>
                    <p className="text-sm text-primary mb-2">Staff Writer</p>
                    <p className="text-muted-foreground text-sm">
                      Passionate journalist covering entertainment, lifestyle, and breaking news across Kenya and East Africa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Related Articles */}
              <section className="mt-12">
                <h3 className="text-2xl font-serif font-bold text-headline mb-6 flex items-center gap-3">
                  <span className="w-1 h-6 gradient-primary rounded-full" />
                  Related Stories
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {relatedPosts.slice(0, 2).map((relatedPost) => (
                    <ArticleCard key={relatedPost.slug} post={relatedPost} />
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              <div className="sticky top-24">
                <TrendingSidebar />

                {/* Ad Placeholder */}
                <div className="mt-6 bg-surface rounded-2xl p-6 text-center border border-divider">
                  <p className="text-xs text-muted-foreground mb-2">ADVERTISEMENT</p>
                  <div className="aspect-[4/5] bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">Ad Space</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </Layout>
  );
}
