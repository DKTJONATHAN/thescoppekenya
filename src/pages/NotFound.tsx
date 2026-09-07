import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <Helmet>
        <title>Page Not Found — Za Ndani</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="The page you're looking for doesn't exist. Browse the latest Kenya news and entertainment on Za Ndani." />
      </Helmet>
      <div className="border-b border-divider">
        <div className="h-[3px] w-full bg-primary" />
      </div>
      <div className="flex min-h-[62vh] items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4 py-16">
          <p className="text-[10px] font-black tracking-[0.28em] uppercase text-primary mb-5">404 · missing page</p>
          <h1 className="mb-4 text-7xl font-serif font-black text-foreground leading-none">Gone.</h1>
          <p className="mb-2 text-xl font-serif font-bold text-foreground">This URL is not on the desk.</p>
          <p className="mb-8 text-muted-foreground">It may have been moved, merged, or never published. The live board is still on the homepage.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
              Return home
            </Link>
            <Link to="/news" className="inline-flex items-center gap-2 px-6 py-3 border border-divider font-bold text-sm uppercase tracking-wider hover:border-primary hover:text-primary transition-colors">
              Latest news
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
