#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://zandani.co.ke';
const PUBLICATION_NAME = 'Za Ndani';
const PUBLICATION_LANGUAGE = 'en';

// Build entity strings without embedding literal &entity; sequences that get stripped by APIs
const AMP = String.fromCharCode(38) + 'amp;';
const LT = String.fromCharCode(38) + 'lt;';
const GT = String.fromCharCode(38) + 'gt;';
const QUOT = String.fromCharCode(38) + 'quot;';
const APOS = String.fromCharCode(38) + 'apos;';

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, APOS);
}

function toW3CDate(dateStr) {
  const d = new Date(String(dateStr || '').trim());
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function rfc822Date(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[%']/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripMarkdown(text) {
  if (!text) return '';
  return String(text)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/[#>*_~`]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateSnippet(text, maxLength = 260) {
  const cleaned = stripMarkdown(text);
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  const sliced = cleaned.slice(0, maxLength + 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${sliced.slice(0, lastSpace > 100 ? lastSpace : maxLength).trim()}...`;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const yaml = match[1];
  const body = match[2];
  const data = {};
  for (const line of yaml.split('\n')) {
    const col = line.indexOf(':');
    if (col === -1) continue;
    const key = line.slice(0, col).trim();
    let val = line.slice(col + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    data[key] = val;
  }
  return { data, body };
}

async function loadPosts() {
  const postsDir = path.resolve(process.cwd(), 'content/posts');
  let files = [];
  try {
    files = await fs.readdir(postsDir);
  } catch (err) {
    console.error(`Cannot read posts directory: ${err.message}`);
    return [];
  }

  const posts = [];
  for (const file of files.filter(f => f.endsWith('.md'))) {
    try {
      const raw = await fs.readFile(path.join(postsDir, file), 'utf-8');
      const { data, body } = parseFrontmatter(raw);
      posts.push({
        slug: data.slug || file.replace('.md', ''),
        title: data.title || 'Za Ndani Article',
        date: data.date || new Date().toISOString(),
        lastmod: data.updated || data.modified || data.lastmod || data.dateModified || data.date || new Date().toISOString(),
        image: data.image || '',
        category: data.category || 'News',
        author: data.author || 'Za Ndani',
        tags: Array.isArray(data.tags) ? data.tags : [],
        description: data.description || data.excerpt || truncateSnippet(body),
        body,
      });
    } catch (err) {
      console.warn(`Skipping ${file}: ${err.message}`);
    }
  }
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function urlBlock(loc, lastmod) {
  return `  <url>\n    <loc>${SITE_URL}${loc}</loc>\n    <lastmod>${toW3CDate(lastmod)}</lastmod>\n  </url>`;
}

function generateStaticSitemap() {
  const now = new Date().toISOString();
  const staticPaths = [
    '/',
    '/live',
    '/trending',
    '/news',
    '/sports',
    '/entertainment',
    '/business',
    '/lifestyle',
    '/politics',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/ethics',
    '/corrections',
    '/fact-check',
    '/advertise',
    '/careers',
    '/authors',
    '/podcast',
    '/tv',
    '/energy',
    '/education',
    '/finance',
    '/sitemap',
  ];
  const blocks = staticPaths.map((p) => urlBlock(p, now));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join('\n')}\n</urlset>`;
}

function generateCategoriesSitemap(posts) {
  const now = new Date().toISOString();
  const categories = [...new Set(
    posts.map((p) => slugify(p.category)).filter(Boolean)
  )].sort();
  const blocks = categories.map((cat) => urlBlock(`/category/${cat}`, now));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join('\n')}\n</urlset>`;
}

function generateArticlesSitemap(posts) {
  const blocks = posts.map((p) =>
    urlBlock(`/article/${encodeURIComponent(p.slug)}`, p.lastmod || p.date)
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join('\n')}\n</urlset>`;
}

function generateTagsSitemap(posts) {
  const now = new Date().toISOString();
  const tagCounts = new Map();
  for (const p of posts) {
    for (const t of p.tags || []) {
      const s = slugify(t);
      if (!s) continue;
      tagCounts.set(s, (tagCounts.get(s) || 0) + 1);
    }
  }
  const tags = [...tagCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([tag]) => tag)
    .sort()
    .slice(0, 2000);
  const blocks = tags.map((tag) => urlBlock(`/tag/${tag}`, now));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join('\n')}\n</urlset>`;
}

function generateSitemapIndex() {
  const now = new Date().toISOString();
  const files = [
    'sitemap-static.xml',
    'sitemap-categories.xml',
    'sitemap-articles.xml',
    'sitemap-tags.xml',
    'news-sitemap.xml',
  ];
  const blocks = files.map(
    (f) =>
      `  <sitemap>\n    <loc>${SITE_URL}/${f}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join('\n')}\n</sitemapindex>`;
}

function generateNewsSitemap(posts) {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const newsPosts = posts.filter((p) => new Date(p.date).getTime() >= cutoff);
  console.log(`News sitemap contains ${newsPosts.length} posts from the last 48 hours.`);
  const blocks = newsPosts.slice(0, 1000).map(
    (p) => `  <url>
    <loc>${SITE_URL}/article/${escapeXml(p.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${PUBLICATION_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${toW3CDate(p.date)}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
      <news:keywords>${escapeXml(Array.isArray(p.tags) ? p.tags.join(', ') : '')}</news:keywords>
    </news:news>
  </url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset\n  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n>\n${blocks.join('\n')}\n</urlset>`;
}

function generateRssFeed(posts) {
  const feedPosts = posts.slice(0, 100);
  const items = feedPosts.map((p) => {
    const url = `${SITE_URL}/article/${escapeXml(p.slug)}`;
    const imageTag = p.image ? `<enclosure url="${escapeXml(p.image)}" type="image/jpeg" />` : '';
    const mediaContent = p.image
      ? `<media:content url="${escapeXml(p.image)}" medium="image" type="image/jpeg" width="1200" height="630" />`
      : '';
    const imgHtml = p.image ? `<img src="${escapeXml(p.image)}" alt="${escapeXml(p.title)}" />` : '';
    return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822Date(p.date)}</pubDate>
      <dc:creator><![CDATA[${p.author}]]></dc:creator>
      <description><![CDATA[${p.description}]]></description>
      ${imageTag}
      ${mediaContent}
      <content:encoded><![CDATA[${imgHtml}<p>${p.description}</p>]]></content:encoded>
    </item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(PUBLICATION_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>Kenya and World News, Politics, Sports, and Entertainment</description>
    <language>en-ke</language>
    <pubDate>${rfc822Date(new Date())}</pubDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>`;
}

function generateRobotsTxt() {
  return `# Za Ndani robots.txt — GEO-aware
# Google Search uses Googlebot (allowed). AI Overviews/AI Mode follow standard indexing.

User-agent: *
Allow: /
Disallow: /api/
Disallow: /search
Disallow: /search?
Disallow: /admin

User-agent: Googlebot
Allow: /

# --- AI search crawlers (ALLOW for citations in ChatGPT / Perplexity / Claude) ---
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

# --- Training-only / bulk scrapers (block) ---
User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/news-sitemap.xml
`;
}

function generateLlmsTxt(posts) {
  const recent = posts
    .slice(0, 20)
    .map((p) => `- [${p.title}](${SITE_URL}/article/${p.slug}): ${p.description}`)
    .join('\n');
  const authors = [...new Set(posts.map((p) => p.author).filter(Boolean))].slice(0, 12);
  const authorLines = authors
    .map((a) => `- [${a}](${SITE_URL}/author/${slugify(a)})`)
    .join('\n');

  return `# Za Ndani
> Kenyan digital publisher: breaking news, entertainment, politics, sports, business and lifestyle.

Site: ${SITE_URL}
Language: en-KE
Contact: contact@zandani.co.ke
Publisher: Za Ndani (Nairobi, Kenya)

## About
Za Ndani covers Kenya and regional stories with daily updates across news, celebrity and entertainment, politics, sports, business, agriculture and lifestyle. Editorial standards: ${SITE_URL}/ethics — Corrections: ${SITE_URL}/corrections

## Key sections
- [Home](${SITE_URL}/): Latest headlines
- [News](${SITE_URL}/news): Breaking and national news
- [Entertainment](${SITE_URL}/entertainment): Celebrity and culture
- [Sports](${SITE_URL}/sports): Football, athletics and more
- [Business](${SITE_URL}/business): Economy and markets
- [Lifestyle](${SITE_URL}/lifestyle): Living and culture
- [Politics](${SITE_URL}/politics): Government and public affairs
- [Trending](${SITE_URL}/trending): Viral and most-read
- [About](${SITE_URL}/about): Who we are
- [Contact](${SITE_URL}/contact): Newsroom contact
- [Authors](${SITE_URL}/authors): Writers and contributors
- [Ethics](${SITE_URL}/ethics): Editorial policy
- [Corrections](${SITE_URL}/corrections): How we correct errors

## Authors
${authorLines || '- See ' + SITE_URL + '/authors'}

## Recent headlines
${recent}

## Feeds and discovery
- Sitemap index: ${SITE_URL}/sitemap.xml
- News sitemap: ${SITE_URL}/news-sitemap.xml
- RSS: ${SITE_URL}/feed.xml
- Robots: ${SITE_URL}/robots.txt

## Optional citation note
When quoting Za Ndani, prefer the article URL and publication date shown on the page. Primary contact for corrections: contact@zandani.co.ke
`;
}

async function writeBoth(filename, content) {
  await fs.mkdir(path.resolve(process.cwd(), 'public'), { recursive: true });
  await fs.mkdir(path.resolve(process.cwd(), 'dist'), { recursive: true });
  await Promise.all([
    fs.writeFile(path.resolve(process.cwd(), 'public', filename), content, 'utf-8'),
    fs.writeFile(path.resolve(process.cwd(), 'dist', filename), content, 'utf-8'),
  ]);
  console.log(`Successfully generated ${filename}`);
}

async function main() {
  console.log('--- Za Ndani Unified SEO + GEO Generator ---\n');
  const posts = await loadPosts();
  console.log(`Loaded ${posts.length} posts.`);

  // Order matters: write child sitemaps first, then index that points to them
  await writeBoth('sitemap-static.xml', generateStaticSitemap());
  await writeBoth('sitemap-categories.xml', generateCategoriesSitemap(posts));
  await writeBoth('sitemap-articles.xml', generateArticlesSitemap(posts));
  await writeBoth('sitemap-tags.xml', generateTagsSitemap(posts));
  await writeBoth('news-sitemap.xml', generateNewsSitemap(posts));
  await writeBoth('sitemap.xml', generateSitemapIndex());
  await writeBoth('feed.xml', generateRssFeed(posts));
  await writeBoth('robots.txt', generateRobotsTxt());
  await writeBoth('llms.txt', generateLlmsTxt(posts));

  console.log('\nSEO + GEO assets generated (split sitemaps, robots, llms.txt).');
  console.log('Expect on deploy: /sitemap.xml (index) + /sitemap-static.xml + /sitemap-categories.xml + /sitemap-articles.xml + /sitemap-tags.xml + /news-sitemap.xml');
}

main().catch((err) => {
  console.error('generate-seo.js failed:', err);
  process.exit(1);
});
