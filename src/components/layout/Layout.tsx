import { Header } from "./Header";
import { Footer } from "./Footer";
import AdUnit from "@/components/AdUnit";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Global Top Ad: Horizontal banner below header */}
      <div className="w-full flex justify-center py-3 bg-muted/5 border-b border-border">
        <AdUnit type="horizontal" />
      </div>

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
