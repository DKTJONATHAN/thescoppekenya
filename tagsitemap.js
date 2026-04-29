import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// ES MODULE PATH SETUP
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------
const POSTS_DIRECTORY = path.join(__dirname, 'content', 'posts');
const SITE_URL        = 'https://zandani.co.ke';
const OUTPUT_FILE     = path.join(__dirname, 'dist', 'deindex-tags-sitemap.xml');
const DRY_RUN         = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// HELPER: SLUGIFY  (spaces/underscores â†’ hyphens, lowercase, trim special chars)
// Keeps the tag URLs consistent with Astro's default content collection routing.
// e.g.  "Kenyan News"  â†’  "kenyan-news"
// ---------------------------------------------------------------------------
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')       // spaces/underscores â†’ hyphens
    .replace(/[^a-z0-9\-]/g, '')   // strip everything except a-z 0-9 -
    .replace(/--+/g, '-')          // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '');      // trim leading/trailing hyphens
}

// ---------------------------------------------------------------------------
// HELPER: EXTRACT FRONTMATTER BLOCK  (content between first two --- fences)
// ---------------------------------------------------------------------------
function extractFrontmatter(content) {
  const match = content.match(/^---[\r\n]([\s\S]*?)[\r\n]---/);
  return match ? match[1] : '';
}

// ---------------------------------------------------------------------------
// HELPER: PARSE TAGS FROM FRONTMATTER TEXT
//
// Handles all common YAML formats for tags:
//   1. Inline array  â†’  tags: [foo, bar, "baz qux"]
//   2. Flow string   â†’  tags: foo, bar, baz
//   3. Block array   â†’  tags:\n  - foo\n  - bar        â† original script missed this!
// ---------------------------------------------------------------------------
function parseTags(frontmatter) {
  // â”€â”€ Format 3: block (YAML list) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Match  tags:\n  - item\n  - item  (indented dashes after the tags: key)
  const blockMatch = frontmatter.match(/^tags\s*:\s*[\r\n]((?:[ \t]+-[^\r\n]*[\r\n]?)+)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split(/[\r\n]+/)
      .map(line => line.replace(/^[ \t]+-\s*/, '').replace(/['"]/g, '').trim())
      .filter(Boolean);
  }

  // â”€â”€ Formats 1 & 2: inline  (tags: [...] or tags: a, b, c) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const inlineMatch = frontmatter.match(/^tags\s*:\s*\[?([^\]\r\n]+)\]?/m);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map(tag => tag.replace(/['"[\]]/g, '').trim())
      .filter(Boolean);
  }

  return [];
}

// ---------------------------------------------------------------------------
// HELPER: RECURSIVELY COLLECT MARKDOWN FILES
// ---------------------------------------------------------------------------
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
      console.error(`[âœ—] Directory not found: ${dir}`);
      console.error(`    Make sure 'content/posts' exists relative to this script.`);
      process.exit(1);
    }
    throw err;
  }
  return fileList;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function generateSitemap() {
  console.log(`[â†’] Scanning: ${POSTS_DIRECTORY}`);
  const files = await getMarkdownFiles(POSTS_DIRECTORY);
  console.log(`[âœ“] Found ${files.length} markdown file(s).`);

  const rawTagSet  = new Set();   // original labels (for logging)
  const slugTagSet = new Set();   // deduplicated slugs (for URLs)

  for (const file of files) {
    const content     = await fs.readFile(file, 'utf8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter) continue;

    const tags = parseTags(frontmatter);
    for (const tag of tags) {
      if (!tag) continue;
      rawTagSet.add(tag);
      const slug = slugify(tag);
      if (slug) slugTagSet.add(slug);
    }
  }

  console.log(`[âœ“] Unique raw tags  : ${rawTagSet.size}`);
  console.log(`[âœ“] Unique URL slugs : ${slugTagSet.size}`);

  if (slugTagSet.size === 0) {
    console.warn('[!] No tags found â€” check your frontmatter format.');
    return;
  }

  // Sort for deterministic diffs in version control
  const sortedSlugs = [...slugTagSet].sort();

  const today = new Date().toISOString().split('T')[0];

  // Build XML  (no <changefreq> or <priority> â€” Google ignores them for tag pages)
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...sortedSlugs.map(slug =>
      `  <url>\n    <loc>${SITE_URL}/tag/${slug}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
    ),
    `</urlset>`,
  ];
  const xml = lines.join('\n');

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would write:\n');
    console.log(xml.slice(0, 1500) + (xml.length > 1500 ? '\n... (truncated)' : ''));
    console.log(`\n[DRY RUN] Total URLs: ${sortedSlugs.length}`);
    return;
  }

  // Ensure dist/ exists (Vite may not have run yet in pre-build scenarios)
  const outDir = path.dirname(OUTPUT_FILE);
  await fs.mkdir(outDir, { recursive: true });

  await fs.writeFile(OUTPUT_FILE, xml, 'utf8');
  console.log(`\n[âœ“] Sitemap written â†’ ${OUTPUT_FILE}`);
  console.log(`    Total tag URLs   : ${sortedSlugs.length}`);
  console.log(`\n    Sample URLs:`);
  sortedSlugs.slice(0, 5).forEach(s => console.log(`      ${SITE_URL}/tag/${s}/`));
  if (sortedSlugs.length > 5) console.log(`      ... and ${sortedSlugs.length - 5} more`);
}

generateSitemap().catch(err => {
  console.error('[âœ—] Fatal error:', err.message);
  process.exit(1);
});