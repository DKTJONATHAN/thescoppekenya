#!/usr/bin/env node

/**
 * Full Static Site Generation (SSG) script.
 * Imports the compiled entry-server.js, renders every route from the sitemap,
 * and stamps the fully rendered HTML + Helmet meta tags into static files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// --- SAFE MOCK BROWSER GLOBALS FOR NODE.JS SSR ---
const mockStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

if (typeof global.localStorage === 'undefined') global.localStorage = mockStorage;
if (typeof global.sessionStorage === 'undefined') global.sessionStorage = mockStorage;

if (typeof global.window === 'undefined') {
  global.window = {
    localStorage: mockStorage,
    sessionStorage: mockStorage,
    dispatchEvent: () => false,
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
    }),
    getComputedStyle: () => ({
      getPropertyValue: () => '',
    }),
    // Fix for ArticlePage.tsx trying to read window.location.href
    location: {
      href: 'https://zandani.co.ke',
      pathname: '/',
      search: '',
      hash: ''
    },
    // Fix for UI Carousels and Animations
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clearTimeout(id)
  };
}

if (typeof global.getComputedStyle === 'undefined') {
  global.getComputedStyle = global.window.getComputedStyle;
}

if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = global.window.requestAnimationFrame;
}

if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = global.window.cancelAnimationFrame;
}

if (typeof global.location === 'undefined') {
  global.location = global.window.location;
}

if (typeof global.document === 'undefined') {
  global.document = {
    documentElement: {
      classList: { add: () => {}, remove: () => {} },
      style: {},
      getAttribute: () => null,
      setAttribute: () => {},
      hasAttribute: () => false,
      removeAttribute: () => {},
    },
    getElementsByTagName: () => ([]),
    createElement: () => ({ setAttribute: () => {}, style: {}, appendChild: () => {} }),
    createTextNode: () => ({}),
    querySelector: () => null,
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
  };
  global.window.document = global.document;
}

if (typeof global.navigator === 'undefined') {
  global.navigator = {
    userAgent: 'node',
  };
}
// ---------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function prerender() {
  console.log('🚀 Starting Static Site Generation...');

  const templatePath = path.join(root, 'dist/client/index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/client/index.html not found. Build client first.');
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const serverEntryPath = path.join(root, 'dist/server/entry-server.js');
  if (!fs.existsSync(serverEntryPath)) {
    console.error('❌ dist/server/entry-server.js not found. Build server first.');
    process.exit(1);
  }
  
  const { render } = await import(pathToFileURL(serverEntryPath).href);

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

  const sitemapPath = path.join(root, 'public/sitemap.xml');
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

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    if (i > 0 && i % 25 === 0) {
      console.log(`⏳ Progress: Rendered ${i} of ${urls.length} pages...`);
    }

    try {
      const rendered = render(url);
      const headStr = rendered.head || '';
      const htmlStr = rendered.html || '';

      const html = template
        .replace('</head>', `${headStr}\n</head>`)
        .replace('<div id="root"></div>', `<div id="root">${htmlStr}</div>`);

      const isFile = /\.\w+$/.test(url);
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
      console.error(`❌ Failed: ${url} ->`, e.message || e);
      failed++;
    }
  }

  console.log(`✅ SSG complete: ${success} pages rendered, ${failed} failed.`);
  
  process.exit(0);
}

prerender().catch(err => {
  console.error('Fatal SSG error:', err);
  process.exit(1);
});