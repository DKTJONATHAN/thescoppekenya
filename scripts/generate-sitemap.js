#!/usr/bin/env node

/**
 * Generates static sitemap.xml AND sitemap-news.xml at build time
 * Optimized for zandani.co.ke entertainment site - focuses on entertainment niche
 * Runs after Vite build to create sitemaps with all posts
 */

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://zandani.co.ke';

// âœ… Entertainment-focused categories (removed generic ones)
const categories = [
  { name: "Entertainment", slug: "entertainment" },
  { name: "Celebrity Gossip", slug: "celebrity-gossip" },
  { name: "Music", slug: "music" },
  { name: "TV & Film", slug: "tv-film" },
  { name: "Socialites", slug: "socialites" },
  // Removed News, Sports, Business, Lifestyle - focus on niche
];

async function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) return { data: {}, content: content };

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

      // âœ… Skip posts older than 1 year for main sitemap (focus on fresh content)
      const postDate = data.date ? new Date(data.date) : new Date();
      if ((Date.now() - postDate.getTime()) > 365 * 24 * 60 * 60 * 1000) continue;

      posts.push({
        slug: data.slug || file.replace('.md', ''),
        date: data.date || new Date().toISOString().split('T')[0],
        title: data.title || '',
        featured: data.featured || false,
        tags: Array.isArray(data.tags) ? data.tags : [],
        category: data.category || 'entertainment'
      });
    }
  } catch (error) {
    console.error('Error reading posts:', error);
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function generateMainSitemap(posts) {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'hourly', lastmod: today },
    { loc: '/author/jonathan-mwaniki', priority: '0.7', changefreq: 'monthly', lastmod: today },
    { loc: '/search', priority: '0.6', changefreq: 'daily', lastmod: today },
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.3', changefreq: 'monthly' },
  ];

  const categoryUrls = categories.map(cat => ({
    loc: `/category/${cat.slug}`,
    priority: '0.9',
    changefreq: 'daily',
    lastmod: today
  }));

  // âœ… Only include recent, high-quality posts (last 30 days, featured first)
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

  const allUrls = [...staticPages, ...categoryUrls, ...postUrls];

  const urlElements = allUrls.map(url => `
  <url>
    <loc>${SITE_URL}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

async function generateNewsSitemap(posts) {
  // âœ… News sitemap: ONLY posts from last 48 hours, max 1000 URLs
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);

  const newsPosts = posts.filter(post => {
    const postDate = new Date(post.date);
    return postDate >= cutoff && post.title; // Must have title
  }).slice(0, 1000);

  const newsElements = newsPosts.map(post => {
    const pubDate = new Date(post.date + 'T20:00:00+03:00').toISOString(); // EAT timezone
    const genres = ['Entertainment'];
    if (post.tags.includes('music') || post.tags.includes('song')) genres.push('Music');
    if (post.tags.includes('gossip') || post.category === 'celebrity-gossip') genres.push('Celebrity Gossip');

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
  console.log('ðŸ—ºï¸  Generating sitemaps for Za Ndani entertainment site...');

  const posts = await getAllPosts();

  // Generate main sitemap
  const mainSitemap = await generateMainSitemap(posts);
  const outputMain = path.resolve(process.cwd(), 'dist/sitemap.xml');
  const publicMain = path.resolve(process.cwd(), 'public/sitemap.xml');

  try {
    await fs.writeFile(outputMain, mainSitemap, 'utf-8');
    console.log(`âœ… Main sitemap: ${outputMain}`);
  } catch (e) {
    console.log('âš ï¸  dist/sitemap.xml skipped (no dist folder)');
  }
  await fs.writeFile(publicMain, mainSitemap, 'utf-8');
  console.log(`âœ… Main sitemap: ${publicMain}`);

  // Generate News sitemap
  const newsSitemap = await generateNewsSitemap(posts);
  const outputNews = path.resolve(process.cwd(), 'dist/sitemap-news.xml');
  const publicNews = path.resolve(process.cwd(), 'public/sitemap-news.xml');

  try {
    await fs.writeFile(outputNews, newsSitemap, 'utf-8');
    console.log(`âœ… News sitemap: ${outputNews}`);
  } catch (e) {
    console.log('âš ï¸  dist/sitemap-news.xml skipped (no dist folder)');
  }
  await fs.writeFile(publicNews, newsSitemap, 'utf-8');
  console.log(`âœ… News sitemap: ${publicNews}`);

  console.log(`ðŸ“Š Stats: ${posts.length} total posts, ${newsSitemap.includes('<url>') ? 'âœ“' : 'âœ—'} news articles (last 48h)`);
}

main().catch(console.error);