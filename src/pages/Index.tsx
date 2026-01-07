import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { getFeaturedPosts, getLatestPosts, categories } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const featuredPosts = getFeaturedPosts();
  const latestPosts = getLatestPosts(6);

  return (
    <Layout>
      {/* SEO Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "The Scoop Kenya - Breaking News & Entertainment",
          "description": "Kenya's leading source for breaking news, entertainment updates, celebrity gossip, and trending stories.",
          "url": "https://thescoopkenya.co.ke",
          "publisher": {
            "@type": "Organization",
            "name": "The Scoop Kenya",
            "logo": "https://thescoopkenya.co.ke/logo.png"
          }
        })
      }} />

      <CategoryBar />

      {/* Hero Section */}
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Featured */}
            <div className="lg:col-span-2">
              {featuredPosts[0] && (
                <ArticleCard post={featuredPosts[0]} variant="featured" />
              )}
            </div>

            {/* Secondary Featured */}
            <div className="space-y-6">
              {featuredPosts.slice(1, 3).map((post) => (
                <ArticleCard key={post.slug} post={post} variant="horizontal" />
              ))}
              
              {/* Breaking News Banner */}
              <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">Breaking</span>
                </div>
                <p className="font-serif font-bold text-lg mb-3">
                  Stay ahead with real-time updates on Kenya's hottest stories.
                </p>
                <Button variant="secondary" size="sm" className="text-foreground">
                  Enable Notifications
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Stories + Trending */}
      <section className="py-8 md:py-12 bg-surface">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-headline flex items-center gap-3">
              <span className="w-1 h-8 gradient-primary rounded-full" />
              Latest Stories
            </h2>
            <Link to="/latest" className="text-primary hover:underline flex items-center gap-1 text-sm font-medium">
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Latest Posts Grid */}
            <div className="lg:col-span-2">
              <div className="grid sm:grid-cols-2 gap-6">
                {latestPosts.map((post) => (
                  <ArticleCard key={post.slug} post={post} />
                ))}
              </div>

              {/* Load More */}
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Load More Stories
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Trending Sidebar */}
            <div className="lg:col-span-1">
              <TrendingSidebar />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-headline mb-8 flex items-center gap-3">
            <span className="w-1 h-8 gradient-primary rounded-full" />
            Explore Categories
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                className="group p-6 bg-surface rounded-xl border border-divider hover:border-primary hover:shadow-elevated transition-smooth"
              >
                <h3 className="font-serif font-bold text-xl text-headline group-hover:text-primary transition-colors mb-2">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {category.description}
                </p>
                <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-12 md:py-16 gradient-hero">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-headline mb-4">
              Get the Scoop First
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of Kenyans who get our daily newsletter with the latest news, gossip, and entertainment.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 bg-background border border-divider rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button className="gradient-primary text-primary-foreground hover:opacity-90 px-8">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
