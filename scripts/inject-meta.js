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

  // Keep the raw image URL for OG/Twitter — social crawlers (FB, Twitter) cannot
  // reliably follow wsrv.nl proxy URLs (rate-limits / bot-agent blocks).
  // We store the original URL separately for use in meta tags.
  let ogImage = image; // original, crawler-safe URL

  if (image.startsWith('/')) {
    ogImage = `https://zandani.co.ke${image}`;
    image = ogImage;
  } else if (image && image !== 'https://zandani.co.ke/images/default-og.jpg') {
    // ogImage stays as the original direct URL (no proxy)
    // We'll still proxy for rendered <img> use-cases via ArticlePage.tsx
    ogImage = image; // direct URL for social crawlers
  }

  // Extract date for article timestamps
  const dateMatch = content.match(/^date:\s*(.+)$/im);
  let dateStr = dateMatch ? dateMatch[1].trim().replace(/^["']|["']$/g, '').trim() : new Date().toISOString();
  // Ensure ISO format
  const parsedDate = new Date(dateStr);
  const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

  // Extract tags for news_keywords
  const tagsMatch = content.match(/^tags:\s*\[([^\]]*)\]/im);
  let newsKeywords = '';
  if (tagsMatch) {
    newsKeywords = tagsMatch[1].replace(/["']/g, '').trim();
  }

  // Extract category
  const catMatch = content.match(/^category:\s*(.+)$/im);
  const category = catMatch ? catMatch[1].trim().replace(/^["']|["']$/g, '').trim() : 'News';

  // Extract author
  const authorMatch = content.match(/^author:\s*(.+)$/im);
  const author = authorMatch ? authorMatch[1].trim().replace(/^["']|["']$/g, '').trim() : 'Za Ndani';

  // Detect og:image:type from URL extension (default jpeg if unknown)
  const ogImageType = /\.png(\?|$)/i.test(ogImage) ? 'image/png'
    : /\.gif(\?|$)/i.test(ogImage) ? 'image/gif'
    : /\.webp(\?|$)/i.test(ogImage) ? 'image/webp'
    : 'image/jpeg';

  const metaTags = `
    <title>${title} | Za Ndani</title>
    <meta name="description" content="${desc}">
    <meta name="news_keywords" content="${newsKeywords}">
    <meta name="original-source" content="https://zandani.co.ke/article/${slug}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="googlebot-news" content="index, follow">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:secure_url" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${title}">
    <meta property="og:image:type" content="${ogImageType}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://zandani.co.ke/article/${slug}">
    <meta property="og:site_name" content="Za Ndani">
    <meta property="og:locale" content="en_KE">
    <meta property="article:published_time" content="${isoDate}">
    <meta property="article:modified_time" content="${isoDate}">
    <meta property="article:section" content="${category}">
    <meta property="article:author" content="${author}">
    <meta property="article:publisher" content="https://www.facebook.com/zandani">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@zandanikenya">
    <meta name="twitter:creator" content="@zandanikenya">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="twitter:image:alt" content="${title}">
    <link rel="canonical" href="https://zandani.co.ke/article/${slug}">
    <script type="application/ld+json">
    ${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'),
      "description": desc.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'),
      "image": [ogImage],
      "datePublished": isoDate,
      "dateModified": isoDate,
      "author": { "@type": "Person", "name": author },
      "publisher": {
        "@type": "NewsMediaOrganization",
        "name": "Za Ndani",
        "url": "https://zandani.co.ke",
        "logo": { "@type": "ImageObject", "url": "https://zandani.co.ke/logo.png", "width": 600, "height": 60 }
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": "https://zandani.co.ke/article/" + slug },
      "isPartOf": { "@type": "WebSite", "name": "Za Ndani", "url": "https://zandani.co.ke" },
      "articleSection": category,
      "inLanguage": "en-KE",
      "isAccessibleForFree": true,
      "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", ".article-excerpt"] }
    })}
    </script>
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
