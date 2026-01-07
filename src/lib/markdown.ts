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
    const rawContent = postFiles[path] as string;
    const { data, content } = parseFrontmatter(rawContent);
    const frontmatter = data as unknown as PostFrontmatter;

    posts.push({
      ...frontmatter,
      content,
      htmlContent: marked(content) as string,
      readTime: calculateReadTime(content),
      imageAlt: frontmatter.title,
      authorImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${frontmatter.author}`,
    });
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

export const categories = [
  { name: "News", slug: "news", description: "Breaking news and current affairs from Kenya and beyond" },
  { name: "Entertainment", slug: "entertainment", description: "Celebrity news, music, movies, and pop culture" },
  { name: "Gossip", slug: "gossip", description: "The latest celebrity gossip and relationship drama" },
  { name: "Sports", slug: "sports", description: "Football, athletics, and all things sports" },
  { name: "Business", slug: "business", description: "Economy, startups, and financial news" },
  { name: "Lifestyle", slug: "lifestyle", description: "Fashion, health, travel, and living well" },
];
