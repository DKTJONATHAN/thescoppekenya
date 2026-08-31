import { marked } from 'marked';
import { staticSitePages } from './site-links';

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

export interface PostMetadata {
  title: string;
  slug: string;
  sourceFile?: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  authorImage?: string;
  date: string;
  tags: string[];
  readTime: number;
  featured?: boolean;
  dateModified?: string;
  focusKeyword?: string;
  wordCount?: number;
}

export interface Post extends PostMetadata {
  content: string;
  htmlContent: string;
  imageAlt: string;
}

import manifestPosts from '../../public/posts-manifest.json';

const ALL_POSTS: PostMetadata[] = (manifestPosts as unknown as PostMetadata[]).map(p => ({
  ...p,
  category: normalizeCategory(p.category)
}));

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
  time = new Date(dateStr.replace(/-/g, '/').replace('T', ' ')).getTime();
  return isNaN(time) ? 0 : time;
}

export function getAllPosts(): PostMetadata[] {
  return ALL_POSTS;
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const metadata = ALL_POSTS.find(post => post.slug === slug);
  if (!metadata) return undefined;

  const fileName = metadata.sourceFile || `${slug}.md`;

  try {
    const res = await fetch(`/raw-posts/${encodeURIComponent(fileName)}`);
    if (!res.ok) {
      console.error(`Error loading post content for ${slug}: ${res.status}`);
      return undefined;
    }
    const rawContent = await res.text();
    const { content } = parseFrontmatter(rawContent);

    return {
      ...metadata,
      content,
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

export interface PodcastEpisode {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  audio_url: string;
}

const podcastFiles = import.meta.glob('/content/briefings/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

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

  return episodes.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));
}

export const getAllBriefings = getAllPodcastEpisodes;

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
  type SitemapUrl = { loc: string; priority: string; changefreq: string; lastmod?: string };

  const postUrls: SitemapUrl[] = posts.map(post => ({
    loc: `/article/${post.slug}`,
    lastmod: post.date,
    priority: post.featured ? '0.9' : '0.8',
    changefreq: 'weekly'
  }));

  const urlElements = postUrls.map(url => `
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
