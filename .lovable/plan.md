

## Sitemaps and RSS Are Already Correct

All three generation scripts properly read the `slug` from frontmatter before falling back to the filename:

- **`scripts/generate-sitemap.js`** (line 109): `data.slug || file.replace('.md', '')`
- **`scripts/rebuild-sitemap.js`** (line 74): `data.slug || file.replace('.md', '')`
- **`scripts/generate-rss.js`** (line 76): `data.slug || file.replace('.md', '')`

These already produce correct URLs like `https://zandani.co.ke/article/matatu-operators-decline-immediate-fare-cuts-despite-fuel-price-redu`.

## What Still Needs Fixing (from the previous plan)

The slug mismatch problem is isolated to the **7 GitHub Actions workflows** and **1 build script** that use the filename instead of reading frontmatter:

1. `.github/workflows/facebook blast.yml`
2. `.github/workflows/fb entertainment.yml`
3. `.github/workflows/telegram blast.yml`
4. `.github/workflows/x blast.yml`
5. `.github/workflows/indexjump.yml`
6. `.github/workflows/bingindex.yml`
7. `.github/workflows/Direct Indexer.yml`
8. `scripts/submit-new-posts.js`

The fix is the same as outlined before — extract the `slug` from each `.md` file's frontmatter using regex, falling back to filename if missing.

Shall I proceed with fixing those 8 files?

