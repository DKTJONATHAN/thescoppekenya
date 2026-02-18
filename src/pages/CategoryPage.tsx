import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { getPostsByCategory, categories } from "@/lib/markdown";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find(c => c.slug === slug);
  const posts = getPostsByCategory(slug || "");

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

  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category.name} - Za Ndani`,
    "description": category.description,
    "url": `https://zandani.co.ke/category/${category.slug}`
  };

  return (
    <Layout>
      <Helmet>
        <title>{category.name} - Za Ndani</title>
        <meta name="description" content={category.description} />
        <link rel="canonical" href={`https://zandani.co.ke/category/${category.slug}`} />
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
              {posts.length > 0 ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {posts.map((post) => (
                      <ArticleCard key={post.slug} post={post} />
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
