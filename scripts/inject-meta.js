import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '../dist');
const postsDir = path.join(__dirname, '../content/posts');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error("No index.html found in dist. Make sure to run 'vite build' first.");
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

// Ensure dist/article directory exists
const articleDistDir = path.join(distDir, 'article');
if (!fs.existsSync(articleDistDir)) {
  fs.mkdirSync(articleDistDir, { recursive: true });
}

// Read all posts
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');

  // Extract frontmatter
  const titleMatch = content.match(/^title:\s*(.+)$/m);
  const descMatch = content.match(/^excerpt:\s*(.+)$/m);
  const imageMatch = content.match(/^image:\s*(.+)$/m);
  const slugMatch = content.match(/^slug:\s*(.+)$/m);

  let title = titleMatch ? titleMatch[1].replace(/^["']|["']$/g, '').trim() : 'Za Ndani';
  let desc = descMatch ? descMatch[1].replace(/^["']|["']$/g, '').trim() : 'Breaking Kenyan news and gossip.';
  let image = imageMatch ? imageMatch[1].replace(/^["']|["']$/g, '').trim() : 'https://zandani.co.ke/images/default-og.jpg';
  const slug = slugMatch ? slugMatch[1].replace(/^["']|["']$/g, '').trim() : file.replace('.md', '');

  // Escape special characters for HTML to prevent rendering issues
  title = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  desc = desc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Format absolute image URL through proxy for OG
  if (image.startsWith('/')) {
    image = `https://zandani.co.ke${image}`;
  } else if (image && image !== 'https://zandani.co.ke/images/default-og.jpg') {
    image = `https://wsrv.nl/?url=${encodeURIComponent(image.replace(/^https?:\/\//, ''))}&w=1200&h=630&fit=cover&output=webp&q=85`;
  }

  // Inject meta tags into the head
  const metaTags = `
    <title>${title} | Za Ndani</title>
    <meta name="description" content="${desc}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:image" content="${image}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://zandani.co.ke/article/${slug}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${image}">
  `;

  // 1. Remove existing title
  let postHtml = baseHtml.replace(/<title>.*?<\/title>/ig, '');

  // 2. Remove ANY existing meta tags for description, og:, or twitter:
  postHtml = postHtml.replace(/<meta[^>]*name=["']description["'][^>]*>/ig, '');
  postHtml = postHtml.replace(/<meta[^>]*property=["']og:[^>]*>/ig, '');
  postHtml = postHtml.replace(/<meta[^>]*name=["']twitter:[^>]*>/ig, '');

  // 3. Inject the specific post meta tags right after <head>
  postHtml = postHtml.replace(/<head>/i, `<head>\n${metaTags}`);

  // Save the specific HTML file
  const postDir = path.join(articleDistDir, slug);
  if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true });
  }

  fs.writeFileSync(path.join(postDir, 'index.html'), postHtml);
});

console.log(`Successfully generated SEO meta tags for ${files.length} articles!`);
