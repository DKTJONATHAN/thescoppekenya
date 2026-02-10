#!/usr/bin/env node

/**
 * Generates a static sitemap.xml at build time
 * This runs after Vite build to create the sitemap with all posts
 */

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://thescoopkenya.vercel.app';

const categories = [
  { name: "News", slug: "news" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Gossip", slug: "gossip" },
  { name: "Sports", slug: "sports" },
  { name: "Business", slug: "business" },
  { name: "Lifestyle", slug: "lifestyle" },
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
    { loc: '/sports', priority: '0.8', changefreq: 'daily', lastmod: today },
    { loc: '/live-scores', priority: '0.7', changefreq: 'hourly', lastmod: today },
  ];

  const postUrls = posts.map(post => ({
    loc: `/article/${post.slug}`,
    lastmod: post.date,
    priority: post.featured ? '0.9' : '0.8',
    changefreq: 'weekly'
  }));

  const categoryUrls = categories.map(cat => ({
    loc: `/category/${cat.slug}`,
    priority: '0.7',
    changefreq: 'daily',
    lastmod: today
  }));

  const allTags = [...new Set(posts.flatMap(post => post.tags))];
  const tagUrls = allTags.map(tag => ({
    loc: `/tag/${encodeURIComponent(tag)}`,
    priority: '0.5',
    changefreq: 'weekly'
  }));

  const allUrls = [...staticPages, ...postUrls, ...categoryUrls, ...tagUrls];

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

async function main() {
  console.log('🗺️  Generating sitemap.xml...');
  
  const sitemap = await generateSitemap();
  const outputPath = path.resolve(process.cwd(), 'dist/sitemap.xml');
  
  // Also update public folder for dev
  const publicPath = path.resolve(process.cwd(), 'public/sitemap.xml');
  
  try {
    await fs.writeFile(outputPath, sitemap, 'utf-8');
    console.log(`✅ Generated: ${outputPath}`);
  } catch (e) {
    // dist might not exist during dev
    console.log('⚠️  dist/sitemap.xml skipped (no dist folder)');
  }
  
  await fs.writeFile(publicPath, sitemap, 'utf-8');
  console.log(`✅ Generated: ${publicPath}`);
  
  const posts = await getAllPosts();
  console.log(`📄 Sitemap includes ${posts.length} posts, ${categories.length} categories`);
}

main().catch(console.error);
