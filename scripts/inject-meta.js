import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '../dist');
const postsDir = path.join(__dirname, '../content/posts');
const indexHtmlPath = path.join(distDir, 'index.html');

const SITE_URL = "https://zandani.co.ke";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

if (!fs.existsSync(indexHtmlPath)) {
  console.error("No index.html found in dist. Make sure to run 'vite build' first.");
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

function cleanMeta(html) {
  return html
    .replace(/<title>.*?<\/title>/ig, '')
    .replace(/<meta[^>]*name=["']description["'][^>]*>/ig, '')
    .replace(/<meta[^>]*property=["']og:title["'][^>]*>/ig, '')
    .replace(/<meta[^>]*property=["']og:description["'][^>]*>/ig, '')
    .replace(/<meta[^>]*property=["']og:image["'][^>]*>/ig, '')
    .replace(/<meta[^>]*property=["']og:url["'][^>]*>/ig, '')
    .replace(/<meta[^>]*property=["']og:type["'][^>]*>/ig, '')
    .replace(/<meta[^>]*name=["']twitter:card["'][^>]*>/ig, '')
    .replace(/<meta[^>]*name=["']twitter:title["'][^>]*>/ig, '')
    .replace(/<meta[^>]*name=["']twitter:description["'][^>]*>/ig, '')
    .replace(/<meta[^>]*name=["']twitter:image["'][^>]*>/ig, '')
    .replace(/<link[^>]*rel=["']canonical["'][^>]*>/ig, '');
}

function writePage(subDir, html) {
  const fullDir = path.join(distDir, subDir);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }
  fs.writeFileSync(path.join(fullDir, 'index.html'), html);
}

// 1. Collect all posts
const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
const posts = postFiles.map(file => {
  const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
  const titleMatch = content.match(/^title:\s*(.+)$/im);
  const descMatch = content.match(/^(?:excerpt|description):\s*(.+)$/im);
  const imageMatch = content.match(/^image:\s*(.+)$/im);
  const slugMatch = content.match(/^slug:\s*(.+)$/im);
  const catMatch = content.match(/^category:\s*(.+)$/im);
  const dateMatch = content.match(/^date:\s*(.+)$/im);
  const authorMatch = content.match(/^author:\s*(.+)$/im);
  const tagsMatch = content.match(/^tags:\s*\[([^\]]*)\]/im);

  let title = titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, '').trim() : 'Za Ndani';
  let image = imageMatch ? imageMatch[1].trim().replace(/^["']|["']$/g, '').trim() : DEFAULT_IMAGE;
  const slug = slugMatch ? slugMatch[1].trim().replace(/^["']|["']$/g, '').trim() : file.replace('.md', '');
  const category = catMatch ? catMatch[1].trim().replace(/^["']|["']$/g, '').trim() : 'News';
  const author = authorMatch ? authorMatch[1].trim().replace(/^["']|["']$/g, '').trim() : 'Za Ndani';
  const dateStr = dateMatch ? dateMatch[1].trim().replace(/^["']|["']$/g, '').trim() : new Date().toISOString();
  const tags = tagsMatch ? tagsMatch[1].replace(/["']/g, '').trim() : '';

  let desc = '';
  if (descMatch) {
    desc = descMatch[1].trim().replace(/^["']|["']$/g, '').trim();
  } else {
    const body = content.replace(/^---[\s\S]*?---/, '').trim();
    desc = body.replace(/[#*`_\[\]()]/g, '').replace(/http[^\s]+/g, '').replace(/\s+/g, ' ').trim().substring(0, 160) + '...';
  }

  return { title, image, slug, category, author, dateStr, tags, desc };
});

// 2. Generate Article Pages
posts.forEach(p => {
  const pTitle = p.title.replace(/"/g, '&quot;');
  const pDesc = p.desc.replace(/"/g, '&quot;');
  const pImage = p.image.startsWith('/') ? `${SITE_URL}${p.image}` : p.image;
  const isoDate = new Date(p.dateStr).toISOString();

  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": p.title,
    "description": p.desc,
    "image": [pImage],
    "datePublished": isoDate,
    "dateModified": isoDate,
    "author": { "@type": "Person", "name": p.author, "url": `${SITE_URL}/author/${p.author.toLowerCase().replace(/\s+/g, '-')}` },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "Za Ndani",
      "url": SITE_URL,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.png`, "width": 600, "height": 60 },
      "ethicsPolicy": `${SITE_URL}/ethics`,
      "correctionsPolicy": `${SITE_URL}/corrections`,
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "newsroom",
        "email": "contact@zandani.co.ke",
        "telephone": "+254706396305"
      },
      "sameAs": [
        "https://twitter.com/zandani_ke",
        "https://facebook.com/zandanike",
        "https://instagram.com/zandani_ke",
        "https://youtube.com/@zandanike"
      ]
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE_URL}/article/${p.slug}` }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": p.category, "item": `${SITE_URL}/category/${p.category.toLowerCase()}` },
      { "@type": "ListItem", "position": 3, "name": p.title, "item": `${SITE_URL}/article/${p.slug}` }
    ]
  };

  const articleMeta = `
    <title>${pTitle} | Za Ndani</title>
    <meta name="description" content="${pDesc}">
    <link rel="canonical" href="${SITE_URL}/article/${p.slug}">
    <meta property="og:title" content="${pTitle}">
    <meta property="og:description" content="${pDesc}">
    <meta property="og:image" content="${pImage}">
    <meta property="og:url" content="${SITE_URL}/article/${p.slug}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${pTitle}">
    <meta name="twitter:description" content="${pDesc}">
    <meta name="twitter:image" content="${pImage}">
    <script type="application/ld+json">${JSON.stringify(newsArticleSchema)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  `;

  const html = cleanMeta(baseHtml).replace(/<head>/i, `<head>\n${articleMeta}`);
  writePage(`article/${p.slug}`, html);
});

// 3. Generate Category Hubs
const uniqueCategories = Array.from(new Set(posts.map(p => p.category)));
uniqueCategories.forEach(cat => {
  const catSlug = cat.toLowerCase();
  const catTitle = `${cat} News | Za Ndani`;
  const catDesc = `Latest ${cat} news, breaking stories, and updates from Kenya and around the world on Za Ndani.`;
  const catUrl = `${SITE_URL}/category/${catSlug}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": catTitle,
    "url": catUrl,
    "description": catDesc,
    "publisher": { "@type": "Organization", "name": "Za Ndani" }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": cat, "item": catUrl }
    ]
  };

  const catMeta = `
    <title>${catTitle}</title>
    <meta name="description" content="${catDesc}">
    <link rel="canonical" href="${catUrl}">
    <meta property="og:title" content="${catTitle}">
    <meta property="og:description" content="${catDesc}">
    <meta property="og:image" content="${DEFAULT_IMAGE}">
    <meta property="og:url" content="${catUrl}">
    <meta property="og:type" content="website">
    <meta name="twitter:title" content="${catTitle}">
    <meta name="twitter:description" content="${catDesc}">
    <script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  `;

  const html = cleanMeta(baseHtml).replace(/<head>/i, `<head>\n${catMeta}`);
  writePage(`category/${catSlug}`, html);

  // Also write to logical root hubs if they exist (e.g., /sports, /news)
  const commonHubs = ['news', 'sports', 'entertainment', 'business', 'lifestyle', 'politics'];
  if (commonHubs.includes(catSlug)) {
    writePage(catSlug, html.replace(new RegExp(catUrl, 'g'), `${SITE_URL}/${catSlug}`));
  }
});

// 4. Special Hubs (Trending, etc.)
const specialHubs = [
  { slug: 'trending', title: 'Trending News | Za Ndani', desc: 'The most talked-about stories and viral news in Kenya right now.' },
  { slug: 'news', title: 'Kenya Breaking News | Za Ndani', desc: 'Get the latest breaking news and headlines from across Kenya.' },
];

specialHubs.forEach(hub => {
  const hubUrl = `${SITE_URL}/${hub.slug}`;
  const hubMeta = `
    <title>${hub.title}</title>
    <meta name="description" content="${hub.desc}">
    <link rel="canonical" href="${hubUrl}">
    <meta property="og:title" content="${hub.title}">
    <meta property="og:description" content="${hub.desc}">
    <meta property="og:image" content="${DEFAULT_IMAGE}">
    <meta property="og:url" content="${hubUrl}">
    <meta property="og:type" content="website">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": hub.title,
      "url": hubUrl,
      "description": hub.desc
    })}</script>
  `;
  const html = cleanMeta(baseHtml).replace(/<head>/i, `<head>\n${hubMeta}`);
  writePage(hub.slug, html);
});

console.log(`Successfully generated SEO meta tags for ${posts.length} articles and hubs!`);
