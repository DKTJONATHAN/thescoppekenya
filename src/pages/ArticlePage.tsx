import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { GossipQuickBites } from "@/components/articles/GossipQuickBites";
import { getPostBySlug, getLatestPosts, getRelatedPostsByTags } from "@/lib/markdown";
import { Clock, Calendar, Share2, Facebook, Twitter, Instagram, Tiktok, Youtube, Bookmark, MessageCircle, ThumbsUp, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const post = getPostBySlug(slug || "");
  const relatedPosts = getRelatedPostsByTags(post?.tags || [], 4).filter(p => p.slug !== slug) || getLatestPosts(4).filter(p => p.slug !== slug);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Simulate views increment
    const interval = setInterval(() => setViews(v => v + Math.floor(Math.random() * 10)), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(l => isLiked ? l - 1 : l + 1);
  };

  if (!post) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-headline mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Article Not Found</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">The juicy gossip you're craving doesn't exist or has been swept under the rug.</p>
          <Button asChild className="gradient-primary text-primary-foreground text-lg px-8 py-6 rounded-xl">
            <Link to="/">Back to Latest Scoop</Link>
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

  // Enhanced Article structured data for NewsArticle + VideoObject if applicable
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "alternativeHeadline": post.excerpt,
    "description": post.excerpt,
    "image": [post.image, post.authorImage],
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": post.author,
      "image": post.authorImage
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
    "wordCount": post.readTime * 200
  };

  return (
    <Layout>
      {/* Enhanced SEO Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* Hero Breadcrumb */}
      <nav className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm border-b border-divider/50 py-4" aria-label="Breadcrumb">
        <div className="container">
          <ol className="flex items-center gap-3 text-sm font-medium">
            <li>
              <Link to="/" className="text-primary hover:text-primary/80 flex items-center gap-1">
                <Zap className="w-4 h-4" />
                Home
              </Link>
            </li>
            <span className="text-muted-foreground">/</span>
            <li>
              <Link to={`/category/${post.category.toLowerCase().replace(/ /g, '-')}`} className="text-foreground hover:text-primary flex items-center gap-1">
                {post.category}
              </Link>
            </li>
            <span className="text-muted-foreground">/</span>
            <li className="text-muted-foreground truncate max-w-[250px]">
              {post.title}
            </li>
          </ol>
        </div>
      </nav>

      <article className="py-12 lg:py-20">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12 lg:space-y-16">
              {/* Explosive Header */}
              <header className="space-y-6">
                <Badge className="text-base px-4 py-2 gradient-gossip text-primary-foreground border-0 shadow-lg">
                  {post.category} Scoop
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-black text-headline leading-tight bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent">
                  {post.title}
                </h1>
                <p className="text-2xl md:text-3xl text-muted-foreground leading-relaxed italic font-light">
                  {post.excerpt}
                </p>

                {/* Gossip Meta with Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-8 border-b border-divider bg-surface/50 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    {post.authorImage && (
                      <div className="relative">
                        <img src={post.authorImage} alt={post.author} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover ring-4 ring-primary/20 shadow-xl" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-gossip rounded-full flex items-center justify-center">
                          <Zap className="w-3 h-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-xl text-headline">{post.author}</p>
                      <p className="text-lg text-primary font-semibold">Chief Gossip Correspondent</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-base text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {post.readTime} min read
                    </span>
                    <span className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      {views.toLocaleString()} views
                    </span>
                  </div>
                </div>
              </header>

              {/* Immersive Hero Image */}
              <figure className="relative mb-12 lg:mb-16">
                <div className="aspect-[16/9] lg:aspect-[3/2] rounded-3xl overflow-hidden bg-gradient-to-br from-black/20 to-transparent shadow-2xl">
                  <img
                    src={post.image}
                    alt={post.imageAlt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 group-hover:scale-110"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <figcaption className="mt-4 text-lg font-medium text-muted-foreground text-center">
                  {post.imageAlt} • Photo Credit: {post.photoCredit || 'The Scoop Kenya'}
                </figcaption>
              </figure>

              {/* Viral Share Bar - Sticky */}
              <div className="sticky top-24 z-20 bg-surface/95 backdrop-blur-xl border border-divider/50 rounded-2xl p-4 mb-12 shadow-2xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-foreground">Spread the Tea:</span>
                    <Button variant="ghost" size="icon" className="hover:bg-pink-500/20 hover:text-pink-500 h-12 w-12 rounded-xl" aria-label="Share on Facebook">
                      <Facebook className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-blue-500/20 hover:text-blue-500 h-12 w-12 rounded-xl" aria-label="Share on Twitter">
                      <Twitter className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-gradient-gossip hover:text-primary-foreground h-12 w-12 rounded-xl" aria-label="Share on Instagram">
                      <Instagram className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-500/20 hover:text-red-500 h-12 w-12 rounded-xl" aria-label="Share on TikTok">
                      <Tiktok className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-600/20 hover:text-red-600 h-12 w-12 rounded-xl" aria-label="Share on YouTube">
                      <Youtube className="w-6 h-6" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleLike} className={`hover:bg-gradient-gossip ${isLiked ? 'bg-gradient-gossip text-primary-foreground shadow-lg' : 'hover:text-primary'}`}>
                      <ThumbsUp className="w-5 h-5" />
                    </Button>
                    <span className="font-bold text-lg">{likes.toLocaleString()}</span>
                    <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
                      <MessageCircle className="w-4 h-4" />
                      Discuss
                    </Button>
                  </div>
                </div>
              </div>

              {/* Enhanced Prose with Gossip Style */}
              <div 
                className="prose prose-2xl max-w-none dark:prose-invert prose-headings:font-serif prose-headings:text-4xl md:prose-headings:text-5xl prose-headings:font-black prose-headings:bg-gradient-to-r prose-headings:from-gray-900 prose-headings:to-black prose-headings:bg-clip-text prose-headings:text-transparent prose-lead:text-2xl prose-a:no-underline prose-a:text-primary hover:prose-a:underline prose-strong:font-bold prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:not-italic prose-img:rounded-2xl prose-img:shadow-xl prose-video:rounded-3xl"
                dangerouslySetInnerHTML={{ __html: post.htmlContent }}
              />

              {/* Hot Tags */}
              {post.tags.length > 0 && (
                <div className="pt-12 border-t border-divider">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl font-bold text-foreground">Hot Tags:</span>
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="default" className="gradient-gossip text-primary-foreground text-base px-4 py-2 hover:scale-105 transition-all shadow-md">
                        <Link to={`/tag/${tag.toLowerCase().replace(/ /g, '-')}`}>#{tag}</Link>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded Author Profile */}
              <div className="p-8 lg:p-12 bg-gradient-to-br from-surface to-muted rounded-3xl shadow-2xl border border-divider/30">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                  {post.authorImage && (
                    <div className="relative flex-shrink-0">
                      <img src={post.authorImage} alt={post.author} className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl object-cover shadow-2xl ring-8 ring-primary/10" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-3xl lg:text-4xl font-serif font-black text-headline mb-3">{post.author}</h3>
                    <Badge className="text-xl px-6 py-3 gradient-gossip text-primary-foreground mb-4">Senior Entertainment Insider</Badge>
                    <p className="text-xl leading-relaxed text-muted-foreground mb-6">
                      Kenya's leading voice on celebrity scandals, red carpet drama, and exclusive East African entertainment scoops. Follow for the tea no one else spills.
                    </p>
                    <div className="flex gap-3">
                      <Button className="gradient-primary text-primary-foreground px-8 py-6 rounded-2xl text-lg font-bold">
                        Follow on X
                      </Button>
                      <Button variant="outline" className="border-divider/50 px-8 py-6 rounded-2xl text-lg">
                        View All Articles
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Bites Section */}
              <section className="space-y-8">
                <h3 className="text-3xl lg:text-4xl font-serif font-black text-headline flex items-center gap-4">
                  <Zap className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
                  Quick Bites You Can't Miss
                </h3>
                <GossipQuickBites />
              </section>

              {/* Must-Read Related Stories */}
              {relatedPosts.length > 0 && (
                <section className="pt-16 border-t border-divider">
                  <h3 className="text-3xl lg:text-4xl font-serif font-black text-headline mb-10 flex items-center gap-4">
                    <span className="w-2 h-10 gradient-gossip rounded-full shadow-lg" />
                    More Tea: Related Stories
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
                    {relatedPosts.map((relatedPost) => (
                      <ArticleCard key={relatedPost.slug} post={relatedPost} variant="gossip" />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Enhanced Sticky Gossip Sidebar */}
            <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-32 self-start">
              <div className="space-y-6">
                <TrendingSidebar gossipMode />

                {/* Breaking News Ticker */}
                <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/30 rounded-3xl p-6">
                  <h4 className="font-serif font-bold text-xl text-rose-600 mb-4 flex items-center gap-2">
                    🚨 Breaking Now
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">Crazy Kennar church drama unfolds in Kisumu!</p>
                    <p className="text-sm font-semibold text-foreground line-clamp-2">Babu Owino vs Robert Alai: The showdown escalates</p>
                  </div>
                </div>

                {/* Premium Ad Space */}
                <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-3xl p-8 text-center border-4 border-dashed border-orange-300/50 shadow-xl hover:shadow-2xl transition-all">
                  <p className="text-xs uppercase tracking-wider text-orange-600 font-bold mb-3">🔥 SPONSOR</p>
                  <div className="aspect-[4/5] bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-2xl font-black text-orange-600 drop-shadow-lg">Ad Space</span>
                  </div>
                  <Button className="w-full gradient-orange text-orange-foreground font-bold py-4 rounded-xl text-base shadow-xl hover:shadow-2xl">
                    Advertise Here
                  </Button>
                </div>

                {/* Social Proof Widget */}
                <div className="bg-surface rounded-2xl p-6 border border-divider/50">
                  <h5 className="font-bold text-lg mb-4">Join 500K+ Gossip Lovers</h5>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <Button variant="outline" className="w-full rounded-xl h-14">
                      <Instagram className="w-6 h-6 mr-2" />
                      Follow IG
                    </Button>
                    <Button variant="outline" className="w-full rounded-xl h-14">
                      <Tiktok className="w-6 h-6 mr-2" />
                      TikTok Tea
                    </Button>
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