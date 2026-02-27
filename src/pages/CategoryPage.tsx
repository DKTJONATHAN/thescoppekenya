import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { getPostsByCategory, categories } from "@/lib/markdown";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find(c => c.slug === slug);
  const posts = useMemo(() => getPostsByCategory(slug || ""), [slug]);

  // View tracking state
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // Fetch GA4 views from internal API
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

  // Combine markdown data with live view counts
  const postsWithViews = useMemo(() => {
    return posts.map(post => {
      const cleanSlug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const exactPath = `/article/${cleanSlug}`;
      const pathWithSlash = `/article/${cleanSlug}/`;
      const fallbackPath = `/posts/${cleanSlug}`; 

      const gaViews = viewCounts[exactPath] || 
                      viewCounts[pathWithSlash] || 
                      viewCounts[fallbackPath] || 
                      0;

      const displayViews = gaViews > 0 ? gaViews : 47;

      return {
        ...post,
        views: displayViews
      };
    });
  }, [posts, viewCounts]);

  if (!category) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-headline mb-4">Category Not Found</h1>
          <p className="text-muted-foreground">The category you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  // SEO meta per category slug – edit/add more as needed
  const categoryMeta: Record<string, { title: string; description: string; keywords: string }> = {
    gossip: {
      title: "Kenya Celebrity Gossip - Latest Scandals & Insider News | Za Ndani",
      description: "Hottest Kenya celebrity gossip today, Nairobi scandals, Kenyan stars relationships, music & TV exclusives. Bold updates daily on Za Ndani.",
      keywords: "kenya celebrity gossip, latest gossip kenya, nairobi gossip, celebrity scandals kenya, kenyan celebrities news, za ndani gossip"
    },
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
    tech: {
      title: "Tech News Kenya - Startups, Safaricom & Innovation | Za Ndani",
      description: "Latest technology news Kenya: Safaricom, M-Pesa updates, Kenyan startups, gadgets, digital innovation & government tech policies.",
      keywords: "tech news kenya, kenya technology news, safaricom news, mpesa updates, kenyan startups, digital kenya, za ndani tech"
    },
    // Add more categories here if you have other slugs
  };

  // Fallback if slug not in map
  const meta = categoryMeta[slug || ""] || {
    title: `${category.name} - Za Ndani`,
    description: category.description,
    keywords: "za ndani, kenya news, trending kenya"
  };

  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": meta.title,
    "description": meta.description,
    "url": `https://zandani.co.ke/category/${category.slug}`
  };

  return (
    <Layout>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />

        {/* Canonical */}
        <link rel="canonical" href={`https://zandani.co.ke/category/${category.slug}`} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://zandani.co.ke/category/${category.slug}`} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content="https://zandani.co.ke/logo.png" />
        <meta property="og:site_name" content="Za Ndani" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content="https://zandani.co.ke/logo.png" />
      </Helmet>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }} />

      <CategoryBar />

      <section className="py-12 gradient-hero">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-4">
              {category.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              {category.description}
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {postsWithViews.length > 0 ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {postsWithViews.map((post) => (
                      <div key={post.slug} className="relative group">
                        <ArticleCard post={post} />
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-black/60 backdrop-blur-md text-white border-0 flex items-center gap-1.5 px-3 py-1 shadow-lg">
                            <Eye className="w-3.5 h-3.5" />
                            {post.views > 999 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-center">
                    <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      Load More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No articles in this category yet.</p>
                </div>
              )}
            </div>
            <div className="lg:col-span-1">
              <TrendingSidebar />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}