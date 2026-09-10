# Za Ndani

**[Za Ndani](https://zandani.co.ke)** is a Kenyan digital newsroom covering politics, business, culture, entertainment, sports, technology, and opinion from a Nairobi desk that stays close to the street.

We publish for readers who want clear reporting and sharp commentary on what is happening in Kenya, across East Africa, on the continent, and in the wider world when it lands here.

## Our newsroom

Za Ndani is powered by dedicated journalists who keep watch on developments at home and abroad:

- **News & politics** — Celestine Nzioka and the news desk follow government, courts, counties, and public accountability.
- **Business & economy** — coverage of markets, policy, and the everyday cost of living.
- **Entertainment & showbiz** — Mutheu Ann and Martin Kihara track music, film, celebrity, and culture.
- **Sports** — local leagues, national teams, and the stories behind the scoreline.
- **Technology & lifestyle** — how digital life, work, and style are changing in Kenya.
- **Opinion** — columnists including Jonathan Mwaniki and Jaj write independent takes on the issues that shape public debate.
- **East Africa & the continent** — Amara Ndlovu and colleagues report beyond the border when the story matters to our readers.

Visit the live site: **[https://zandani.co.ke](https://zandani.co.ke)**

## What’s in this repository

This monorepo holds the public website and the content that powers it.

### Frontend

- **React 18** + **TypeScript** + **Vite**
- **React Router** for client-side routing
- **Tailwind CSS** and **shadcn/ui** (Radix) for layout and components
- **React Helmet Async** for document titles and social meta tags
- Article pages, category hubs, homepage modules, and newsletter signup

### Content

- Articles live as Markdown files under `content/posts/`
- Each post has YAML front matter: title, slug, description, excerpt, date, author, category, image, tags, and related SEO fields
- At build time, `scripts/generate-post-manifest.js` turns those files into `public/posts-manifest.json` for fast listing on the homepage and category pages
- SEO helpers (`generate-seo.js`, `inject-meta.js`) produce sitemaps, JSON-LD, and page meta

### Edge & hosting

- Production is served through **Cloudflare** (`wrangler` worker + static assets)
- The worker handles SPA routing and API routes such as newsletter subscribe

### Local development

```bash
npm install
npm run dev
```

Build a production bundle:

```bash
npm run build
```

Preview the build:

```bash
npm run preview
```

## Structure (high level)

```
content/posts/     # Markdown articles
src/               # React app (pages, components, lib)
scripts/           # Manifest, SEO, and editorial tooling
public/            # Static assets and generated manifest
worker.js          # Cloudflare Worker entry
```

## Editorial standards

- Kenya-first framing: stories are written for readers in Nairobi, the counties, and the diaspora who care about home.
- Clear attribution and concrete detail over vague summary.
- Opinion is labelled as opinion; news is reported as news.

## Links

- Website: [https://zandani.co.ke](https://zandani.co.ke)
- Repository: [https://github.com/DKTJONATHAN/zandani](https://github.com/DKTJONATHAN/zandani)

---

© Za Ndani. All rights reserved.
