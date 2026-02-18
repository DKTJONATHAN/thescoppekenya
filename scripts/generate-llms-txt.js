#!/usr/bin/env node

/**
 * Generates llms.txt at build time with current post information
 * This helps AI crawlers understand the site content
 */

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://zandani.co.ke';

const categories = [
  { name: "News", slug: "news", description: "Breaking news and current affairs from Kenya and beyond" },
  { name: "Entertainment", slug: "entertainment", description: "Celebrity news, music, movies, and pop culture" },
  { name: "Gossip", slug: "gossip", description: "The latest celebrity gossip and relationship drama" },
  { name: "Sports", slug: "sports", description: "Football, athletics, and all things sports" },
  { name: "Business", slug: "business", description: "Economy, startups, and financial news" },
  { name: "Lifestyle", slug: "lifestyle", description: "Fashion, health, travel, and living well" },
];

async function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) return { data: {} };
  
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
    } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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
        title: data.title || file.replace('.md', ''),
        slug: data.slug || file.replace('.md', ''),
        excerpt: data.excerpt || '',
        category: data.category || 'News',
        date: data.date || new Date().toISOString().split('T')[0],
        tags: Array.isArray(data.tags) ? data.tags : []
      });
    }
  } catch (error) {
    console.error('Error reading posts:', error);
  }
  
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function generateLlmsTxt() {
  const posts = await getAllPosts();
  const today = new Date().toISOString().split('T')[0];
  const recentPosts = posts.slice(0, 20);
  const allTags = [...new Set(posts.flatMap(post => post.tags))].slice(0, 30);
  
  return `# Za Ndani - AI/LLM Information
# Generated: ${today}
# Total Articles: ${posts.length}

## About
Za Ndani is Kenya's boldest Sheng news and entertainment website. Bold, unbiased, insider content — habari kutoka ndani. We cover politics, sports, entertainment, lifestyle, and business news with a focus on East African content.

## Website
${SITE_URL}

## Content Categories
${categories.map(cat => `- ${cat.name}: ${cat.description}`).join('\n')}

## Recent Articles (Last 20)
${recentPosts.map(post => `- ${post.title} (${post.date}) - ${SITE_URL}/article/${post.slug}`).join('\n')}

## Popular Tags
${allTags.map(tag => `#${tag}`).join(', ')}

## Important URLs
- Homepage: ${SITE_URL}
- Sitemap: ${SITE_URL}/sitemap.xml
- RSS Feed: ${SITE_URL}/rss.xml
- Robots: ${SITE_URL}/robots.txt

## Contact
For inquiries: contact@zandani.co.ke

## Content Guidelines
- All content is original journalism and entertainment reporting
- Articles are written in Sheng with occasional English phrases
- Content is suitable for general audiences
- News is focused on Kenya and East Africa with global coverage

## API Access
No public API is currently available.

## Data Usage
Content from Za Ndani may be referenced and summarized by AI systems for informational purposes. Full reproduction requires permission.

## Update Frequency
- Homepage: Updated multiple times daily
- Articles: New content published daily
- This file: Regenerated on each deployment
`;
}

async function main() {
  console.log('🤖 Generating llms.txt...');
  
  const llmsTxt = await generateLlmsTxt();
  
  const publicPath = path.resolve(process.cwd(), 'public/llms.txt');
  await fs.writeFile(publicPath, llmsTxt, 'utf-8');
  console.log(`✅ Generated: ${publicPath}`);
  
  try {
    const distPath = path.resolve(process.cwd(), 'dist/llms.txt');
    await fs.writeFile(distPath, llmsTxt, 'utf-8');
    console.log(`✅ Generated: ${distPath}`);
  } catch (e) {
    // dist might not exist
  }
  
  const posts = await getAllPosts();
  console.log(`📄 llms.txt includes ${posts.length} articles`);
}

main().catch(console.error);
