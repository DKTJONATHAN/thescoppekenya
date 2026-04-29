#!/usr/bin/env node

/**
 * generate-sitemap.mjs â€” Zandani.co.ke
 *
 * Captures ALL website URLs: articles, pages, categories, tags, authors, archives.
 * Supports unlimited posts (1M+) by auto-splitting into â‰¤49,000 URL chunks per file.
 * Generates:
 *   sitemap-index.xml         â€” master index (submit this to Google Search Console)
 *   sitemap-pages.xml         â€” static pages, categories, tags, authors, archives
 *   sitemap-posts-001.xml     â€” all articles, auto-numbered if > 49,000
 *   sitemap-news.xml          â€” Google News (last 48 hrs only, submit separately in GSC)
 *
 * Spec refs:
 *   https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 *   https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 *   https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps
 */

import fs from 'fs/promises';
import path from 'path';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CONFIG
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SITE_URL            = 'https://zandani.co.ke';
const PUBLICATION_NAME    = 'Za Ndani';
const PUBLICATION_LANGUAGE = 'en';
const MAX_URLS_PER_FILE   = 49_000;   // Safe below Google's hard limit of 50,000
const FILE_READ_BATCH     = 200;      // Concurrent file reads â€” avoids OS fd limits

const STATIC_PAGES = [
  { loc: '/',          priority: '1.0', changefreq: 'hourly'  },
  { loc: '/about',     priority: '0.5', changefreq: 'monthly' },
  { loc: '/contact',   priority: '0.5', changefreq: 'monthly' },
  { loc: '/privacy',   priority: '0.3', changefreq: 'monthly' },
  { loc: '/terms',     priority: '0.3', changefreq: 'monthly' },
  { loc: '/search',    priority: '0.4', changefreq: 'monthly' },
  { loc: '/archive',   priority: '0.6', changefreq: 'daily'   },
];

const CATEGORIES = [
  { slug: 'politics'      },
  { slug: 'news'          },
  { slug: 'entertainment' },
  { slug: 'gossip'        },
  { slug: 'sports'        },
  { slug: 'business'      },
  { slug: 'lifestyle'     },
  { slug: 'technology'    },
  { slug: 'agriculture'   },
  { slug: 'opinions'      },
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function escapeXml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

/**
 * Returns a W3C-compliant date string.
 * Uses YYYY-MM-DD when no time info exists (valid per Google spec).
 * Uses full ISO-8601 when time info is present.
 */
function toW3CDate(dateStr) {
  const str = String(dateStr).trim();
  if (str.length > 10) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? str.substring(0, 10) : d.toISOString();
  }
  return str.substring(0, 10);
}

function dateOnly(dateStr) {
  return String(dateStr).substring(0, 10);
}

/** Splits any array into chunks of max `size` items */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function urlBlock(loc, lastmod, changefreq, priority) {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>
    <loc>${SITE_URL}${escapeXml(loc)}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function wrapUrlset(blocks) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blocks.join('\n')}
</urlset>`;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FRONTMATTER PARSER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return {};

  const data = {};
  for (const line of match[1].split('\n')) {
    const col = line.indexOf(':');
    if (col === -1) continue;

    const key = line.slice(0, col).trim();
    let val   = line.slice(col + 1).trim();
    if (!val) continue;

    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1)
        .split(',')
        .map(v => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (val === 'true')  { val = true;  }
    else if (val === 'false') { val = false; }
    else if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) { val = val.slice(1, -1); }

    data[key] = val;
  }
  return data;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST LOADER  â€” batched parallel reads, no limit
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function getAllPosts() {
  const postsDir = path.resolve(process.cwd(), 'content/posts');

  let files;
  try {
    files = await fs.readdir(postsDir);
  } catch (err) {
    console.error(`Cannot read posts directory: ${err.message}`);
    return [];
  }

  const mdFiles = files.filter(f => f.endsWith('.md'));
  console.log(`Found ${mdFiles.length.toLocaleString()} markdown files...`);

  const posts = [];

  for (let i = 0; i < mdFiles.length; i += FILE_READ_BATCH) {
    const batch = mdFiles.slice(i, i + FILE_READ_BATCH);

    const results = await Promise.all(
      batch.map(async file => {
        try {
          const raw  = await fs.readFile(path.join(postsDir, file), 'utf-8');
          const data = parseFrontmatter(raw);
          return {
            slug:     data.slug     || file.replace('.md', ''),
            date:     data.date     || new Date().toISOString().split('T')[0],
            title:    data.title    || '',
            featured: data.featured === true || data.featured === 'true',
            tags:     Array.isArray(data.tags)   ? data.tags   : [],
            author:   data.author   || data.author_slug || '',
            category: data.category || '',
          };
        } catch (err) {
          console.warn(`  Skipping ${file}: ${err.message}`);
          return null;
        }
      })
    );

    posts.push(...results.filter(Boolean));

    if (i > 0 && i % 10_000 === 0) {
      process.stdout.write(`  Loaded ${i.toLocaleString()} / ${mdFiles.length.toLocaleString()} posts...\r`);
    }
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// URL EXTRACTORS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function extractTags(posts) {
  const seen = new Set();
  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = tag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (slug) seen.add(slug);
    }
  }
  return [...seen];
}

function extractAuthors(posts) {
  const seen = new Set();
  for (const post of posts) {
    if (post.author) {
      const slug = post.author.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (slug) seen.add(slug);
    }
  }
  return [...seen];
}

/** Generates /archive/YYYY and /archive/YYYY/MM pages from actual post dates */
function buildArchiveBlocks(posts, today) {
  const years  = new Set();
  const months = new Set();

  for (const post of posts) {
    const [y, m] = dateOnly(post.date).split('-');
    if (y) years.add(y);
    if (y && m) months.add(`${y}/${m}`);
  }

  return [
    ...[...years ].sort().reverse().map(y  => urlBlock(`/archive/${y}`,  today, 'monthly', '0.5')),
    ...[...months].sort().reverse().map(ym => urlBlock(`/archive/${ym}`, today, 'monthly', '0.4')),
  ];
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SITEMAP BUILDERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Pages sitemap â€” static, categories, tags, authors, archives.
 * Returns array of XML strings (auto-split if somehow > 49k entries).
 */
function buildPagesSitemaps(posts, today) {
  const tags    = extractTags(posts);
  const authors = extractAuthors(posts);

  const blocks = [
    ...STATIC_PAGES.map(p => urlBlock(p.loc,                  today, p.changefreq, p.priority)),
    ...CATEGORIES  .map(c => urlBlock(`/category/${c.slug}`,  today, 'hourly',  '0.9')),
    ...tags        .map(t => urlBlock(`/tag/${t}`,            today, 'daily',   '0.6')),
    ...authors     .map(a => urlBlock(`/author/${a}`,         today, 'daily',   '0.7')),
    ...buildArchiveBlocks(posts, today),
  ];

  return chunk(blocks, MAX_URLS_PER_FILE).map(ch => wrapUrlset(ch));
}

/**
 * Post sitemaps â€” ALL posts, no date filter, auto-chunked at MAX_URLS_PER_FILE.
 * Returns array of XML strings.
 */
function buildPostSitemaps(posts) {
  const blocks = posts.map(post =>
    urlBlock(
      `/article/${post.slug}`,
      dateOnly(post.date),
      'daily',
      post.featured ? '0.9' : '0.8'
    )
  );
  return chunk(blocks, MAX_URLS_PER_FILE).map(ch => wrapUrlset(ch));
}

/**
 * Google News sitemap â€” last 48 hours only, max 1,000 entries.
 * Only uses Google-approved news:genres values:
 *   PressRelease | Satire | Blog | OpEd | Opinion | UserGenerated
 * "Entertainment", "Music", "Celebrity Gossip" are NOT valid â€” removed.
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
function buildNewsSitemap(posts) {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  const newsPosts = posts
    .filter(p => new Date(dateOnly(p.date)).getTime() >= cutoff && p.title)
    .slice(0, 1000);

  console.log(`News sitemap: ${newsPosts.length} posts within 48 hours`);

  const blocks = newsPosts.map(post => {
    const genres = [];
    if (/^opinion/i.test(post.category) || post.tags.some(t => /^opinion$/i.test(t))) genres.push('Opinion');
    if (post.tags.some(t => /^oped$|^op-ed$/i.test(t)))  genres.push('OpEd');
    if (post.tags.some(t => /satire|parody/i.test(t)))   genres.push('Satire');
    if (post.tags.some(t => /press.?release/i.test(t)))  genres.push('PressRelease');
    if (post.tags.some(t => /ugc|user.?gen/i.test(t)))   genres.push('UserGenerated');

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
      <news:publication_date>${toW3CDate(post.date)}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>${genresTag}
    </news:news>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
>
${blocks.join('\n')}
</urlset>`;
}

/**
 * Sitemap index â€” master file pointing to all non-news sitemaps.
 * The news sitemap is intentionally excluded here; submit it separately
 * in Google Search Console for proper News tracking.
 * A sitemap index can reference up to 50,000 child sitemaps (â‰ˆ2.5B URLs total).
 */
function buildSitemapIndex(sitemapNames, today) {
  const entries = sitemapNames
    .map(name =>
      `  <sitemap>\n    <loc>${SITE_URL}/${name}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FILE WRITER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function writeFile(filePath, content, label) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    const kb = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1);
    console.log(`  âœ“ ${label.padEnd(48)} ${kb.padStart(9)} KB`);
  } catch (err) {
    console.warn(`  âœ— ${label} â€” skipped: ${err.message}`);
  }
}

async function writeBoth(filename, content) {
  await Promise.all([
    writeFile(path.resolve(process.cwd(), 'dist',   filename), content, `${filename} â†’ dist/`),
    writeFile(path.resolve(process.cwd(), 'public', filename), content, `${filename} â†’ public/`),
  ]);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function main() {
  const LINE = 'â”'.repeat(62);
  console.log(`${LINE}\n  Zandani Sitemap Generator â€” ${new Date().toISOString()}\n${LINE}\n`);

  const posts = await getAllPosts();
  const today = new Date().toISOString().split('T')[0];

  console.log(`\nBuilding sitemaps for ${posts.length.toLocaleString()} posts...\n`);

  // Build all sitemap XML strings (posts loaded once â€” no duplicate I/O)
  const pagesSitemaps = buildPagesSitemaps(posts, today);
  const postsSitemaps = buildPostSitemaps(posts);
  const newsSitemap   = buildNewsSitemap(posts);

  // â”€â”€ Assign filenames â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const allFiles = [];

  pagesSitemaps.forEach((xml, i) => {
    const name = pagesSitemaps.length === 1
      ? 'sitemap-pages.xml'
      : `sitemap-pages-${String(i + 1).padStart(3, '0')}.xml`;
    allFiles.push({ name, xml });
  });

  postsSitemaps.forEach((xml, i) => {
    const name = postsSitemaps.length === 1
      ? 'sitemap-posts.xml'
      : `sitemap-posts-${String(i + 1).padStart(3, '0')}.xml`;
    allFiles.push({ name, xml });
  });

  // News sitemap excluded from index â€” must be submitted separately in GSC
  allFiles.push({ name: 'sitemap-news.xml', xml: newsSitemap, newsOnly: true });

  // Sitemap index references all files except the news-only sitemap
  const indexedNames  = allFiles.filter(f => !f.newsOnly).map(f => f.name);
  const sitemapIndex  = buildSitemapIndex(indexedNames, today);

  // â”€â”€ Write files â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  console.log('Writing files...\n');
  await Promise.all([
    writeBoth('sitemap-index.xml', sitemapIndex),
    ...allFiles.map(f => writeBoth(f.name, f.xml)),
  ]);

  // â”€â”€ Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const now      = Date.now();
  const tags     = extractTags(posts);
  const authors  = extractAuthors(posts);
  const newsReady = posts.filter(p => new Date(dateOnly(p.date)).getTime() >= now - 48 * 60 * 60 * 1000).length;
  const totalUrls = posts.length + STATIC_PAGES.length + CATEGORIES.length + tags.length + authors.length;

  console.log(`
${LINE}
  Summary
  Posts              : ${posts.length.toLocaleString()}
  Unique tags        : ${tags.length.toLocaleString()}
  Unique authors     : ${authors.length.toLocaleString()}
  News-ready (48h)   : ${newsReady.toLocaleString()}
  Post sitemap files : ${postsSitemaps.length} Ã— â‰¤ ${MAX_URLS_PER_FILE.toLocaleString()} URLs
  Total URLs (approx): ${totalUrls.toLocaleString()}

  Submit to Google Search Console:
    â–º ${SITE_URL}/sitemap-index.xml   (main â€” all content)
    â–º ${SITE_URL}/sitemap-news.xml    (news â€” submit separately)
${LINE}
`);
}

main().catch(console.error);