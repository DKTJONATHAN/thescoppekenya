
# Auto-Updating Sitemap + IndexJump on Commit

## What You Already Have

Your project already has most of the pieces in place:
- `scripts/generate-sitemap.js` - generates sitemap.xml at build time
- `scripts/submit-new-posts.js` - submits new/changed posts to IndexJump at build time
- Both run during Vercel builds via `vercel.json` buildCommand
- A Supabase edge function `index-now` for manual IndexJump submissions

## What Needs to Change

### 1. Fix the sitemap URL to use `thescoopkenya.vercel.app`
The sitemap script currently uses `thescoopkenya.co.ke`. Update to `thescoopkenya.vercel.app`.

### 2. Create a visual `/sitemap` page
Add a new route at `/sitemap` that renders a human-readable HTML page listing all article links (not the XML sitemap). The XML sitemap stays at `/sitemap.xml`.

### 3. Create a GitHub Actions workflow for IndexJump on commit
Add a new workflow (`.github/workflows/indexjump.yml`) that triggers whenever a `.md` file is added/changed in `content/posts/`. It will:
- Detect which post files changed
- Build their full URLs
- Submit them to IndexJump using the `INDEXJUMP_API_KEY` stored in GitHub Secrets

This runs independently from the Vercel build, so indexing happens as soon as the commit lands - not after the build finishes.

### 4. Keep the Vercel build pipeline as-is
The existing `submit-new-posts.js` in the build command acts as a safety net (in case the GitHub Action misses something).

## Technical Details

### Files to modify:
- **`scripts/generate-sitemap.js`** - Change `SITE_URL` from `https://thescoopkenya.co.ke` to `https://thescoopkenya.vercel.app`
- **`scripts/submit-new-posts.js`** - Already uses `thescoopkenya.vercel.app` (no change needed)

### Files to create:
- **`.github/workflows/indexjump.yml`** - New workflow triggered on push to `content/posts/*.md`, reads `INDEXJUMP_API_KEY` from GitHub secrets, submits changed URLs to IndexJump API
- **`src/pages/SitemapHtmlPage.tsx`** - A styled page at `/sitemap` that lists all article links in a readable format

### Files to update:
- **`src/App.tsx`** - Add `/sitemap` route pointing to the new HTML sitemap page
- **`vercel.json`** - Add rewrite for `/sitemap` so it works on refresh

### GitHub Secrets needed:
You'll need to add `INDEXJUMP_API_KEY` to your GitHub repo secrets (Settings > Secrets and variables > Actions > New repository secret). This is separate from the Vercel/Supabase environment variable you may already have.

## How it works end-to-end:

```text
New post committed to GitHub
       |
       +--> GitHub Action triggers immediately
       |        |
       |        +--> Detects changed .md files
       |        +--> Submits URLs to IndexJump API
       |
       +--> Vercel build triggers
                |
                +--> submit-new-posts.js (backup IndexJump submit)
                +--> vite build
                +--> generate-sitemap.js (regenerates sitemap.xml)
                +--> Site deployed with updated sitemap
```
