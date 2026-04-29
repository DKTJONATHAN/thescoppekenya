import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// â”€â”€â”€ ES MODULE PATH SETUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// â”€â”€â”€ CONFIGURATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const POSTS_DIRECTORY = path.join(__dirname, 'content', 'posts');
const SITE_URL        = 'https://zandani.co.ke';
// public/ is copied into dist/ by Vite/Astro automatically during build
const OUTPUT_FILE     = path.join(__dirname, 'public', 'deindex-tags-sitemap.xml');
const DRY_RUN         = process.argv.includes('--dry-run');

// â”€â”€â”€ HELPER: SLUGIFY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Converts tag labels to clean URL slugs matching Astro's routing convention
// e.g. "Kenyan News" â†’ "kenyan-news"
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// â”€â”€â”€ HELPER: EXTRACT FRONTMATTER BLOCK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function extractFrontmatter(content) {
  const match = content.match(/^---[\r\n]([\s\S]*?)[\r\n]---/);
  return match ? match[1] : '';
}

// â”€â”€â”€ HELPER: PARSE TAGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Handles all three common YAML formats:
//   1. Block array  â†’  tags:\n  - foo\n  - bar
//   2. Inline array â†’  tags: [foo, bar]
//   3. Flow string  â†’  tags: foo, bar
function parseTags(frontmatter) {
  // Format 1: block / YAML list (most common in Astro)
  const blockMatch = frontmatter.match(/^tags\s*:\s*[\r\n]((?:[ \t]+-[^\r\n]*[\r\n]?)+)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split(/[\r\n]+/)
      .map(line => line.replace(/^[ \t]+-\s*/, '').replace(/['"]/g, '').trim())
      .filter(Boolean);
  }

  // Format 2 & 3: inline  tags: [...] or  tags: a, b, c
  const inlineMatch = frontmatter.match(/^tags\s*:\s*\[?([^\]\r\n]+)\]?/m);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map(tag => tag.replace(/['"[\]]/g, '').trim())
      .filter(Boolean);
  }

  return [];
}

// â”€â”€â”€ HELPER: RECURSIVELY READ DIRECTORY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getMarkdownFiles(dir, fileList = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        fileList = await getMarkdownFiles(fullPath, fileList);
      } else if (/\.(md|mdx)$/.test(entry.name)) {
        fileList.push(fullPath);
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`âŒ Directory not found: ${dir}`);
      console.error(`   Ensure 'content/posts' exists relative to this script.`);
      process.exit(1);
    }
    throw err;
  }
  return fileList;
}

// â”€â”€â”€ MAIN SCRIPT: GENERATE XML SITEMAP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function generateSitemap() {
  console.log(`ðŸ” Scanning: ${POSTS_DIRECTORY}`);
  const files = await getMarkdownFiles(POSTS_DIRECTORY);
  console.log(`âœ… Found ${files.length} markdown file(s).`);

  console.log('ðŸ·ï¸  Extracting tags...');

  const slugSet = new Set();

  for (const file of files) {
    const content     = await fs.readFile(file, 'utf8');
    const frontmatter = extractFrontmatter(content);
    if (!frontmatter) continue;

    const tags = parseTags(frontmatter);
    for (const tag of tags) {
      const slug = slugify(tag);
      if (slug) slugSet.add(slug);
    }
  }

  console.log(`âœ… Extracted ${slugSet.size} unique tag slug(s).`);

  if (slugSet.size === 0) {
    console.warn('âš ï¸  No tags found. Check your frontmatter format.');
    return;
  }

  // Sort for deterministic output (clean Git diffs)
  const sortedSlugs = [...slugSet].sort();
  const today = new Date().toISOString().split('T')[0];

  console.log('ðŸ“ Generating XML...');

  const urlEntries = sortedSlugs.map(slug =>
    `  <url>\n    <loc>${SITE_URL}/tag/${slug}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
  );

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urlEntries,
    `</urlset>`,
  ].join('\n');

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would write:\n');
    console.log(xml.slice(0, 1500) + (xml.length > 1500 ? '\n...(truncated)' : ''));
    console.log(`\n[DRY RUN] Total URLs: ${sortedSlugs.length}`);
    return;
  }

  // Ensure public/ exists (creates it if missing)
  const outDir = path.dirname(OUTPUT_FILE);
  await fs.mkdir(outDir, { recursive: true });

  await fs.writeFile(OUTPUT_FILE, xml, 'utf8');

  console.log(`\nðŸŽ‰ Sitemap written â†’ ${OUTPUT_FILE}`);
  console.log(`   Total tag URLs : ${sortedSlugs.length}`);
  console.log(`\n   Sample URLs:`);
  sortedSlugs.slice(0, 5).forEach(s => console.log(`     ${SITE_URL}/tag/${s}/`));
  if (sortedSlugs.length > 5) console.log(`     ... and ${sortedSlugs.length - 5} more`);
}

generateSitemap().catch(err => {
  console.error('âŒ Fatal:', err.message);
  process.exit(1);
});