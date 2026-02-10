import { marked } from 'marked';

// Browser-compatible frontmatter parser (gray-matter uses Node.js Buffer)
function parseFrontmatter(content: string): { data: Record<string, unknown>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, content };
  }
  
  const yamlContent = match[1];
  const bodyContent = match[2];
  
  // Simple YAML parser for frontmatter
  const data: Record<string, unknown> = {};
  const lines = yamlContent.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    let value: unknown = line.slice(colonIndex + 1).trim();
    
    // Handle arrays (tags: [tag1, tag2])
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
    }
    // Handle booleans
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // Handle quoted strings
    else if (typeof value === 'string' && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    
    data[key] = value;
  }
  
  return { data, content: bodyContent };
}

export interface PostFrontmatter {
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  date: string;
  tags: string[];
  featured?: boolean;
}

export interface Post extends PostFrontmatter {
  content: string;
  htmlContent: string;
  readTime: number;
  imageAlt: string;
  authorImage?: string;
}

// Import all markdown files from content/posts
const postFiles = import.meta.glob('/content/posts/*.md', { 
  query: '?raw',
  import: 'default',
  eager: true 
});

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function getAllPosts(): Post[] {
  const posts: Post[] = [];

  for (const path in postFiles) {
    try {
      const rawContent = postFiles[path] as string;
      const { data, content } = parseFrontmatter(rawContent);
      const frontmatter = data as unknown as Partial<PostFrontmatter>;

      // Ensure required fields have defaults to prevent crashes
      const author = frontmatter.author || 'The Scoop Kenya';
      const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
      const title = frontmatter.title || 'Untitled Post';
      const slug = frontmatter.slug || path.replace('/content/posts/', '').replace('.md', '');
      const excerpt = frontmatter.excerpt || '';
      const image = frontmatter.image || '/placeholder.svg';
      const category = frontmatter.category || 'News';
      const date = frontmatter.date || new Date().toISOString().split('T')[0];

      posts.push({
        title,
        slug,
        excerpt,
        image,
        category,
        author,
        date,
        tags,
        featured: frontmatter.featured || false,
        content,
        htmlContent: marked(content) as string,
        readTime: calculateReadTime(content),
        imageAlt: title,
        authorImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`,
      });
    } catch (error) {
      console.error(`Error parsing post at ${path}:`, error);
      // Skip malformed posts instead of crashing
      continue;
    }
  }

  // Sort by date descending
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find(post => post.slug === slug);
}

export function getFeaturedPosts(): Post[] {
  return getAllPosts().filter(post => post.featured);
}

export function getLatestPosts(limit?: number): Post[] {
  const posts = getAllPosts();
  return limit ? posts.slice(0, limit) : posts;
}

// Get today's top story (first published post of the day)
export function getTodaysTopStory(): Post | undefined {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const posts = getAllPosts();
  const todaysPosts = posts.filter(post => {
    const postDate = new Date(post.date);
    postDate.setHours(0, 0, 0, 0);
    return postDate.getTime() === today.getTime();
  });
  
  // If no posts today, return the most recent post
  return todaysPosts.length > 0 
    ? todaysPosts[todaysPosts.length - 1] // First published (earliest)
    : posts[0]; // Fallback to most recent
}

// Get secondary featured posts (next N most recent, excluding a specific slug)
export function getSecondaryPosts(excludeSlug: string | undefined, limit = 4): Post[] {
  return getAllPosts()
    .filter(post => post.slug !== excludeSlug)
    .slice(0, limit);
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter(post => post.category.toLowerCase() === category.toLowerCase());
}

export function searchPosts(query: string): Post[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];

  return getAllPosts().filter(post => 
    post.title.toLowerCase().includes(searchTerm) ||
    post.excerpt.toLowerCase().includes(searchTerm) ||
    post.content.toLowerCase().includes(searchTerm) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    post.author.toLowerCase().includes(searchTerm)
  );
}

export function getPostsByTag(tag: string): Post[] {
  const normalizedTag = tag.toLowerCase().trim();
  return getAllPosts().filter(post => 
    post.tags.some(t => t.toLowerCase() === normalizedTag)
  );
}

export function getAllTags(): string[] {
  const allTags = getAllPosts().flatMap(post => post.tags);
  return [...new Set(allTags)].sort();
}

export function generateSitemap(): string {
  const baseUrl = 'https://thescoopkenya.vercel.app';
  const posts = getAllPosts();
  const today = new Date().toISOString().split('T')[0];
  
  type SitemapUrl = { loc: string; priority: string; changefreq: string; lastmod?: string };
  
  const staticPages: SitemapUrl[] = [
    { loc: '/', priority: '1.0', changefreq: 'hourly', lastmod: today },
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.3', changefreq: 'monthly' },
    { loc: '/sports', priority: '0.8', changefreq: 'daily', lastmod: today },
    { loc: '/live-scores', priority: '0.7', changefreq: 'hourly', lastmod: today },
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

  // Get unique tags from all posts
  const allTags = [...new Set(posts.flatMap(post => post.tags))];
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
  { name: "News", slug: "news", description: "Breaking news and current affairs from Kenya and beyond" },
  { name: "Entertainment", slug: "entertainment", description: "Celebrity news, music, movies, and pop culture" },
  { name: "Gossip", slug: "gossip", description: "The latest celebrity gossip and relationship drama" },
  { name: "Sports", slug: "sports", description: "Football, athletics, and all things sports" },
  { name: "Business", slug: "business", description: "Economy, startups, and financial news" },
  { name: "Lifestyle", slug: "lifestyle", description: "Fashion, health, travel, and living well" },
];
