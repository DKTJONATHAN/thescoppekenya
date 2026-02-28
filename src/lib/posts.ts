import { marked } from 'marked';

// --- FRONTMATTER PARSER ---
function parseFrontmatter(content: string) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (!match) return { data: {} as any, content };

  const data: any = {};
  match[1].split('\n').forEach(line => {
    const [key, ...val] = line.split(':');
    if (key && val) data[key.trim()] = val.join(':').trim().replace(/^['"]|['"]$/g, '');
  });
  return { data, content: match[2] };
}

// --- UTILS ---
const getSafeTime = (date: string) => new Date(date).getTime() || 0;
const calculateReadTime = (text: string) => Math.ceil(text.split(/\s+/).length / 200);

// --- THE DATA BUCKET ---
const postFiles = import.meta.glob('/content/posts/*.md', { 
  query: '?raw', 
  import: 'default', 
  eager: true 
});

// 1. FOR HOME/BENTO FEED (Lightweight)
export function getPostFeed() {
  return Object.keys(postFiles).map(path => {
    const raw = postFiles[path] as string;
    const { data, content } = parseFrontmatter(raw);
    return {
      title: data.title || 'Untitled',
      slug: data.slug || path.split('/').pop()?.replace('.md', '') || '',
      image: data.image || '/placeholder.svg',
      category: data.category || 'News',
      date: data.date || '',
      excerpt: data.excerpt || '',
      readTime: calculateReadTime(content),
    };
  }).sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));
}

// 2. FOR THE FULL ARTICLE (Heavyweight)
export function getPostBySlug(slug: string) {
  const fileKey = Object.keys(postFiles).find(path => path.includes(slug));
  if (!fileKey) return null;

  const { data, content } = parseFrontmatter(postFiles[fileKey] as string);
  return {
    ...data,
    content,
    htmlContent: marked(content), // Only convert to HTML when needed
    readTime: calculateReadTime(content),
  };
}