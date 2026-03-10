#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://zandani.co.ke';

const categories = [
  { name: "Entertainment", slug: "entertainment" },
  { name: "Celebrity Gossip", slug: "gossip" },
  { name: "Music", slug: "music" },
];

async function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (!match) return { data: {} };

  const data = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
    } else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data };
}

async function getAllPosts() {
  const postsDir = path.resolve(process.cwd(), 'content/posts');
  const posts = [];

  try {
    const files = await fs.readdir(postsDir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(postsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const { data } = await parseFrontmatter(content);

      let postDate = data.date || new Date().toISOString().split('T')[0];
      if (typeof postDate !== 'string') {
        postDate = new Date(postDate).toISOString().split('T')[0];
      }

      posts.push({
        slug: data.slug || file.replace('.md', ''),
        date: postDate,
        title: data.title || '',
        featured: data.featured || false,
        tags: Array.isArray(data.tags) ? data.tags : [],
      });
    }
  } catch (error) {
    console.error('âŒ Error reading posts:', error);
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function generateSitemap(posts) {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'hourly', lastmod: today },
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.3', changefreq: 'monthly' },
  ];

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const recentPosts = posts.filter(post => {
    return (Date.now() - new Date(post.date).getTime()) < thirtyDaysMs;
  });

  const postUrls = recentPosts.slice(0, 500).map(post => ({
    loc: `/article/${post.slug}`,
    lastmod: post.date,
    priority: post.featured ? '0.9' : '0.8',
    changefreq: 'daily',
  }));

  const categoryUrls = categories.map(cat => ({
    loc: `/category/${cat.slug}`,
    priority: '0.9',
    changefreq: 'daily',
    lastmod: today,
  }));

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
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

  const allUrls = [...staticPages, ...postUrls, ...categoryUrls];

  const urlElements = allUrls.map(url =>
    `  <url>
    <loc>${SITE_URL}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  ).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

  return { sitemap, sitemapIndex };
}

async function generateNewsSitemap(posts) {
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  const now = Date.now();

  const newsPosts = posts.filter(post => {
    if (!post.title) return false;
    const postTime = new Date(post.date).getTime();
    return (now - postTime) < fortyEightHoursMs;
  }).slice(0, 1000);

  console.log(`ðŸ” News sitemap: found ${newsPosts.length} posts within 48 hours`);

  if (newsPosts.length === 0) {
    console.warn('âš ï¸  No posts within 48 hours. News sitemap will be empty.');
    console.warn('    Check that post frontmatter dates use YYYY-MM-DD format and match today/yesterday.');
  }

  const newsElements = newsPosts.map(post => {
    const pubDate = new Date(post.date + 'T09:00:00Z').toISOString();

    const isOpinion = post.tags.some(t => t.toLowerCase().includes('opinion') || t.toLowerCase().includes('editorial'));
    const isBlog = post.tags.some(t => t.toLowerCase().includes('blog'));
    const genreTag = isOpinion
      ? '\n      <news:genres>Opinion</news:genres>'
      : isBlog
        ? '\n      <news:genres>Blog</news:genres>'
        : '';

    return `  <url>
    <loc>${SITE_URL}/article/${post.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Za Ndani</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</news:title>${genreTag}
    </news:news>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
>
${newsElements}
</urlset>`;
}

async function writeFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
  console.log(`âœ… Written: ${filePath}`);
}

async function main() {
  console.log('ðŸ—ºï¸  Generating sitemaps...');

  const posts = await getAllPosts();

  const { sitemap, sitemapIndex } = await generateSitemap(posts);
  const newsSitemap = await generateNewsSitemap(posts);

  await writeFile(path.resolve(process.cwd(), 'dist/sitemap.xml'), sitemap);
  await writeFile(path.resolve(process.cwd(), 'public/sitemap.xml'), sitemap);

  await writeFile(path.resolve(process.cwd(), 'dist/sitemap-news.xml'), newsSitemap);
  await writeFile(path.resolve(process.cwd(), 'public/sitemap-news.xml'), newsSitemap);

  await writeFile(path.resolve(process.cwd(), 'dist/sitemap-index.xml'), sitemapIndex);
  await writeFile(path.resolve(process.cwd(), 'public/sitemap-index.xml'), sitemapIndex);

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  const recentCount = posts.filter(p => (Date.now() - new Date(p.date).getTime()) < thirtyDaysMs).length;
  const newsCount = posts.filter(p => (Date.now() - new Date(p.date).getTime()) < fortyEightHoursMs).length;

  console.log(`ðŸ“Š ${posts.length} total posts | ${recentCount} in last 30 days | ${newsCount} in last 48 hrs (news-ready)`);
}

main().catch(console.error);