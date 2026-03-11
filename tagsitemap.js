import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// --- ES MODULE PATH SETUP ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION -----------------------------------------------------------
const POSTS_DIRECTORY = path.join(__dirname, 'content', 'posts'); 
const SITE_URL = 'https://zandani.co.ke';
// Output directly to dist so it is available after Vite builds
const OUTPUT_FILE = path.join(__dirname, 'dist', 'deindex-tags-sitemap.xml'); 

// --- HELPER: RECURSIVELY READ DIRECTORY --------------------------------------
async function getMarkdownFiles(dir, fileList = []) {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filepath = path.join(dir, file);
      const stat = await fs.stat(filepath);

      if (stat.isDirectory()) {
        fileList = await getMarkdownFiles(filepath, fileList);
      } else if (filepath.endsWith('.md') || filepath.endsWith('.mdx')) {
        fileList.push(filepath);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`[X] Directory not found: ${dir}`);
      console.error(`Please ensure the 'content/posts' folder exists relative to where you are running this script.`);
      process.exit(1);
    }
    throw error;
  }
  return fileList;
}

// --- HELPER: EXTRACT TAGS FROM FRONTMATTER -----------------------------------
async function extractTagsFromFiles(files) {
  const allTags = new Set();

  // Regex to find "tags: [a, b]" or "tags: a, b" in frontmatter
  const tagsRegex = /tags:\s*\[?(.*?)\]?\r?\n/;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const match = content.match(tagsRegex);

    if (match && match[1]) {
      // Split by comma, clean up quotes, brackets, and whitespace
      const extracted = match[1]
        .split(',')
        .map(tag => tag.replace(/['"]/g, '').trim())
        .filter(tag => tag.length > 0);

      extracted.forEach(tag => allTags.add(tag));
    }
  }

  return Array.from(allTags);
}

// --- MAIN SCRIPT: GENERATE XML SITEMAP ---------------------------------------
async function generateSitemap() {
  console.log(`[+] Scanning for Markdown files in: ${POSTS_DIRECTORY}`);
  const files = await getMarkdownFiles(POSTS_DIRECTORY);
  console.log(`[+] Found ${files.length} markdown files.`);

  console.log('[+] Extracting tags...');
  const tags = await extractTagsFromFiles(files);
  console.log(`[+] Extracted ${tags.length} unique tags.`);

  if (tags.length === 0) {
    console.log('[!] No tags found. Check your markdown frontmatter format.');
    return;
  }

  // Use today's date so Googlebot crawls them immediately
  const today = new Date().toISOString().split('T')[0];

  console.log('[+] Generating XML...');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const tag of tags) {
    const encodedTag = encodeURIComponent(tag);
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/tag/${encodedTag}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  // Ensure the dist directory exists before writing to it
  const outDir = path.dirname(OUTPUT_FILE);
  try {
    await fs.access(outDir);
  } catch {
    await fs.mkdir(outDir, { recursive: true });
  }

  await fs.writeFile(OUTPUT_FILE, xml, 'utf8');
  console.log(`[SUCCESS] Temporary sitemap generated at: ${OUTPUT_FILE}`);
}

generateSitemap().catch(console.error);