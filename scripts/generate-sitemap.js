#!/usr/bin/env node

/**
 * Sitemap Generator for zandani.co.ke
 * Generates:
 *   1. sitemap.xml       - static pages + posts (last 30 days) + categories
 *   2. sitemap-news.xml  - same posts wrapped in Google News tags
 *
 * Google only acts on news sitemap URLs from last 48h.
 * Including all 30-day posts ensures no article is missed on any crawl timing.
 */

import fs from 'fs/promises';
import path from 'path';

const SITE_URL     = 'https://zandani.co.ke';
const WEBSUB_HUB   = 'https://pubsubhubbub.appspot.com/';
const RSS_FEED_URL = `${SITE_URL}/rss.xml`;

// categories constant removed - now dynamically extracted from posts

// --- Frontmatter Parser ---------------------------------------------------

async function parseFrontmatter(content) {
  const match = content.match(/^---[\s\S]*?---/);
  if (!match) return { data: {} };

  const block = match[0].replace(/^---|---$/gm, '');
  const data  = {};

  for (const line of block.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key   = line.slice(0, colonIndex).trim();
    let   value = line.slice(colonIndex + 1).trim();
    if (!key) continue;

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map(v => v.trim().replace(/^"|"$|^'|'$/g, ''));
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

// --- Post Loader ----------------------------------------------------------

async function getAllPosts() {
  const postsDir = path.resolve(process.cwd(), 'content/posts');
  const posts    = [];

  try {
    const files = await fs.readdir(postsDir);

    await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async file => {
          const filePath = path.join(postsDir, file);
          const [content, stat] = await Promise.all([
            fs.readFile(filePath, 'utf-8'),
            fs.stat(filePath),
          ]);

          const { data } = await parseFrontmatter(content);

          // Build precise publishedAt:
          // - Full ISO in frontmatter  -> use directly
          // - Date-only (YYYY-MM-DD)   -> combine with file mtime for time-of-day
          // - No date at all           -> fallback to file mtime
          let publishedAt;
          if (data.date) {
            const dateStr = String(data.date);
            if (dateStr.includes('T')) {
              publishedAt = new Date(dateStr);
            } else {
              const [y, m, d] = dateStr.split('-').map(Number);
              publishedAt = new Date(
                y, m - 1, d,
                stat.mtime.getHours(),
                stat.mtime.getMinutes(),
                stat.mtime.getSeconds()
              );
            }
          } else {
            publishedAt = stat.mtime;
          }

          posts.push({
            slug       : data.slug || file.replace('.md', ''),
            date       : data.date
              ? String(data.date).split('T')[0]
              : stat.mtime.toISOString().split('T')[0],
            publishedAt,
            title      : data.title   || '',
            category   : data.category || 'News',
            featured   : data.featured === true || data.featured === 'true',
            tags       : Array.isArray(data.tags) ? data.tags : [],
          });
        })
    );
  } catch (err) {
    console.error('Error reading posts directory:', err.message);
  }

  return posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

// --- XML Helper -----------------------------------------------------------

const escapeXml = str =>
  String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g,  '&apos;');

// --- Regular Sitemap ------------------------------------------------------

function generateSitemap(posts) {
  const today    = new Date().toISOString().split('T')[0];
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const staticPages = [
    { loc: '/',        priority: '1.0', changefreq: 'hourly',  lastmod: today },
    { loc: '/news',    priority: '1.0', changefreq: 'hourly',  lastmod: today },
    { loc: '/about',   priority: '0.5', changefreq: 'monthly'                },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly'                },
    { loc: '/privacy', priority: '0.3', changefreq: 'monthly'                },
    { loc: '/terms',   priority: '0.3', changefreq: 'monthly'                },
  ];

  const postUrls = posts
    .filter(p => p.publishedAt.getTime() >= cutoff30)
    .slice(0, 500)
    .map(p => ({
      loc        : `/article/${p.slug}`,
      lastmod    : p.date,
      priority   : p.featured ? '0.9' : '0.8',
      changefreq : 'daily',
    }));

  const uniqueCategories = Array.from(new Set(posts.map(p => p.category.toLowerCase())));
  const categoryUrls = uniqueCategories.map(catSlug => ({
    loc        : `/category/${catSlug}`,
    priority   : '0.9',
    changefreq : 'daily',
    lastmod    : today,
  }));

  const allUrls = [...staticPages, ...postUrls, ...categoryUrls];

  const urlElements = allUrls.map(u => [
    '  <url>',
    `    <loc>${SITE_URL}${u.loc}</loc>`,
    u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
    `    <changefreq>${u.changefreq}</changefreq>`,
    `    <priority>${u.priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n')).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlElements,
    '</urlset>',
  ].join('\n');
}

// --- Google News Sitemap --------------------------------------------------
// Mirrors all posts from sitemap.xml wrapped in <news:news> tags.
// Required tags only: name, language, publication_date, title.
// news:genres is deprecated -- omitted.

function generateNewsSitemap(posts) {
  // Google News requirements: Only articles from the last 48 hours.
  const cutoff48 = Date.now() - 48 * 60 * 60 * 1000;

  const newsPosts = posts
    .filter(p => p.publishedAt.getTime() >= cutoff48 && p.title)
    .slice(0, 1000);

  console.log(`News sitemap: ${newsPosts.length} posts (last 48 hours)`);

  const newsElements = newsPosts.map(p => [
    '  <url>',
    `    <loc>${SITE_URL}/article/${p.slug}</loc>`,
    '    <news:news>',
    '      <news:publication>',
    '        <news:name>Za Ndani</news:name>',
    '        <news:language>en</news:language>',
    '      </news:publication>',
    `      <news:publication_date>${p.publishedAt.toISOString()}</news:publication_date>`,
    `      <news:title>${escapeXml(p.title)}</news:title>`,
    '    </news:news>',
    '  </url>',
  ].join('\n')).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset',
    '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
    newsElements,
    '</urlset>',
  ].join('\n');
}

// --- WebSub Hub Ping ------------------------------------------------------

async function pingWebSubHub() {
  try {
    const body = new URLSearchParams({
      'hub.mode' : 'publish',
      'hub.url'  : RSS_FEED_URL,
    });

    const res = await fetch(WEBSUB_HUB, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
      body    : body.toString(),
    });

    if (res.status === 204) {
      console.log('WebSub hub pinged -- Google News notified');
    } else {
      console.warn(`WebSub ping returned ${res.status} (non-critical)`);
    }
  } catch (err) {
    console.warn('WebSub ping failed (non-critical):', err.message);
  }
}

// --- File Writer ----------------------------------------------------------

async function writeToPath(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
  console.log(`  Written -> ${filePath}`);
}

// --- Main -----------------------------------------------------------------

async function main() {
  console.log('Generating sitemaps...');

  const posts       = await getAllPosts();
  const sitemap     = generateSitemap(posts);
  const newsSitemap = generateNewsSitemap(posts);

  const publicDir = path.resolve(process.cwd(), 'public');
  const distDir   = path.resolve(process.cwd(), 'dist');

  console.log('Writing to public/:');
  await Promise.all([
    writeToPath(path.join(publicDir, 'sitemap.xml'),      sitemap),
    writeToPath(path.join(publicDir, 'sitemap-news.xml'), newsSitemap),
  ]);

  try {
    await fs.access(distDir);
    console.log('Writing to dist/:');
    await Promise.all([
      writeToPath(path.join(distDir, 'sitemap.xml'),      sitemap),
      writeToPath(path.join(distDir, 'sitemap-news.xml'), newsSitemap),
    ]);
  } catch {
    console.log('dist/ not found -- skipping (run after vite build for dist writes)');
  }

  console.log('Pinging WebSub hub...');
  await pingWebSubHub();

  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const cutoff48 = Date.now() - 48 * 60 * 60 * 1000;

  console.log('Summary:');
  console.log(`  Total posts                  : ${posts.length}`);
  console.log(`  In sitemap.xml      (30d)    : ${posts.filter(p => p.publishedAt.getTime() >= cutoff30).length}`);
  console.log(`  In sitemap-news.xml (30d)    : ${posts.filter(p => p.publishedAt.getTime() >= cutoff30 && p.title).length}`);
  console.log(`  Google News eligible (48h)   : ${posts.filter(p => p.publishedAt.getTime() >= cutoff48 && p.title).length}`);
  console.log('Done.');
}

main().catch(console.error);