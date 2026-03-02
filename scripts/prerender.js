#!/usr/bin/env node

/**
 * Full Static Site Generation (SSG) script.
 * Imports the compiled entry-server.js, renders every route from the sitemap,
 * and stamps the fully rendered HTML + Helmet meta tags into static files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function prerender() {
  console.log('🚀 Starting Static Site Generation...');

  // 1. Read the client HTML template
  const templatePath = path.join(root, 'dist/client/index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/client/index.html not found. Build client first.');
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  // 2. Import the compiled server entry
  const serverEntryPath = path.join(root, 'dist/server/entry-server.js');
  if (!fs.existsSync(serverEntryPath)) {
    console.error('❌ dist/server/entry-server.js not found. Build server first.');
    process.exit(1);
  }
  const { render } = await import(pathToFileURL(serverEntryPath).href);

  // 3. Collect all URLs to prerender
  let urls = [
    '/',
    '/trending',
    '/sports',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/advertise',
    '/careers',
    '/authors',
  ];

  // Extract dynamic routes from the generated sitemap
  const sitemapPath = path.join(root, 'dist/client/sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
    const locMatches = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)];
    const sitemapUrls = locMatches
      .map(m => m[1].replace('https://zandani.co.ke', ''))
      .filter(u => u && u !== '/');
    urls = [...new Set([...urls, ...sitemapUrls])];
  } else {
    console.log('⚠️  No sitemap.xml found, proceeding with core routes only.');
  }

  console.log(`📄 Pre-rendering ${urls.length} pages...`);

  let success = 0;
  let failed = 0;

  for (const url of urls) {
    try {
      const rendered = render(url);
      const headStr = rendered.head || '';
      const htmlStr = rendered.html || '';

      // Inject rendered head tags and body HTML into the template
      const html = template
        .replace('</head>', `${headStr}\n</head>`)
        .replace('<div id="root"></div>', `<div id="root">${htmlStr}</div>`);

      // Determine output file path
      const isFile = /\.\w+$/.test(url); // e.g. .xml, .txt
      let outputPath;
      if (isFile) {
        outputPath = path.join(root, 'dist/client', url);
      } else {
        const dir = path.join(root, 'dist/client', url === '/' ? '' : url);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        outputPath = path.join(dir, 'index.html');
      }

      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      fs.writeFileSync(outputPath, html);
      success++;
    } catch (e) {
      console.error(`❌ Failed: ${url} —`, e.message || e);
      failed++;
    }
  }

  console.log(`✅ SSG complete: ${success} pages rendered, ${failed} failed.`);
}

prerender().catch(err => {
  console.error('Fatal SSG error:', err);
  process.exit(1);
});
