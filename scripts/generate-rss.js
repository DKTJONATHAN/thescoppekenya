#!/usr/bin/env node

/**
 * Generates RSS feed (rss.xml) at build time
 * Compatible with all major RSS readers
 */

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://thescoopkenya.co.ke';
const SITE_TITLE = 'The Scoop Kenya';
const SITE_DESCRIPTION = "Kenya's leading source for breaking news, entertainment updates, celebrity gossip, and trending stories.";

async function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) return { data: {}, content: '' };
  
  const yamlContent = match[1];
  const bodyContent = match[2];
  const data = {};
  const lines = yamlContent.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
    } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    data[key] = value;
  }
  
  return { data, content: bodyContent };
}

function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRssDate(dateStr) {
  const date = new Date(dateStr);
  return date.toUTCString();
}

async function getAllPosts() {
  const postsDir = path.resolve(process.cwd(), 'content/posts');
  const posts = [];
  
  try {
    const files = await fs.readdir(postsDir);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const filePath = path.join(postsDir, file);
      const rawContent = await fs.readFile(filePath, 'utf-8');
      const { data, content } = await parseFrontmatter(rawContent);
      
      posts.push({
        title: data.title || file.replace('.md', ''),
        slug: data.slug || file.replace('.md', ''),
        excerpt: data.excerpt || '',
        category: data.category || 'News',
        author: data.author || 'The Scoop Kenya',
        date: data.date || new Date().toISOString().split('T')[0],
        image: data.image || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        content: content.slice(0, 500) // First 500 chars for description
      });
    }
  } catch (error) {
    console.error('Error reading posts:', error);
  }
  
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function generateRssFeed() {
  const posts = await getAllPosts();
  const latestPosts = posts.slice(0, 50); // Last 50 posts in RSS
  const buildDate = new Date().toUTCString();
  
  const items = latestPosts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/article/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/article/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || post.content.replace(/[#*`_\[\]]/g, '').trim())}</description>
      <author>contact@thescoopkenya.co.ke (${escapeXml(post.author)})</author>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${formatRssDate(post.date)}</pubDate>
      ${post.image ? `<enclosure url="${escapeXml(post.image)}" type="image/jpeg" />` : ''}
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-ke</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${SITE_URL}</link>
    </image>
    <copyright>© ${new Date().getFullYear()} The Scoop Kenya. All rights reserved.</copyright>
    <managingEditor>contact@thescoopkenya.co.ke (The Scoop Kenya)</managingEditor>
    <webMaster>contact@thescoopkenya.co.ke (The Scoop Kenya)</webMaster>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;
}

async function main() {
  console.log('📰 Generating RSS feed...');
  
  const rssFeed = await generateRssFeed();
  
  const publicPath = path.resolve(process.cwd(), 'public/rss.xml');
  await fs.writeFile(publicPath, rssFeed, 'utf-8');
  console.log(`✅ Generated: ${publicPath}`);
  
  try {
    const distPath = path.resolve(process.cwd(), 'dist/rss.xml');
    await fs.writeFile(distPath, rssFeed, 'utf-8');
    console.log(`✅ Generated: ${distPath}`);
  } catch (e) {
    // dist might not exist
  }
  
  const posts = await getAllPosts();
  console.log(`📄 RSS feed includes ${Math.min(posts.length, 50)} of ${posts.length} articles`);
}

main().catch(console.error);
