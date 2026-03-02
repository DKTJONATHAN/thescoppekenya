import { Header } from "./Header";
import { Footer } from "./Footer";
import AdUnit from "@/components/AdUnit";
import AdInjector from "@/components/AdInjector"; // Ensure you save the AdInjector component in this path

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Global Top Ad: Fixed horizontal banner */}
      <div className="w-full flex justify-center py-4 bg-muted/5 border-b border-border">
        <AdUnit type="horizontal" />
      </div>

      <main className="flex-1">
        {/* The AdInjector wraps the children and distributes rotating ads 
            evenly between content blocks (paragraphs, divs, articles, etc.)
            Frequency is set to 3 by default.
        */}
        <AdInjector frequency={3}>
          {children}
        </AdInjector>
      </main>

      {/* Global Bottom Ad: Fixed horizontal banner */}
      <div className="w-full flex justify-center py-6 border-t border-border">
        <AdUnit type="horizontal" />
      </div>

      <Footer />
    </div>
  );
}