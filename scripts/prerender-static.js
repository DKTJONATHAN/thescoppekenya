import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

const SITE_URL = "https://zandani.co.ke";
const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, "dist", "client");
const PUBLIC_DIR = path.join(ROOT, "public");
const SERVER_ENTRY = path.join(ROOT, "dist", "server", "entry-server.js");
const MANIFEST_PATH = path.join(CLIENT_DIR, ".vite", "manifest.json");
const POSTS_MANIFEST_PATH = path.join(PUBLIC_DIR, "posts-manifest.json");

/**
 * Prerender ONLY non-article pages.
 * Articles must NOT be body-prerendered (user constraint + content stability).
 * Article SEO meta shells are handled by scripts/inject-meta.js instead.
 * Sitemaps / robots / feed / llms.txt are owned by scripts/generate-seo.js.
 */
const STATIC_PAGES = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/privacy-policy",
  "/terms",
  "/advertise",
  "/careers",
  "/ethics",
  "/corrections",
  "/fact-check",
  "/trending",
  "/news",
  "/entertainment",
  "/sports",
  "/business",
  "/lifestyle",
  "/sports/live",
  "/sitemap",
  "/authors",
  "/podcast",
  "/tv",
  "/energy",
  "/education",
  "/finance",
  "/live",
];

const CATEGORY_PAGES = [
  { slug: "news", name: "News" },
  { slug: "entertainment", name: "Entertainment" },
  { slug: "sports", name: "Sports" },
  { slug: "business", name: "Business" },
  { slug: "lifestyle", name: "Lifestyle" },
  { slug: "politics", name: "Politics" },
];

function slugifyAuthor(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function routeToFilePath(route) {
  if (route === "/") return path.join(CLIENT_DIR, "index.html");
  const clean = route.replace(/^\//, "");
  if (/\.[a-z0-9]+$/i.test(clean)) {
    return path.join(CLIENT_DIR, clean);
  }
  return path.join(CLIENT_DIR, clean, "index.html");
}

async function main() {
  if (!await fileExists(MANIFEST_PATH) || !await fileExists(SERVER_ENTRY)) {
    console.log("prerender-static: SSR build artifacts missing — skipping (inject-meta + generate-seo cover SEO)."
    );
    return;
  }

  const manifestRaw = await readFile(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(manifestRaw);
  const { render } = await import(pathToFileURL(SERVER_ENTRY).href);

  let uniqueAuthors = [];
  try {
    const postsRaw = await readFile(POSTS_MANIFEST_PATH, "utf8");
    const posts = JSON.parse(postsRaw);
    uniqueAuthors = [...new Set(posts.map((post) => post.author).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  } catch {
    console.warn("prerender-static: posts-manifest not found; skipping author routes");
  }

  const categoryRoutes = CATEGORY_PAGES.map((category) => `/category/${category.slug}`);
  const authorRoutes = uniqueAuthors.map((author) => `/author/${slugifyAuthor(author)}`);
  const hubRoutes = ["/energy", "/education", "/finance"];

  // IMPORTANT: article routes are intentionally excluded
  const routes = [...new Set([
    ...STATIC_PAGES,
    ...categoryRoutes,
    ...authorRoutes,
    ...hubRoutes,
  ])];

  await mkdir(CLIENT_DIR, { recursive: true });

  for (const route of routes) {
    try {
      const requestUrl = new URL(route, SITE_URL).toString();
      const rendered = render(new Request(requestUrl), manifest);
      const filePath = routeToFilePath(route);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, rendered.html, "utf8");
      console.log(`Rendered ${route}`);
    } catch (err) {
      console.warn(`Skip ${route}: ${err.message}`);
    }
  }

  console.log(`Prerendered ${routes.length} non-article routes. Sitemaps left to generate-seo.js.`);
}

async function fileExists(p) {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

main().catch((error) => {
  console.error("Prerender failed:", error);
  process.exit(1);
});
