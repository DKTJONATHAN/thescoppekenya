import { Component, ReactNode, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

// Homepage loaded eagerly for fastest FCP/LCP
import Index from "./pages/Index";
// Code Splitting: Lazy load all other pages
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Trending = lazy(() => import("./pages/Trending"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const AdvertisePage = lazy(() => import("./pages/AdvertisePage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const TagPage = lazy(() => import("./pages/TagPage"));
const SportsPage = lazy(() => import("./pages/SportsPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const LiveScoresPage = lazy(() => import("./pages/LiveScoresPage"));
const SitemapPage = lazy(() => import("./pages/SitemapPage"));
const SitemapHtmlPage = lazy(() => import("./pages/SitemapHtmlPage"));
const AuthorsPage = lazy(() => import("./pages/AuthorsPage"));
const AuthorProfilePage = lazy(() => import("./pages/AuthorProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized Query Client with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading fallback for lazy loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center max-w-md mx-auto px-4">
      <h1 className="text-2xl font-serif font-bold text-foreground mb-4">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mb-6">
        We encountered an error loading this page. Please try again.
      </p>
      <Button onClick={onRetry} className="gradient-primary text-primary-foreground">
        Try Again
      </Button>
    </div>
  </div>
);

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Page error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

// Global error handler component
const GlobalErrorHandler = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);

      if (event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
        console.warn('Dynamic import failed, reloading page...');
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GlobalErrorHandler>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/article/:slug" element={<ArticlePage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/advertise" element={<AdvertisePage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/tag/:tag" element={<TagPage />} />
                <Route path="/sports" element={<SportsPage />} />
                <Route path="/sports/live" element={<LiveScoresPage />} />
                <Route path="/sitemap.xml" element={<SitemapPage />} />
                <Route path="/sitemap" element={<SitemapHtmlPage />} />
                <Route path="/authors" element={<AuthorsPage />} />
                <Route path="/author/:authorName" element={<AuthorProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </GlobalErrorHandler>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;