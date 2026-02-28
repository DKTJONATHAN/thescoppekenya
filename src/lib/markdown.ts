import { marked } from 'marked';

// --- ORIGINAL FRONTMATTER PARSER ---
function parseFrontmatter(content: string): { data: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) return { data: {}, content };

  const yamlContent = match[1];
  const bodyContent = match[2];
  const data: Record<string, any> = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value: any = line.slice(colonIndex + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((item: string) => item.trim().replace(/^["']|["']$/g, ''));
    } else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, content: bodyContent };
}

// --- ORIGINAL INTERFACES ---
export interface Post {
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  date: string;
  tags: string[];
  featured?: boolean;
  content: string;
  htmlContent: string;
  readTime: number;
  imageAlt: string;
}

// --- DATA LOADING ---
const postFiles = import.meta.glob('/content/posts/*.md', { 
  query: '?raw',
  import: 'default',
  eager: true 
});

// --- ORIGINAL HELPERS ---
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function normalizeCategory(rawCategory: string): string {
  const lower = rawCategory?.toLowerCase().trim() || 'news';
  const categoryMap: Record<string, string> = {
    'politics': 'News', 'celebrity': 'Gossip', 'tech': 'Business', 'music': 'Entertainment'
  };
  return categoryMap[lower] || rawCategory;
}

function getSafeTime(dateStr: string): number {
  if (!dateStr) return 0;
  let time = new Date(dateStr).getTime();
  if (isNaN(time)) {
    time = new Date(dateStr.replace(/-/g, '/').replace('T', ' ')).getTime();
  }
  return isNaN(time) ? 0 : time;
}

function fallbackMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  let html = markdown;
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  const blocks = html.split(/\n\n+/);
  return blocks.map(block => `<p>${block.trim().replace(/\n/g, '<br />')}</p>`).join('\n');
}

// --- RESTORED EXPORTED FUNCTIONS ---

export function getAllPosts(): Post[] {
  const posts: Post[] = [];
  for (const path in postFiles) {
    try {
      const rawContent = postFiles[path] as string;
      const { data, content } = parseFrontmatter(rawContent);
      
      posts.push({
        title: data.title || 'Untitled',
        slug: data.slug || path.split('/').pop()?.replace('.md', '') || '',
        excerpt: data.excerpt || '',
        image: data.image || '/placeholder.svg',
        category: normalizeCategory(data.category),
        author: data.author || 'The Scoop Kenya',
        date: data.date || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        featured: data.featured || false,
        content: content,
        htmlContent: "", // Left empty for performance in lists
        readTime: calculateReadTime(content),
        imageAlt: data.title || 'Article Image',
      });
    } catch (e) { console.error(e); }
  }
  return posts.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));
}

export function getPostBySlug(slug: string): Post | undefined {
  const all = getAllPosts();
  const post = all.find(p => p.slug === slug);
  if (post) {
    try {
      post.htmlContent = marked(post.content) as string;
    } catch {
      post.htmlContent = fallbackMarkdownToHtml(post.content);
    }
  }
  return post;
}

export const categories = [
  { name: "News", slug: "news" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Gossip", slug: "gossip" },
  { name: "Sports", slug: "sports" },
  { name: "Business", slug: "business" },
  { name: "Lifestyle", slug: "lifestyle" },
];

// --- SITEMAP GENERATOR RESTORED ---
export function generateSitemap(): string {
  const baseUrl = 'https://zandani.co.ke';
  const posts = getAllPosts();
  const urlElements = posts.map(post => `
    <url>
      <loc>${baseUrl}/article/${post.slug}</loc>
      <lastmod>${post.date}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlElements}</urlset>`;
}