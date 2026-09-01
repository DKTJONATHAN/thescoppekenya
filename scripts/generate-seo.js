#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://zandani.co.ke';
const PUBLICATION_NAME = 'Za Ndani';
const PUBLICATION_LANGUAGE = 'en';

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
        lastmod: data.updated || data.modified || data.lastmod || data.date || new Date().toISOString(),
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

function urlBlock(loc, lastmod, changefreq = 'daily', priority = '0.7') {
  return `  <url>\n    <loc>${SITE_URL}${loc}</loc>\n    <lastmod>${toW3CDate(lastmod)}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function generateMainSitemap(posts) {
  const now = new Date().toISOString();
  const blocks = [
    urlBlock('/', now, 'hourly', '1.0'),
    urlBlock('/live', now, 'hourly', '0.8'),
    urlBlock('/trending', now, 'hourly', '0.8'),
    urlBlock('/news', now, 'hourly', '0.8'),
    urlBlock('/sports', now, 'daily', '0.7'),
    urlBlock('/entertainment', now, 'daily', '0.7'),
    urlBlock('/business', now, 'daily', '0.7'),
    urlBlock('/lifestyle', now, 'daily', '0.6'),
    urlBlock('/politics', now, 'daily', '0.7'),
    urlBlock('/about', now, 'monthly', '0.4'),
    urlBlock('/contact', now, 'monthly', '0.4'),
  ];

  const categories = [...new Set(posts.map(p => String(p.category || '').toLowerCase()).filter(Boolean))];
  for (const cat of categories) {
    blocks.push(urlBlock(`/category/${encodeURIComponent(cat)}`, now, 'daily', '0.6'));
  }

  const tags = [...new Set(posts.flatMap(p => p.tags || []).map(t => String(t).trim()).filter(Boolean))];
  for (const tag of tags) {
    blocks.push(urlBlock(`/tag/${encodeURIComponent(tag)}`, now, 'weekly', '0.4'));
  }

  for (const p of posts) {
    blocks.push(urlBlock(`/article/${encodeURIComponent(p.slug)}`, p.lastmod || p.date, 'daily', '0.8'));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join('\n')}\n</urlset>`;
}

function generateNewsSitemap(posts) {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const newsPosts = posts.filter(p => new Date(p.date).getTime() >= cutoff);
  console.log(`News sitemap contains ${newsPosts.length} posts from the last 48 hours.`);
  const blocks = newsPosts.slice(0, 1000).map(p => `  <url>
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
  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset\n  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n>\n${blocks.join('\n')}\n</urlset>`;
}

function generateRssFeed(posts) {
  const feedPosts = posts.slice(0, 100);
  const items = feedPosts.map(p => {
    const url = `${SITE_URL}/article/${escapeXml(p.slug)}`;
    const imageTag = p.image ? `<enclosure url="${escapeXml(p.image)}" type="image/jpeg" />` : '';
    const mediaContent = p.image ? `<media:content url="${escapeXml(p.image)}" medium="image" type="image/jpeg" width="1200" height="630" />` : '';
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
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /search
Disallow: /search?

User-agent: Googlebot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/news-sitemap.xml
`;
}

function generateLlmsTxt(posts) {
  const recent = posts.slice(0, 10).map(p => `- [${p.title}](${SITE_URL}/article/${p.slug}) - ${p.description}`).join('\n');
  return `# Za Ndani (zandani.co.ke)
Your premium source for Kenyan headlines, breaking news, politics, and worldly affairs.

## Recent Headlines
${recent}

## More Information
- Sitemap: ${SITE_URL}/sitemap.xml
- RSS Feed: ${SITE_URL}/feed.xml
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
  console.log('--- Za Ndani Unified SEO Generator ---\n');
  const posts = await loadPosts();
  console.log(`Loaded ${posts.length} posts.`);
  await writeBoth('sitemap.xml', generateMainSitemap(posts));
  await writeBoth('news-sitemap.xml', generateNewsSitemap(posts));
  await writeBoth('feed.xml', generateRssFeed(posts));
  await writeBoth('robots.txt', generateRobotsTxt());
  await writeBoth('llms.txt', generateLlmsTxt(posts));
  console.log('\nAll SEO files generated successfully.');
}

main().catch(console.error);
