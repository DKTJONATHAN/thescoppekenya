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
];

const CATEGORY_PAGES = [
  { slug: "news", name: "News", description: "Breaking news, politics na current affairs from Kenya and beyond" },
  { slug: "entertainment", name: "Entertainment", description: "Celebrity news, music, movies, pop culture, na relationship drama" },
  { slug: "sports", name: "Sports", description: "Football, athletics, na all things sports" },
  { slug: "business", name: "Business", description: "Economy, startups, tech na financial news" },
  { slug: "lifestyle", name: "Lifestyle", description: "Fashion, health, travel, na living well" },
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugifyAuthor(name) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

function routeToFilePath(route) {
  if (route === "/") return path.join(CLIENT_DIR, "index.html");
  const clean = route.replace(/^\//, "");
  if (/\.[a-z0-9]+$/i.test(clean)) {
    return path.join(CLIENT_DIR, clean);
  }
  return path.join(CLIENT_DIR, clean, "index.html");
}

async function writeTextAssets(filename, content) {
  const clientPath = path.join(CLIENT_DIR, filename);
  const publicPath = path.join(PUBLIC_DIR, filename);
  await Promise.all([
    mkdir(path.dirname(clientPath), { recursive: true }),
    mkdir(path.dirname(publicPath), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(clientPath, content, "utf8"),
    writeFile(publicPath, content, "utf8"),
  ]);
}

async function main() {
  const manifestRaw = await readFile(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(manifestRaw);
  const { render } = await import(pathToFileURL(SERVER_ENTRY).href);

  const postsRaw = await readFile(POSTS_MANIFEST_PATH, "utf8");
  const posts = JSON.parse(postsRaw);

  const uniqueTags = [...new Set(posts.flatMap((post) => post.tags || []))].sort((a, b) => a.localeCompare(b));
  const uniqueAuthors = [...new Set(posts.map((post) => post.author))].sort((a, b) => a.localeCompare(b));

  const articleRoutes = posts.map((post) => `/article/${post.slug}`);
  const categoryRoutes = CATEGORY_PAGES.map((category) => `/category/${category.slug}`);
  const tagRoutes = uniqueTags.map((tag) => `/tag/${encodeURIComponent(tag)}`);
  const authorRoutes = uniqueAuthors.map((author) => `/author/${slugifyAuthor(author)}`);
  const hubRoutes = ["/energy", "/education", "/finance"];
  const routes = [...new Set([
    ...STATIC_PAGES,
    ...articleRoutes,
    ...categoryRoutes,
    ...tagRoutes,
    ...authorRoutes,
    ...hubRoutes,
  ])];

  await mkdir(CLIENT_DIR, { recursive: true });

  for (const route of routes) {
    const requestUrl = new URL(route, SITE_URL).toString();
    const rendered = render(new Request(requestUrl), manifest);
    const filePath = routeToFilePath(route);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, rendered.html, "utf8");
    console.log(`Rendered ${route}`);
  }

  const sitemapUrls = [
    ...STATIC_PAGES,
    ...categoryRoutes,
    ...tagRoutes,
    ...authorRoutes,
    ...hubRoutes,
    ...articleRoutes,
  ].map((route) => {
    const post = posts.find((item) => `/article/${item.slug}` === route);
    const lastmod = post?.dateModified || post?.date;
    const priority = route.startsWith("/article/") ? "0.8" : route === "/" ? "1.0" : route.startsWith("/category/") ? "0.7" : "0.6";
    return [
      "  <url>",
      `    <loc>${SITE_URL}${route}</loc>`,
      lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : "",
      "    <changefreq>weekly</changefreq>",
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].filter(Boolean).join("\n");
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join("\n")}\n</urlset>\n`;
  await writeTextAssets("sitemap.xml", sitemapXml);

  const newsCutoff = Date.now() - 48 * 60 * 60 * 1000;
  const newsPosts = posts.filter((post) => new Date(post.date).getTime() >= newsCutoff).slice(0, 1000);
  const newsSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${newsPosts.map((post) => [
    "  <url>",
    `    <loc>${SITE_URL}/article/${escapeXml(post.slug)}</loc>`,
    "    <news:news>",
    "      <news:publication>",
    "        <news:name>Za Ndani</news:name>",
    "        <news:language>en</news:language>",
    "      </news:publication>",
    `      <news:publication_date>${escapeXml(post.date)}</news:publication_date>`,
    `      <news:title>${escapeXml(post.title)}</news:title>`,
    `      <news:keywords>${escapeXml((post.tags || []).join(", "))}</news:keywords>`,
    "    </news:news>",
    "  </url>",
  ].join("\n")).join("\n")}\n</urlset>\n`;
  await writeTextAssets("news-sitemap.xml", newsSitemapXml);

  const feedPosts = posts.slice(0, 100);
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Za Ndani</title>\n    <link>${SITE_URL}</link>\n    <description>Kenya and world news, entertainment, business, sports, and more.</description>\n${feedPosts.map((post) => [
    "    <item>",
    `      <title><![CDATA[${post.title}]]></title>`,
    `      <link>${SITE_URL}/article/${post.slug}</link>`,
    `      <guid isPermaLink="true">${SITE_URL}/article/${post.slug}</guid>`,
    `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
    `      <description><![CDATA[${post.excerpt || post.description || ""}]]></description>`,
    "    </item>",
  ].join("\n")).join("\n")}\n  </channel>\n</rss>\n`;
  await writeTextAssets("feed.xml", rssXml);

  const llmsTxt = `# Za Ndani (${SITE_URL})\n\n## Recent Headlines\n${posts.slice(0, 10).map((post) => `- [${post.title}](${SITE_URL}/article/${post.slug})`).join("\n")}\n\n## More Information\n- Sitemap: ${SITE_URL}/sitemap.xml\n- News sitemap: ${SITE_URL}/news-sitemap.xml\n- Feed: ${SITE_URL}/feed.xml\n- Robots: ${SITE_URL}/robots.txt\n`;
  await writeTextAssets("llms.txt", llmsTxt);

  const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\nSitemap: ${SITE_URL}/news-sitemap.xml\n`;
  await writeTextAssets("robots.txt", robotsTxt);

  console.log(`Prerendered ${routes.length} routes and wrote static SEO assets.`);
}

main().catch((error) => {
  console.error("Prerender failed:", error);
  process.exit(1);
});

