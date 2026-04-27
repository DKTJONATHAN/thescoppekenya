import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const OUTPUT_FILE = path.join(process.cwd(), 'public/posts-manifest.json');

function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (!match) return { data: {}, content };

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
    } else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, bodyContent };
}

function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
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
  const lastSentence = Math.max(sliced.lastIndexOf('. '), sliced.lastIndexOf('! '), sliced.lastIndexOf('? '));
  if (lastSentence >= 90) {
    return sliced.slice(0, lastSentence + 1).trim();
  }

  const lastSpace = sliced.lastIndexOf(' ');
  return `${sliced.slice(0, lastSpace > 80 ? lastSpace : maxLength).trim()}...`;
}

function buildSnippet(data, bodyContent) {
  const explicit = [data.description, data.excerpt].find(value => typeof value === 'string' && value.trim());
  if (explicit) return truncateSnippet(explicit);

  const paragraphs = bodyContent
    .split(/\n\s*\n/)
    .map(paragraph => stripMarkdown(paragraph))
    .filter(paragraph => paragraph && !paragraph.startsWith('##'));

  return truncateSnippet(paragraphs[0] || bodyContent);
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
const manifest = files.map(file => {
  const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
  const { data, bodyContent } = extractFrontmatter(content);
  
  return {
    title: data.title || 'Untitled',
    slug: data.slug || file.replace('.md', ''),
    sourceFile: file,
    date: data.date || new Date().toISOString(),
    category: data.category || 'News',
    author: data.author || 'Za Ndani',
    excerpt: buildSnippet(data, bodyContent),
    description: buildSnippet(data, bodyContent),
    image: data.image || '/placeholder.svg',
    tags: data.tags || [],
    readTime: calculateReadTime(bodyContent)
  };
}).sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest));
console.log(`Processed ${manifest.length} posts into manifest.`);
