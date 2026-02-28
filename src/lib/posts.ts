import { marked } from 'marked';

// ... (keep your parseFrontmatter, normalizeCategory, and getSafeTime functions here)

const postFiles = import.meta.glob('/content/posts/*.md', { 
  query: '?raw',
  import: 'default',
  eager: true 
});

// 1. FOR THE HOME/CATEGORY PAGES (Lightning Fast)
export function getPostFeed() {
  const posts = [];
  for (const path in postFiles) {
    const { data, content } = parseFrontmatter(postFiles[path] as string);
    const fm = data as any;
    posts.push({
      title: fm.title || 'Untitled',
      slug: fm.slug || path.split('/').pop()?.replace('.md', '') || '',
      excerpt: fm.excerpt || '',
      image: fm.image || '/placeholder.svg',
      category: normalizeCategory(fm.category || 'News'),
      date: fm.date || '',
      featured: fm.featured || false,
      readTime: Math.ceil(content.split(/\s+/).length / 200),
    });
  }
  return posts.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));
}

// 2. FOR THE SINGLE ARTICLE PAGE (Detailed)
export function getPostBySlug(slug: string) {
  for (const path in postFiles) {
    const { data, content } = parseFrontmatter(postFiles[path] as string);
    if (data.slug === slug || path.includes(slug)) {
      return {
        ...data,
        content,
        htmlContent: marked(content),
        readTime: Math.ceil(content.split(/\s+/).length / 200),
      } as any;
    }
  }
  return undefined;
}