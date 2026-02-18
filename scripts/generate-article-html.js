#!/usr/bin/env node

/**
 * Generates prerendered HTML files for each article at dist/article/{slug}/index.html
 * These files contain correct OG meta tags so social media bots can read them.
 * Runs AFTER vite build since it writes into the dist folder.
 */

import fs from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://zandani.co.ke';

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
    } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { data, content: match[2] };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
        image: data.image || `${SITE_URL}/logo.png`,
        category: data.category || 'News',
        author: data.author || 'Za Ndani',
        date: data.date || new Date().toISOString().split('T')[0],
        tags: Array.isArray(data.tags) ? data.tags : [],
      });
    }
  } catch (error) {
    console.error('Error reading posts:', error);
  }

  return posts;
}

async function getDistIndexHtml() {
  const distIndex = path.resolve(process.cwd(), 'dist/index.html');
  try {
    return await fs.readFile(distIndex, 'utf-8');
  } catch {
    console.error('dist/index.html not found. Run vite build first.');
    process.exit(1);
  }
}

function generateArticleHtml(baseHtml, post) {
  const title = escapeHtml(`${post.title} | Za Ndani`);
  const description = escapeHtml(post.excerpt || post.title);
  const image = post.image;
  const url = `${SITE_URL}/article/${post.slug}`;
  const author = escapeHtml(post.author);

  const articleSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image,
    "datePublished": post.date,
    "author": { "@type": "Person", "name": post.author },
    "publisher": {
      "@type": "Organization",
      "name": "Za Ndani",
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.png` }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url }
  });

  const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": post.category, "item": `${SITE_URL}/category/${post.category.toLowerCase()}` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": url }
    ]
  });

  // Replace the <head> content with article-specific meta tags
  let html = baseHtml;

  // Replace title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${description}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${url}" />`
  );

  // Replace OG tags
  html = html.replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="article" />`);
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}" />`);

  // Replace Twitter tags
  html = html.replace(/<meta name="twitter:url"[^>]*>/, `<meta name="twitter:url" content="${url}" />`);
  html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}" />`);

  // Add article-specific OG tags and structured data before </head>
  const extraMeta = `
    <meta property="article:published_time" content="${post.date}" />
    <meta property="article:section" content="${escapeHtml(post.category)}" />
    <meta property="article:author" content="${author}" />
    <script type="application/ld+json">${articleSchema}</script>
    <script type="application/ld+json">${breadcrumbSchema}</script>
  `;

  // Remove existing structured data script from base HTML to avoid duplicates
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');

  html = html.replace('</head>', `${extraMeta}\n</head>`);

  return html;
}

async function main() {
  console.log('📄 Generating prerendered article HTML files...');

  const [posts, baseHtml] = await Promise.all([getAllPosts(), getDistIndexHtml()]);

  let count = 0;
  for (const post of posts) {
    const articleDir = path.resolve(process.cwd(), `dist/article/${post.slug}`);
    await fs.mkdir(articleDir, { recursive: true });

    const html = generateArticleHtml(baseHtml, post);
    await fs.writeFile(path.join(articleDir, 'index.html'), html, 'utf-8');
    count++;
  }

  console.log(`✅ Generated ${count} prerendered article pages`);
}

main().catch(console.error);
