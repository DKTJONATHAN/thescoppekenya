#!/usr/bin/env node

/**
 * Generates static sitemap.xml, sitemap-news.xml, and sitemap-index.xml at build time.
 * Runs after Vite build. Compliant with Google News Sitemap spec (updated 2025-12-10).
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://zandani.co.ke';
const PUBLICATION_NAME = 'Za Ndani';
const PUBLICATION_LANGUAGE = 'en';

const categories = [
  { name: 'Politics', slug: 'politics' },
  { name: 'News', slug: 'news' },
  { name: 'Entertainment', slug: 'entertainment' },
  { name: 'Celebrity Gossip', slug: 'gossip' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Business', slug: 'business' },
  { name: 'Lifestyle', slug: 'lifestyle' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Agriculture', slug: 'agriculture' },
  { name: 'Opinions', slug: 'opinions' },
];

// -----------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------

/**
 * Escapes XML special characters â€” handles &, <, >, ", '
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts a date string to W3C format accepted by Google News.
 * Uses YYYY-MM-DD when no time info exists (valid per spec).
 * If time info is present, emits a full ISO-8601 timestamp.
 * Google spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
function toW3CDate(dateStr) {
  const str = String(dateStr).trim();
  if (str.length > 10) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? str.substring(0, 10) : d.toISOString();
  }
  return str.substring(0, 10); // YYYY-MM-DD â€” accepted by Google
}

// -----------------------------------------------------------------------
// FRONTMATTER PARSER
// -----------------------------------------------------------------------

async function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) return { data: {} };

  const data = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if (!value) continue;

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map(item => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data };
}

// -----------------------------------------------------------------------
// POST LOADER
// -----------------------------------------------------------------------

async function getAllPosts() {
  const postsDir = path.resolve(process.cwd(), 'content/posts');

  let files;
  try {
    files = await fs.readdir(postsDir);
  } catch (error) {
    console.error('Error reading posts directory:', error.message);
    return [];
  }

  const posts = await Promise.all(
    files
      .filter(file => file.endsWith('.md'))
      .map(async file => {
        try {
          const content = await fs.readFile(path.join(postsDir, file), 'utf-8');
          const { data } = await parseFrontmatter(content);
          return {
            slug: data.slug || file.replace('.md', ''),
            date: data.date || new Date().toISOString().split('T')[0],
            title: data.title || '',
            featured: data.featured === true || data.featured === 'true',
            tags: Array.isArray(data.tags) ? data.tags : [],
            category: data.category || ''
          };
        } catch (err) {
          console.warn(`Skipping ${file}: ${err.message}`);
          return null;
        }
      })
  );

  return posts
    .filter(Boolean)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// -----------------------------------------------------------------------
// SITEMAP GENERATORS
// -----------------------------------------------------------------------

async function generateSitemap(posts) {
  const today = new Date().toISOString().split('T')[0];
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const staticPages = [
    { loc: '/',        priority: '1.0', changefreq: 'hourly',  lastmod: today },
    { loc: '/about',   priority: '0.5', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { loc: '/terms',   priority: '0.3', changefreq: 'monthly' },
  ];

  const recentPostUrls = posts
    .filter(post => new Date(String(post.date).substring(0, 10)).getTime() >= cutoff)
    .slice(0, 500)
    .map(post => ({
      loc: `/article/${post.slug}`,
      lastmod: String(post.date).substring(0, 10),
      priority: post.featured ? '0.9' : '0.8',
      changefreq: 'daily'
    }));

  const categoryUrls = categories.map(cat => ({
    loc: `/category/${cat.slug}`,
    priority: '0.9',
    changefreq: 'daily',
    lastmod: today
  }));

  const urlElements = [...staticPages, ...recentPostUrls, ...categoryUrls]
    .map(url =>
      `  <url>\n    <loc>${SITE_URL}${url.loc}</loc>${
        url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''
      }\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

/**
 * Generates a Google News sitemap.
 *
 * Key compliance notes (Google spec, last updated 2025-12-10):
 *  - Only articles published within the last 48 hours are included.
 *  - Max 1,000 <news:news> entries per file.
 *  - <news:genres> only accepts: PressRelease | Satire | Blog | OpEd | Opinion | UserGenerated
 *    "Entertainment", "Music", "Celebrity Gossip" are NOT valid values and will cause errors.
 *  - <news:publication_date> must be W3C format: YYYY-MM-DD or full ISO-8601 with TZ.
 *    Do NOT fabricate a time (e.g. T09:00:00Z) if you only have the date â€” use YYYY-MM-DD.
 */
async function generateNewsSitemap(posts) {
  const cutoffMs = Date.now() - 48 * 60 * 60 * 1000;

  const newsPosts = posts
    .filter(post => {
      const d = new Date(String(post.date).substring(0, 10)).getTime();
      return d >= cutoffMs && post.title;
    })
    .slice(0, 1000);

  console.log(`News sitemap: ${newsPosts.length} posts within last 48 hours`);

  const newsElements = newsPosts
    .map(post => {
      const pubDate = toW3CDate(post.date);

      // Derive only Google-approved genres from tags/category
      const genres = [];
      if (post.tags.some(t => /^opinion$/i.test(t)) || /^opinion/i.test(post.category)) {
        genres.push('Opinion');
      }
      if (post.tags.some(t => /^oped$|^op-ed$/i.test(t))) {
        genres.push('OpEd');
      }
      if (post.tags.some(t => /satire|parody/i.test(t))) {
        genres.push('Satire');
      }
      if (post.tags.some(t => /press.?release/i.test(t))) {
        genres.push('PressRelease');
      }
      if (post.tags.some(t => /user.?generated|ugc/i.test(t))) {
        genres.push('UserGenerated');
      }

      const genresTag = genres.length
        ? `\n      <news:genres>${genres.join(', ')}</news:genres>`
        : '';

      return `  <url>
    <loc>${SITE_URL}/article/${escapeXml(post.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${PUBLICATION_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>${genresTag}
    </news:news>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
>
${newsElements}
</urlset>`;
}

/**
 * Generates a sitemap index referencing both sitemaps.
 * Submit THIS URL to Google Search Console instead of individual sitemaps.
 */
function generateSitemapIndex() {
  const today = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-news.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}

// -----------------------------------------------------------------------
// FILE WRITER
// -----------------------------------------------------------------------

async function writeFile(filePath, content, label) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`âœ“ ${label}`);
  } catch (err) {
    console.warn(`âœ— ${label} â€” skipped: ${err.message}`);
  }
}

// -----------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------

async function main() {
  console.log('Generating sitemaps...\n');

  const posts = await getAllPosts();

  // Build all sitemap strings in parallel (posts loaded once â€” no duplicate I/O)
  const [sitemap, newsSitemap] = await Promise.all([
    generateSitemap(posts),
    generateNewsSitemap(posts),
  ]);
  const sitemapIndex = generateSitemapIndex();

  const dist   = path.resolve(process.cwd(), 'dist');
  const pub    = path.resolve(process.cwd(), 'public');

  await Promise.all([
    writeFile(path.join(dist, 'sitemap.xml'),       sitemap,       'sitemap.xml       â†’ dist/'),
    writeFile(path.join(pub,  'sitemap.xml'),        sitemap,       'sitemap.xml       â†’ public/'),
    writeFile(path.join(dist, 'sitemap-news.xml'),   newsSitemap,   'sitemap-news.xml  â†’ dist/'),
    writeFile(path.join(pub,  'sitemap-news.xml'),   newsSitemap,   'sitemap-news.xml  â†’ public/'),
    writeFile(path.join(dist, 'sitemap-index.xml'),  sitemapIndex,  'sitemap-index.xml â†’ dist/'),
    writeFile(path.join(pub,  'sitemap-index.xml'),  sitemapIndex,  'sitemap-index.xml â†’ public/'),
  ]);

  const now = Date.now();
  const d30 = now - 30 * 24 * 60 * 60 * 1000;
  const d2  = now - 48 * 60 * 60 * 1000;

  console.log(`
Summary
  Total posts  : ${posts.length}
  Last 30 days : ${posts.filter(p => new Date(String(p.date).substring(0, 10)).getTime() >= d30).length}
  Last 48 hrs  : ${posts.filter(p => new Date(String(p.date).substring(0, 10)).getTime() >= d2).length}
  `);
}

main().catch(console.error);