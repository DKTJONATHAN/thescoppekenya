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

const articleDistDir = path.join(distDir, 'article');
if (!fs.existsSync(articleDistDir)) {
  fs.mkdirSync(articleDistDir, { recursive: true });
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');

  // Extract frontmatter
  const titleMatch = content.match(/^title:\s*(.+)$/im);
  const descMatch = content.match(/^(?:excerpt|description):\s*(.+)$/im);
  const imageMatch = content.match(/^image:\s*(.+)$/im);
  const slugMatch = content.match(/^slug:\s*(.+)$/im);

  let title = titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, '').trim() : 'Za Ndani';
  let image = imageMatch ? imageMatch[1].trim().replace(/^["']|["']$/g, '').trim() : 'https://zandani.co.ke/images/default-og.jpg';
  const slug = slugMatch ? slugMatch[1].trim().replace(/^["']|["']$/g, '').trim() : file.replace('.md', '');

  let desc = '';
  if (descMatch) {
    desc = descMatch[1].trim().replace(/^["']|["']$/g, '').trim();
  } else {
    // Ultimate fallback: generate description from the markdown body
    const body = content.replace(/^---[\s\S]*?---/, '').trim();
    // Strip markdown characters and URLs
    let plainText = body
      .replace(/[#*`_\[\]()]/g, '')
      .replace(/http[^\s]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    desc = plainText.substring(0, 160);
    if (plainText.length > 160) desc += '...';
    if (!desc) desc = 'Breaking Kenyan news and gossip.';
  }

  // Escape special characters for HTML
  title = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  desc = desc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  if (image.startsWith('/')) {
    image = `https://zandani.co.ke${image}`;
  } else if (image && image !== 'https://zandani.co.ke/images/default-og.jpg') {
    image = `https://wsrv.nl/?url=${encodeURIComponent(image.replace(/^https?:\/\//, ''))}&w=1200&h=630&fit=cover&output=webp&q=85`;
  }

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

  let postHtml = baseHtml.replace(/<title>.*?<\/title>/ig, '');
  postHtml = postHtml.replace(/<meta[^>]*name=["']description["'][^>]*>/ig, '');
  postHtml = postHtml.replace(/<meta[^>]*property=["']og:[^>]*>/ig, '');
  postHtml = postHtml.replace(/<meta[^>]*name=["']twitter:[^>]*>/ig, '');

  postHtml = postHtml.replace(/<head>/i, `<head>\n${metaTags}`);

  const postDir = path.join(articleDistDir, slug);
  if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true });
  }

  fs.writeFileSync(path.join(postDir, 'index.html'), postHtml);
});

console.log(`Successfully generated SEO meta tags for ${files.length} articles!`);
