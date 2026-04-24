import { marked } from 'marked';

// Browser-compatible frontmatter parser
function parseFrontmatter(content: string): { data: Record<string, unknown>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const yamlContent = match[1];
  const bodyContent = match[2];

  const data: Record<string, unknown> = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: unknown = line.slice(colonIndex + 1).trim();

    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(item => item.trim().replace(/^["'']|["'']$/g, ''));
    }
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (typeof value === 'string' && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data, content: bodyContent };
}

// ─── POST TYPES ──────────────────────────────────────────────────────────────
export interface PostMetadata {
  title: string;
  slug: string;
  sourceFile?: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  date: string;
  tags: string[];
  readTime: number;
  featured?: boolean;
}

export interface Post extends PostMetadata {
  content: string;
  htmlContent: string;
  imageAlt: string;
}

// ─── FILE LOADING (LAZY) ─────────────────────────────────────────────────────
// We use eager: false (and no query: '?raw' here) because we'll load content 
// dynamically via getPostBySlug.
const postFiles = import.meta.glob('/content/posts/*.md', { 
  as: 'raw',
  eager: false 
});

// ─── MANIFEST LOADING ────────────────────────────────────────────────────────
// The manifest is generated at build time by scripts/generate-post-manifest.js
// It's a small JSON with metadata only for fast listings.
import manifestPosts from '../../public/posts-manifest.json';

const ALL_POSTS: PostMetadata[] = (manifestPosts as unknown as PostMetadata[]).map(p => ({
  ...p,
  category: normalizeCategory(p.category)
}));

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function normalizeCategory(rawCategory: string): string {
  const lower = rawCategory.toLowerCase().trim();
  const categoryMap: Record<string, string> = {
    'news': 'News',
    'entertainment': 'Entertainment',
    'gossip': 'Entertainment',
    'sports': 'Sports',
    'business': 'Business',
    'lifestyle': 'Lifestyle',
    'politics': 'News',
    'celebrity': 'Entertainment',
    'celebrity gossip': 'Entertainment',
    'tech': 'Business',
    'technology': 'Business',
    'music': 'Entertainment',
    'fashion': 'Lifestyle',
    'health': 'Lifestyle',
    'travel': 'Lifestyle',
  };
  return categoryMap[lower] || rawCategory;
}

function getSafeTime(dateStr: string): number {
  if (!dateStr) return 0;
  let time = new Date(dateStr).getTime();
  if (!isNaN(time)) return time;
  // Fallback for non-ISO strings like "2024-03-22 10:30"
  time = new Date(dateStr.replace(/-/g, '/').replace('T', ' ')).getTime();
  return isNaN(time) ? 0 : time;
}

export function getAllPosts(): PostMetadata[] {
  return ALL_POSTS;
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const metadata = ALL_POSTS.find(post => post.slug === slug);
  if (!metadata) return undefined;

  const sourcePath = metadata.sourceFile
    ? `/content/posts/${metadata.sourceFile}`
    : Object.keys(postFiles).find(p => p.includes(slug));
  if (!sourcePath || !(sourcePath in postFiles)) return undefined;

  try {
    const rawContent = await postFiles[sourcePath]() as string;
    const { content } = parseFrontmatter(rawContent);
    
    return {
      ...metadata,
      content: content,
      htmlContent: marked(content) as string,
      imageAlt: metadata.title,
    };
  } catch (error) {
    console.error(`Error loading post content for ${slug}:`, error);
    return undefined;
  }
}

export function getFeaturedPosts(): PostMetadata[] {
  return getAllPosts().filter(post => post.featured);
}

export function getLatestPosts(limit?: number): PostMetadata[] {
  const posts = getAllPosts();
  return limit ? posts.slice(0, limit) : posts;
}

// ─── PODCAST EPISODE TYPES & LOADING ─────────────────────────────────────────
export interface PodcastEpisode {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  audio_url: string;
}

const podcastFiles = import.meta.glob('/content/briefings/*.md', { 
  as: 'raw',
  eager: true 
});

export function getAllPodcastEpisodes(): PodcastEpisode[] {
  const episodes = Object.entries(podcastFiles).map(([path, rawContent]) => {
    const { data } = parseFrontmatter(rawContent);
    const slug = path.split('/').pop()?.replace('.md', '') || '';
    
    return {
      slug: data.slug as string || slug,
      title: data.title as string,
      date: data.date as string,
      excerpt: data.excerpt as string,
      audio_url: data.audio_url as string,
    };
  });

  // Sort by date, descending
  return episodes.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));
}

// ─── ADDED: Returns all slugs for pre-rendering at build time ─────────────────
export function getAllPostSlugs(): string[] {
  return getAllPosts().map(post => post.slug);
}

export function getTodaysTopStory(): PostMetadata | undefined {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const posts = getAllPosts();
  const todaysPosts = posts.filter(post => {
    const postTime = getSafeTime(post.date);
    if (!postTime) return false;
    const postDate = new Date(postTime);
    postDate.setHours(0, 0, 0, 0);
    return postDate.getTime() === today.getTime();
  });
  return todaysPosts.length > 0 ? todaysPosts[todaysPosts.length - 1] : posts[0];
}

export function getSecondaryPosts(excludeSlug: string | undefined, limit = 4): PostMetadata[] {
  return getAllPosts().filter(post => post.slug !== excludeSlug).slice(0, limit);
}

export function getPostsByCategory(category: string): PostMetadata[] {
  return getAllPosts().filter(post => post.category.toLowerCase() === category.toLowerCase());
}

export function searchPosts(query: string): PostMetadata[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];
  return getAllPosts().filter(post => 
    post.title.toLowerCase().includes(searchTerm) ||
    post.excerpt.toLowerCase().includes(searchTerm) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    post.author.toLowerCase().includes(searchTerm)
  );
}

export function getPostsByTag(tag: string): PostMetadata[] {
  const normalizedTag = tag.toLowerCase().trim();
  return getAllPosts().filter(post => 
    post.tags.some(t => t.toLowerCase() === normalizedTag)
  );
}

export function getAllTags(): string[] {
  const allTags = getAllPosts().reduce((acc, post) => acc.concat(post.tags), [] as string[]);
  return [...new Set(allTags)].sort();
}

export function generateSitemap(): string {
  const baseUrl = 'https://zandani.co.ke';
  const posts = getAllPosts();
  const today = new Date().toISOString().split('T')[0];

  type SitemapUrl = { loc: string; priority: string; changefreq: string; lastmod?: string };

  const staticPages: SitemapUrl[] = [
    { loc: '/', priority: '1.0', changefreq: 'hourly', lastmod: today },
    { loc: '/news', priority: '0.9', changefreq: 'hourly', lastmod: today },
    { loc: '/entertainment', priority: '0.9', changefreq: 'daily', lastmod: today },
    { loc: '/sports', priority: '0.8', changefreq: 'daily', lastmod: today },
    { loc: '/business', priority: '0.8', changefreq: 'daily', lastmod: today },
    { loc: '/lifestyle', priority: '0.8', changefreq: 'daily', lastmod: today },
    { loc: '/trending', priority: '0.7', changefreq: 'daily', lastmod: today },
    { loc: '/authors', priority: '0.5', changefreq: 'weekly' },
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.3', changefreq: 'monthly' },
  ];

  const postUrls: SitemapUrl[] = posts.map(post => ({
    loc: `/article/${post.slug}`,
    lastmod: post.date,
    priority: post.featured ? '0.9' : '0.8',
    changefreq: 'weekly'
  }));

  const categoryUrls: SitemapUrl[] = categories.map(cat => ({
    loc: `/category/${cat.slug}`,
    priority: '0.7',
    changefreq: 'daily',
    lastmod: today
  }));

  const allTags = [...new Set(posts.reduce((acc, post) => acc.concat(post.tags), [] as string[]))];
  const tagUrls: SitemapUrl[] = allTags.map(tag => ({
    loc: `/tag/${encodeURIComponent(tag)}`,
    priority: '0.5',
    changefreq: 'weekly'
  }));

  const allUrls: SitemapUrl[] = [...staticPages, ...postUrls, ...categoryUrls, ...tagUrls];

  const urlElements = allUrls.map(url => `
  <url>
    <loc>${baseUrl}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

export const categories = [
  { name: "News", slug: "news", description: "Breaking news, politics na current affairs from Kenya and beyond" },
  { name: "Entertainment", slug: "entertainment", description: "Celebrity news, music, movies, pop culture, na relationship drama" },
  { name: "Sports", slug: "sports", description: "Football, athletics, na all things sports" },
  { name: "Business", slug: "business", description: "Economy, startups, tech na financial news" },
  { name: "Lifestyle", slug: "lifestyle", description: "Fashion, health, travel, na living well" },
];
