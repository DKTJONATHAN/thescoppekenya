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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="mb-4 text-6xl font-serif font-black text-foreground">404</h1>
          <p className="mb-2 text-xl font-bold text-foreground">Page Not Found</p>
          <p className="mb-8 text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
            Return to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
