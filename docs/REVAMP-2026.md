# Za Ndani revamp (Sept 2026)

Live site: https://zandani.co.ke
Repo: DKTJONATHAN/zandani
Stack: Vite + React + Tailwind + shadcn + Supabase + GitHub Actions writers

## What is already strong

- Dark Kenyan news chrome, Playfair headlines, orange CTAs
- Split hero + live TV + live updates rail
- en-KE, EAT clock, NewsMedia-ish schema, delayed ads/analytics
- A real content factory: dozens of desk workflows, sitemap cron, indexers

## What to raise

### Content
Load `skills/zandani-voice`. Kill banned AI phrases in every za-*.yml prompt. Force a Kenya hook on regional wires. Label satire. Require a What we know box on news.

### UI
Load `skills/zandani-ui`. Keep the homepage grammar. Add county shelf, sticky mobile article bar, explicit image ratios, corrections chip when a story is updated.

### SEO
Load `skills/zandani-seo-geo`. Upgrade Organization JSON-LD to NewsMediaOrganization with areaServed Kenya. Keep canonicals per-route only. Question-style H2s. Author + ethics/corrections stay public.

### GEO (answer engines)
40-60 word standalone lede. Named people, KSh, counties in text. Primary-source links. speakable schema on the lede.

### Cron
Load `skills/zandani-newsroom-cron`. Collapse overlapping desks onto the Nairobi clock. Quality gate before commit. Blast social only after HTTP 200. Human gate for deaths, kids, elections.
