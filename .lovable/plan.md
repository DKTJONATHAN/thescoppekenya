

# Implement SSG-Compatible Architecture for Za Ndani

## What This Does

This refactor prepares your site so that every page -- including individual articles -- gets its SEO keywords and meta tags stamped directly into static HTML at build time. Googlebot (and social media bots) will see your article titles, descriptions, and images instantly without needing to run JavaScript. This is how you outrank Tuko, Kenyans.co.ke, and the rest.

## What's Already Working

Most of the architecture is already in place:
- `entry-client.tsx` uses `hydrateRoot` (correct for SSG)
- `entry-server.tsx` uses `renderToString` with `StaticRouter` (correct)
- `react-helmet-async` is used on Index, Article, and Category pages
- `scripts/generate-article-html.js` creates prerendered HTML per article
- `vercel.json` build command chains all scripts together

## What Needs Fixing

### 1. Fix the SSR-Crashing Code in ArticlePage

**The Problem:** `ArticlePage.tsx` line 83 calls `document.createElement("div")`. This is a browser-only API. When the SSR build tries to render this page, it crashes because there is no `document` on the server. This is the root cause of the 500 errors you experienced.

**The Fix:** Replace the `document.createElement` approach with a pure string-based regex parser that splits the HTML content at paragraph boundaries and inserts the ad after the 4th paragraph. No browser APIs needed -- works identically on server and client.

### 2. Add a Full Prerender Script

**The Problem:** The current `generate-article-html.js` only does simple string replacement of meta tags in the base HTML. It does not actually render your React components, so Googlebot still gets an empty `<div id="root"></div>`.

**The Fix:** Create `scripts/prerender.js` that imports your compiled `entry-server.tsx`, calls `render(url)` for every route in your sitemap, and stamps the fully rendered HTML + Helmet meta tags into each static file. This means every article page will have its full content visible to crawlers at millisecond 1.

### 3. Update Build Pipeline

Update `vercel.json` build command to include both the client build and the server build, then run the prerender script:

```text
vite build --outDir dist/client
vite build --ssr src/entry-server.tsx --outDir dist/server
node scripts/generate-sitemap.js
node scripts/prerender.js
```

### 4. Update Vercel Rewrites

Update `vercel.json` rewrites so that prerendered article pages are served directly from `dist/client/article/{slug}/index.html` instead of falling through to the SPA catch-all.

## Technical Details

### Files to modify:
- **`src/pages/ArticlePage.tsx`** -- Replace `document.createElement` with a string-based HTML splitter for ad insertion
- **`vercel.json`** -- Update build command to include SSR build + prerender step, update rewrites
- **`index.html`** -- Ensure the script src matches `entry-client.tsx`

### Files to create:
- **`scripts/prerender.js`** -- Full SSG script that renders every route to static HTML using the server entry point

### Files to remove (optional cleanup):
- **`api/index.js`** -- No longer needed since we are prerendering at build time instead of doing live SSR per request
- **`server.js`** reference in package.json scripts can be cleaned up

### How it works end-to-end:

```text
Build Phase:
  1. Vite builds client bundle -> dist/client/
  2. Vite builds server entry -> dist/server/entry-server.js
  3. generate-sitemap.js creates sitemap.xml
  4. prerender.js reads sitemap, renders each URL with React,
     stamps full HTML + meta tags into dist/client/{path}/index.html

Runtime:
  - Googlebot hits /article/ruto-story -> gets fully rendered HTML with correct OG tags
  - User hits /article/ruto-story -> gets same HTML, React hydrates and takes over
  - No server, no 500 errors, no crashes
```
