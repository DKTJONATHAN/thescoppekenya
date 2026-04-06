#!/usr/bin/env node

/**
 * Generates a static sitemap.xml at build time
 * This runs after Vite build to create the sitemap with all posts
 * UPDATED: Now generates BOTH sitemap.xml AND sitemap-news.xml for entertainment niche
 */

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://zandani.co.ke';

// Entertainment-focused categories only
const categories = [
  { name: "Politics", slug: "politics" },
  { name: "News", slug: "news" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Celebrity Gossip", slug: "gossip" },
  { name: "Sports", slug: "sports" },
  { name: "Business", slug: "business" },
  { name: "Lifestyle", slug: "lifestyle" },
  { name: "Technology", slug: "technology" },
  { name: "Agriculture", slug: "agriculture" },
  { name: "Opinions", slug: "opinions" },
];

async function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) return { data: {}, content };

  const yamlContent = match[1];
  const data = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
    } else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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

      posts.push({
        slug: data.slug || file.replace('.md', ''),
        date: data.date || new Date().toISOString().split('T')[0],
        title: data.title || '',
        featured: data.featured || false,
        tags: Array.isArray(data.tags) ? data.tags : []
      });
    }
  } catch (error) {
    console.error('Error reading posts:', error);
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function generateSitemap() {
  const posts = await getAllPosts();
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'hourly', lastmod: today },
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.3', changefreq: 'monthly' },
  ];

  // Recent posts only (last 30 days)
  const recentPosts = posts.filter(post => {
    const postDate = new Date(post.date);
    return (Date.now() - postDate.getTime()) < 30 * 24 * 60 * 60 * 1000;
  });

  const postUrls = recentPosts.slice(0, 500).map(post => ({
    loc: `/article/${post.slug}`,
    lastmod: post.date,
    priority: post.featured ? '0.9' : '0.8',
    changefreq: 'daily'
  }));

  const categoryUrls = categories.map(cat => ({
    loc: `/category/${cat.slug}`,
    priority: '0.9',
    changefreq: 'daily',
    lastmod: today
  }));

  const allUrls = [...staticPages, ...postUrls, ...categoryUrls];

  const urlElements = allUrls.map(url =>
    `<url>
      <loc>${SITE_URL}${url.loc}</loc>
      ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

async function generateNewsSitemap(posts) {
  const cutoffMs = Date.now() - (48 * 60 * 60 * 1000);

  const newsPosts = posts.filter(post => {
    const postDate = new Date(post.date).getTime();
    return postDate >= cutoffMs && post.title;
  }).slice(0, 1000);

  console.log(`News sitemap: ${newsPosts.length} posts found within 48 hours`);

  const newsElements = newsPosts.map(post => {
    // FIX: Always extract YYYY-MM-DD only before appending time
    // This handles dates like "2026-03-10T20:00:00+03:00" or "2026-03-10" equally
    const dateOnly = String(post.date).substring(0, 10);
    const pubDate = new Date(dateOnly + 'T09:00:00Z').toISOString();

    const genres = ['Entertainment'];

    if (post.tags.some(t => t.toLowerCase().includes('music') || t.toLowerCase().includes('song'))) {
      genres.push('Music');
    }
    if (post.tags.some(t => t.toLowerCase().includes('gossip'))) {
      genres.push('Celebrity Gossip');
    }

    return `
  <url>
    <loc>${SITE_URL}/article/${post.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Za Ndani</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</news:title>
      <news:genres>${genres.join(',')}</news:genres>
    </news:news>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
>
${newsElements}
</urlset>`;
}

async function main() {
  console.log('Generating sitemaps...');

  const posts = await getAllPosts();

  // Generate main sitemap (unchanged from original)
  const sitemap = await generateSitemap();
  const outputPath = path.resolve(process.cwd(), 'dist/sitemap.xml');
  const publicPath = path.resolve(process.cwd(), 'public/sitemap.xml');

  try {
    await fs.writeFile(outputPath, sitemap, 'utf-8');
    console.log(`sitemap.xml written to dist/`);
  } catch (e) {
    console.log('dist/sitemap.xml skipped');
  }

  await fs.writeFile(publicPath, sitemap, 'utf-8');
  console.log(`sitemap.xml written to public/`);

  // Generate news sitemap
  const newsSitemap = await generateNewsSitemap(posts);
  const newsOutputPath = path.resolve(process.cwd(), 'dist/sitemap-news.xml');
  const newsPublicPath = path.resolve(process.cwd(), 'public/sitemap-news.xml');

  try {
    await fs.mkdir(path.dirname(newsOutputPath), { recursive: true });
    await fs.writeFile(newsOutputPath, newsSitemap, 'utf-8');
    console.log(`sitemap-news.xml written to dist/`);
  } catch (e) {
    console.log('dist/sitemap-news.xml skipped:', e.message);
  }

  await fs.mkdir(path.dirname(newsPublicPath), { recursive: true });
  await fs.writeFile(newsPublicPath, newsSitemap, 'utf-8');
  console.log(`sitemap-news.xml written to public/`);

  const recentCount = posts.filter(p => {
    const d = new Date(p.date);
    return (Date.now() - d) < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const newsCount = posts.filter(p => {
    const d = new Date(p.date);
    return (Date.now() - d) < 2 * 24 * 60 * 60 * 1000;
  }).length;

  console.log(`${posts.length} posts total, ${recentCount} recent, ${newsCount} news-ready`);
}

main().catch(console.error);