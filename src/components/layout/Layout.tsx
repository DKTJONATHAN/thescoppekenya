import { Header } from "./Header";
import { Footer } from "./Footer";
import { PodcastComingSoon } from "./PodcastComingSoon";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <PodcastComingSoon />
      <Footer />
    </div>
  );
}
