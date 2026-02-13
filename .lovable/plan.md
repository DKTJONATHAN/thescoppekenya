

# Fix Social Media Previews + SEO/GEO Optimization

## The Problem

Your site is a Single Page Application (SPA). When someone shares an article link on Facebook, Twitter/X, WhatsApp, or LinkedIn, those platforms send a bot to fetch the page. The bot does NOT run JavaScript -- it only reads the raw HTML. Right now, every article URL returns the same generic `index.html` with:

- Title: "The Scoop KE | Kenya's First Sheng News..."
- Description: Generic site description
- Image: `og-image.jpg` (same for every article)

So every shared link looks identical -- no article title, no article image, no article description.

## The Solution

### 1. Build-Time Prerendering for Social Media Previews

Create a new build script (`scripts/generate-article-html.js`) that runs after `vite build`. For each markdown post, it generates a minimal HTML file at `dist/article/{slug}/index.html` containing:

- Correct `<title>` with article title
- `og:title`, `og:description`, `og:image` meta tags
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` meta tags
- JSON-LD structured data (NewsArticle schema)
- A `<script>` tag that loads the SPA bundle so the full React app takes over in the browser

This way, when a bot crawls `/article/some-slug`, Vercel serves the static HTML file with the correct preview metadata. When a real user visits, the React app hydrates normally.

### 2. Dynamic Head Updates with react-helmet-async

Install `react-helmet-async` and add it to `ArticlePage.tsx` so that:
- Google (which does execute JS) sees correct meta tags
- The browser tab shows the article title
- Client-side navigation updates meta tags properly

Also add Helmet to `CategoryPage.tsx`, `TagPage.tsx`, and `Index.tsx` for proper page titles throughout.

### 3. SEO Optimizations

- **Fix canonical URLs**: `index.html` currently points to `thescoopkenya.co.ke` but the site runs on `thescoopkenya.vercel.app`. Update all references to be consistent.
- **Fix `robots.txt`**: Update sitemap URL from `thescoopkenya.co.ke` to `thescoopkenya.vercel.app`.
- **Add `hreflang` tag**: Since the content is in Sheng (Swahili-based), add `<link rel="alternate" hreflang="sw-KE">` to help search engines understand the language.
- **Improve structured data**: Add `BreadcrumbList` schema on article pages for rich search results.
- **Add `article:published_time`** and `article:section` Open Graph tags for better social previews.

### 4. GEO (Generative Engine Optimization) Improvements

GEO is about making your content more likely to be cited by AI systems (ChatGPT, Gemini, Perplexity, etc.):

- **Improve `llms.txt`**: Enhance the existing `llms.txt` generation script to include more structured information about the site, content categories, and article summaries that AI crawlers can parse.
- **Add FAQ structured data**: Where applicable, wrap common Q&A patterns in `FAQPage` schema so AI engines can extract them.
- **Ensure clean semantic HTML**: The article content rendering already uses proper HTML via `marked` -- this is good for GEO.
- **Add `ai.txt`** (emerging standard): A simple file in `/public` signaling to AI crawlers what content is available for training/citation.

## Technical Details

### Files to create:
- `scripts/generate-article-html.js` -- Build script that generates prerendered HTML for each article with OG tags
- `public/ai.txt` -- AI crawler guidance file

### Files to modify:
- `index.html` -- Fix canonical URL and base OG tags to use `thescoopkenya.vercel.app`
- `public/robots.txt` -- Fix sitemap URL to `thescoopkenya.vercel.app`
- `src/pages/ArticlePage.tsx` -- Add `react-helmet-async` for dynamic meta tags
- `src/pages/Index.tsx` -- Add Helmet for homepage meta
- `src/pages/CategoryPage.tsx` -- Add Helmet for category meta
- `src/App.tsx` -- Wrap with `HelmetProvider`
- `vercel.json` -- Update build command to include the article HTML generation step
- `scripts/generate-llms-txt.js` -- Enhance with more structured content for GEO

### New dependency:
- `react-helmet-async` -- For dynamic document head management

### Build pipeline update (vercel.json):
The build command becomes:
```
node scripts/generate-llms-txt.js && node scripts/generate-rss.js && node scripts/submit-new-posts.js && vite build && node scripts/generate-sitemap.js && node scripts/generate-article-html.js
```

The new `generate-article-html.js` runs last (after `vite build`) because it needs the built `dist` folder to exist and reads the `index.html` as a template.

### How the prerendered HTML works:

For each post, the script creates a file like `dist/article/ruto-majembe-mbavu-dosh-pr-stunt/index.html` containing:

```text
<!doctype html>
<html lang="sw">
<head>
  <title>Ruto Ametupia Majembe... | The Scoop KE</title>
  <meta property="og:title" content="Ruto Ametupia Majembe..." />
  <meta property="og:description" content="Tumenusa gava imetupilia..." />
  <meta property="og:image" content="https://images.unsplash.com/..." />
  <meta name="twitter:card" content="summary_large_image" />
  ... (all meta tags)
  <script type="application/ld+json">{ NewsArticle schema }</script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Vercel will serve this static file to bots (who get the OG tags) and to browsers (where React takes over).

