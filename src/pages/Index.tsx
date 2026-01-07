import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { getFeaturedPosts, getLatestPosts, categories } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, TrendingUp, Zap, Flame, Clock, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const featuredPosts = getFeaturedPosts();
  const latestPosts = getLatestPosts(10); // Increased for better feed

  return (
    <Layout>
      {/* Enhanced SEO Schema for 2026 */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          "name": "The Scoop Kenya",
          "description": "Kenya's premier digital source for breaking news, celebrity gossip, and entertainment updates.",
          "url": "https://thescoopkenya.co.ke",
          "logo": "https://thescoopkenya.co.ke/logo.png",
          "sameAs": [
            "https://facebook.com/thescoopkenya",
            "https://twitter.com/thescoopkenya",
            "https://instagram.com/thescoopkenya"
          ],
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://thescoopkenya.co.ke/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })
      }} />

      {/* Breaking News Ticker - 2026 High-Engagement Element */}
      <div className="bg-headline text-primary-foreground py-2 overflow-hidden border-b border-divider">
        <div className="container max-w-7xl mx-auto px-4 flex items-center gap-4">
          <Badge variant="default" className="gradient-primary text-primary-foreground border-0 rounded-sm font-bold animate-pulse whitespace-nowrap">
            BREAKING NOW
          </Badge>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <p className="inline-block animate-marquee hover:pause cursor-pointer text-sm font-medium">
              • Babu Owino demands answers over latest Nairobi budget scandal 
              <span className="mx-8">•</span>
              • Azziad Nasenya shuts down dating rumors in viral TikTok live
              <span className="mx-8">•</span>
              • Kenyan Shilling hits new high against the Dollar this Wednesday
              <span className="mx-8">•</span>
              • Sauti Sol members reunite for exclusive private performance in Karen
            </p>
          </div>
        </div>
      </div>

      <CategoryBar />

      {/* Bento Grid Hero Section - 2026 Layout Standard */}
      <section className="py-6 md:py-10">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Main Feature Box */}
            <div className="lg:col-span-2 lg:row-span-2">
              {featuredPosts[0] && (
                <ArticleCard post={featuredPosts[0]} variant="featured" />
              )}
            </div>

            {/* Secondary Features Grid */}
            {featuredPosts.slice(1, 5).map((post, idx) => (
              <div key={post.slug} className={`${idx === 0 ? 'hidden md:block' : ''}`}>
                <ArticleCard post={post} variant="grid-sm" />
              </div>
            ))}
            
            {/* Hot Topics Bar - Quick Engagement */}
            <div className="lg:col-span-2 bg-surface border border-divider rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold text-headline whitespace-nowrap">
                <Flame className="w-5 h-5 text-primary" />
                Hot Topics:
              </div>
              <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
                {['#Politics', '#CelebrityGossip', '#GenZ', '#NairobiNightlife', '#Rugby7s'].map(tag => (
                  <Badge key={tag} variant="secondary" className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors whitespace-nowrap px-4 py-1.5 rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-10 bg-surface/50 border-y border-divider">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Latest Stories Feed */}
            <div className="lg:col-span-2 space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold text-headline flex items-center gap-3">
                  <span className="w-1.5 h-9 gradient-primary rounded-full shadow-sm" />
                  Latest Scoops
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="rounded-full text-primary font-bold">Newest</Button>
                  <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">Top Rated</Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8">
                {latestPosts.map((post) => (
                  <ArticleCard key={post.slug} post={post} />
                ))}
              </div>

              {/* Load More with Visual Progress */}
              <div className="mt-12 text-center space-y-4">
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 py-6 rounded-2xl text-lg font-bold shadow-sm transition-all hover:scale-105 active:scale-95">
                  Load More Stories
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-sm text-muted-foreground">Showing 10 of 42 articles</p>
              </div>
            </div>

            {/* Sticky Sidebar with Tabs */}
            <div className="lg:col-span-1 space-y-8">
              <div className="sticky top-24 space-y-8">
                {/* Trending Tab Widget */}
                <div className="bg-surface rounded-2xl border border-divider shadow-sm overflow-hidden">
                  <div className="flex border-b border-divider">
                    <button className="flex-1 py-4 text-sm font-bold text-headline bg-muted/30 border-b-2 border-primary">
                      <TrendingUp className="w-4 h-4 inline mr-2" />
                      Trending
                    </button>
                    <button className="flex-1 py-4 text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-colors">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Recent
                    </button>
                  </div>
                  <div className="p-4">
                    <TrendingSidebar />
                  </div>
                </div>

                {/* Editor's Pick Banner */}
                <div className="gradient-primary rounded-2xl p-8 text-primary-foreground shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-0">Editor's Pick</Badge>
                    <h3 className="text-2xl font-serif font-bold mb-4 leading-tight">
                      The Untold Story of Nairobi's Rising Pop Star
                    </h3>
                    <Button variant="secondary" className="w-full text-foreground font-bold rounded-xl py-6">
                      Read Exclusive Scoop
                    </Button>
                  </div>
                </div>

                {/* Ad Placeholder with Professional Styling */}
                <div className="bg-muted/30 rounded-2xl p-6 text-center border-2 border-dashed border-divider">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4 block">ADVERTISEMENT</span>
                  <div className="aspect-[4/5] bg-surface rounded-xl flex items-center justify-center border border-divider shadow-inner">
                    <p className="text-muted-foreground font-medium">Standard Banner Slot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bento Exploration */}
      <section className="py-16">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-serif font-bold text-headline flex items-center gap-3">
              <span className="w-1.5 h-9 gradient-primary rounded-full" />
              Browse the Hub
            </h2>
            <Link to="/categories" className="group text-primary font-bold flex items-center gap-2">
              View All 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                className="group relative h-48 rounded-2xl border border-divider overflow-hidden flex flex-col justify-end p-6 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                {/* Visual Accent for 2026 Style */}
                <div className="absolute top-0 right-0 p-4 text-divider/20 group-hover:text-primary/10 transition-colors">
                  <Newspaper className="w-16 h-16" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <h3 className="font-serif font-bold text-xl text-headline group-hover:text-white transition-colors relative z-10">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-1 group-hover:text-white/80 transition-colors relative z-10">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Immersive Newsletter Section - 2026 UX Strategy */}
      <section className="py-20 bg-headline text-primary-foreground relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-black mb-4 tracking-tight leading-none">
              Get Kenya's <span className="text-primary italic">Juiciest</span> Scoops Daily
            </h2>
            <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto font-light leading-relaxed">
              Join 150,000+ insiders who receive exclusive celebrity gossip, political breakdowns, and viral trends every morning at 7 AM.
            </p>
            
            <form className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto p-2 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
              <input
                type="email"
                placeholder="Enter your VIP email"
                className="flex-1 px-8 py-5 bg-transparent border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/40 text-lg"
                required
              />
              <Button className="gradient-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] px-12 py-5 rounded-2xl text-lg font-black transition-all shadow-lg shadow-primary/20">
                Join the VIP List
              </Button>
            </form>
            <p className="text-sm text-white/30 italic">No spam, just tea. Unsubscribe with one click.</p>
          </div>
        </div>
      </section>

      {/* Global CSS for marquee and scrollbars */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      ` }} />
    </Layout>
  );
};

export default Index;