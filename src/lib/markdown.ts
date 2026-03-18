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

// PERF: Load markdown files lazily â€” not bundled into main chunk
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

function normalizeCategory(rawCategory: string): string {
  const lower = rawCategory.toLowerCase().trim();
  const categoryMap: Record<string, string> = {
    'news': 'News',
    'entertainment': 'Entertainment',
    'gossip': 'Gossip',
    'sports': 'Sports',
    'business': 'Business',
    'lifestyle': 'Lifestyle',
    'politics': 'News',
    'celebrity': 'Gossip',
    'celebrity gossip': 'Gossip',
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

// Module-level cache
let _cachedPosts: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (_cachedPosts) return _cachedPosts;

  const posts: Post[] = [];

  for (const path in postFiles) {
    try {
      const rawContent = postFiles[path] as string;
      const { data, content } = parseFrontmatter(rawContent);
      const frontmatter = data as unknown as Partial<PostFrontmatter>;

      const author = frontmatter.author || 'The Scoop Kenya';
      const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
      const title = frontmatter.title || 'Untitled Post';
      const slug = frontmatter.slug || path.replace('/content/posts/', '').replace('.md', '');
      const excerpt = frontmatter.excerpt || '';
      const image = frontmatter.image || '/placeholder.svg';
      const category = normalizeCategory(frontmatter.category || 'News');
      const date = frontmatter.date || new Date().toISOString().split('T')[0];

      // PERF: Defer HTML parsing â€” only parse when needed (in ArticlePage)
      let _htmlContent: string | null = null;

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
        get htmlContent() {
          if (_htmlContent === null) {
            try {
              _htmlContent = marked(content) as string;
            } catch {
              _htmlContent = content;
            }
          }
          return _htmlContent;
        },
        readTime: calculateReadTime(content),
        imageAlt: title,
        authorImage: undefined,
      } as Post);
    } catch (error) {
      console.error(`Error parsing post at ${path}:`, error);
      continue;
    }
  }

  // Sort by date descending
  _cachedPosts = posts.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));
  return _cachedPosts;
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

// â”€â”€â”€ ADDED: Returns all slugs for pre-rendering at build time â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getAllPostSlugs(): string[] {
  return getAllPosts().map(post => post.slug);
}

export function getTodaysTopStory(): Post | undefined {
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

export function getSecondaryPosts(excludeSlug: string | undefined, limit = 4): Post[] {
  return getAllPosts().filter(post => post.slug !== excludeSlug).slice(0, limit);
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
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.3', changefreq: 'monthly' },
    { loc: '/sports', priority: '0.8', changefreq: 'daily', lastmod: today },
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
  { name: "Entertainment", slug: "entertainment", description: "Celebrity news, music, movies, na pop culture" },
  { name: "Gossip", slug: "gossip", description: "The latest celebrity gossip na relationship drama" },
  { name: "Sports", slug: "sports", description: "Football, athletics, na all things sports" },
  { name: "Business", slug: "business", description: "Economy, startups, tech na financial news" },
  { name: "Lifestyle", slug: "lifestyle", description: "Fashion, health, travel, na living well" },
];