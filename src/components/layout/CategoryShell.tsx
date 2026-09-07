import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://zandani.co.ke";

export type CategoryShellProps = {
  title: string;
  path: string;
  description: string;
  kicker?: string;
  accentClass?: string;
  children: React.ReactNode;
};

/** Shared page chrome: SEO, breadcrumbs, section kicker, consistent spacing */
export function CategoryShell({
  title,
  path,
  description,
  kicker,
  accentClass = "border-primary",
  children,
}: CategoryShellProps) {
  const canonical = `${SITE_URL}${path}`;

  return (
    <Layout>
      <Helmet>
        <title>{title} | Za Ndani</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${title} | Za Ndani`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_KE" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": title, "item": canonical },
          ],
        })}</script>
      </Helmet>

      <div className="border-b border-divider bg-background">
        <div className="h-[3px] w-full bg-primary" />
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 opacity-50" />
            <span className="text-foreground font-semibold">{title}</span>
          </nav>
        </div>
      </div>

      {(kicker || title) && (
        <div className="container max-w-7xl mx-auto px-4 pt-6 pb-2">
          {kicker && <p className="section-kicker mb-1">{kicker}</p>}
          <h1 className={`text-2xl md:text-3xl font-serif font-black tracking-tight border-l-4 pl-3 ${accentClass}`}>
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{description}</p>
        </div>
      )}

      <div className="pb-12">{children}</div>
    </Layout>
  );
}
