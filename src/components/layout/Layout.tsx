import { Header } from "./Header";
import { Footer } from "./Footer";
import AdUnit from "@/components/AdUnit";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showTopAd, setShowTopAd] = useState(false);

  useEffect(() => {
    // Defer top ad so it doesn't block FCP/LCP
    const id = requestAnimationFrame(() => setShowTopAd(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Global Top Ad: Deferred to avoid blocking initial paint */}
      {showTopAd && (
        <div className="w-full flex justify-center py-3 bg-muted/5 border-b border-border">
          <AdUnit type="horizontal" />
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>

      {/* Global Bottom Ad: Horizontal banner above footer */}
      <div className="w-full flex justify-center py-4 border-t border-border">
        <AdUnit type="horizontal" />
      </div>

      <Footer />
    </div>
  );
}
