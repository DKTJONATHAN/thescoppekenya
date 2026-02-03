import { useEffect } from "react";
import { generateSitemap } from "@/lib/markdown";

const SitemapPage = () => {
  useEffect(() => {
    // Set content type and serve XML
    const sitemap = generateSitemap();
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    // Redirect to the blob URL to serve as XML
    window.location.href = url;
  }, []);

  // Fallback display while redirecting
  return (
    <pre style={{ fontFamily: 'monospace', padding: '20px' }}>
      {generateSitemap()}
    </pre>
  );
};

export default SitemapPage;
