import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// â”€â”€â”€ Read article slugs from markdown frontmatter at build time â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Uses Node.js fs (not import.meta.glob) so it works in vite config context
function getArticleRoutes(): string[] {
  const postsDir = path.resolve(__dirname, "content/posts");
  if (!fs.existsSync(postsDir)) return [];

  return fs.readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = fs.readFileSync(path.join(postsDir, f), "utf-8");
      // Try to pull slug from frontmatter, fall back to filename
      const slugMatch = content.match(/^slug:\s*(.+)$/m);
      const slug = slugMatch
        ? slugMatch[1].trim().replace(/^["\'']|["\'']$/g, "")
        : f.replace(".md", "");
      return `/article/${slug}`;
    });
}

export default defineConfig(async ({ mode }) => {
  const { vitePrerender } = await import("vite-prerender-plugin");

  const articleRoutes = getArticleRoutes();

  const allRoutes = [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/sports",
    "/category/news",
    "/category/entertainment",
    "/category/gossip",
    "/category/sports",
    "/category/business",
    "/category/lifestyle",
    ...articleRoutes,
  ];

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Forwards /api/* to your live Vercel deployment during local dev
        "/api": {
          target: "https://zandani.co.ke",
          changeOrigin: true,
          secure: true,
        },
      },
    },
    plugins: [
      react(),
      // â”€â”€ Pre-render all routes at build time so crawlers see full HTML â”€â”€
      // This bakes og:image, meta description, and schema into each page's HTML
      vitePrerender({
        routes: allRoutes,
        // Inject prerendered HTML into the entry point
        renderTarget: "#root",
        // Ensure Helmet tags are in the final HTML
        injectHead: true,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    assetsInclude: ["**/*.md"],
  };
});