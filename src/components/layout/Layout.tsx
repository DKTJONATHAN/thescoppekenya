import { Header } from "./Header";
import { Footer } from "./Footer";
import AdUnit from "@/components/AdUnit";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showAds, setShowAds] = useState(false);

  useEffect(() => {
    // Defer ALL layout ads until after first paint + 2s
    const t = setTimeout(() => setShowAds(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Ad: Deferred to avoid blocking paint */}
      {showAds && (
        <div className="w-full flex justify-center py-4 border-t border-border">
          <AdUnit type="horizontal" />
        </div>
      )}

      <Footer />
    </div>
  );
}
