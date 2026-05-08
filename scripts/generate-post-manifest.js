import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const OUTPUT_FILE = path.join(process.cwd(), 'public/posts-manifest.json');

function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  // BUG FIX 1: Early return was using key 'content' but caller destructures 'bodyContent'
  // Unified to always return 'bodyContent'
  if (!match) return { data: {}, bodyContent: content };

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
      value = value.slice(1, -1).split(',').map(item => item.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data, bodyContent };
}

function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = (content || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

function stripMarkdown(text) {
  return String(text || '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^[#>\-\*\d\.\s]+/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateSnippet(text, maxLength = 155) {
  const cleaned = stripMarkdown(text);
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;

  const sliced = cleaned.slice(0, maxLength + 1);
  const lastSentence = Math.max(
    sliced.lastIndexOf('. '),
    sliced.lastIndexOf('! '),
    sliced.lastIndexOf('? ')
  );
  if (lastSentence >= 90) {
    return sliced.slice(0, lastSentence + 1).trim();
  }
  const lastSpace = sliced.lastIndexOf(' ');
  return `${sliced.slice(0, lastSpace > 80 ? lastSpace : maxLength).trim()}...`;
}

function buildSnippet(data, bodyContent) {
  const explicit = [data.description, data.excerpt].find(
    value => typeof value === 'string' && value.trim()
  );
  if (explicit) return truncateSnippet(explicit);

  const paragraphs = (bodyContent || '')
    .split(/\n\s*\n/)
    .map(p => stripMarkdown(p))
    .filter(p => p && !p.startsWith('##'));

  return truncateSnippet(paragraphs[0] || bodyContent || '');
}

// BUG FIX 4: Safe date parser for sort â€” NaN-safe, same logic as markdowns.ts getSafeTime
function getSafeTime(dateStr) {
  if (!dateStr) return 0;
  let time = new Date(dateStr).getTime();
  if (!isNaN(time)) return time;
  time = new Date(String(dateStr).replace(/-/g, '/').replace('T', ' ')).getTime();
  return isNaN(time) ? 0 : time;
}

if (!fs.existsSync(POSTS_DIR)) {
  console.error(`Posts directory not found: ${POSTS_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

if (files.length === 0) {
  console.warn('No markdown files found in content/posts/');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify([]));
  process.exit(0);
}

const manifest = files.map(file => {
  const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
  const { data, bodyContent } = extractFrontmatter(content);

  // BUG FIX 2: featured field was missing â€” getFeaturedPosts() always returned []
  // BUG FIX 3: authorImage field was missing from manifest output
  return {
    title: data.title || 'Untitled',
    slug: data.slug || file.replace('.md', ''),
    sourceFile: file,
    date: data.date || new Date().toISOString(),
    category: data.category || 'News',
    author: data.author || 'Za Ndani',
    authorImage: data.authorImage || data.author_image || '',
    excerpt: buildSnippet(data, bodyContent),
    description: buildSnippet(data, bodyContent),
    image: data.image || '/placeholder.svg',
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
    readTime: calculateReadTime(bodyContent),
    featured: data.featured === true || data.featured === 'true',
    dateModified: data.dateModified || data.updated || data.modified || data.lastmod || data.date || new Date().toISOString(),
    focusKeyword: data.focusKeyword || data.focus_keyword || '',
    wordCount: stripMarkdown(bodyContent).split(/\s+/).filter(Boolean).length,
  };
// BUG FIX 4: Use NaN-safe getSafeTime instead of raw new Date() subtraction
}).sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`âœ… Processed ${manifest.length} posts into manifest.`);