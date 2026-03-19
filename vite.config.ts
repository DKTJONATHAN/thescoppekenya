import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import vitePrerender from "vite-plugin-prerender";

// ─── Read article slugs from markdown frontmatter at build time ───────────────
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
        ? slugMatch[1].trim().replace(/^["']|["']$/g, "")
        : f.replace(".md", "");
      return `/article/${slug}`;
    });
}

export default defineConfig(({ mode }) => {
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
        "/api": {
          target: "https://zandani.co.ke",
          changeOrigin: true,
          secure: true,
        },
      },
    },
    plugins: [
      react(),
      // ── Pre-render all routes at build time so crawlers see full HTML ──
      vitePrerender({
        staticDir: path.join(__dirname, "dist"),
        routes: allRoutes,
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
