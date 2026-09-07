# Za Ndani — Workflow map (who scrapes what)

GitHub Actions UI shows the workflow **`name:`** field. Filenames stay as-is for path stability.

## Writer / scraper workflows

| Workflow file | Actions display name | Author persona | Source site / feed |
|---------------|----------------------|----------------|--------------------|
| `za-news.yml` | **News \| Celestine Nzioka ← kenyans.co.ke** | Celestine Nzioka | https://www.kenyans.co.ke/news |
| `za Entertainment.yml` | **Entertainment \| Mutheu Ann ← pulselive.co.ke** | Mutheu Ann | https://www.pulselive.co.ke/articles/entertainment |
| `za mpasho.yml` | **Showbiz \| Martin Kihara ← standardmedia.co.ke** | Martin Kihara | https://www.standardmedia.co.ke/entertainment |
| `za sports.yml` | **Sports \| Jona Munyi ← nation.africa/kenya/sports** | Jona Munyi | https://nation.africa/kenya/sports |
| `za business.yml` | **Business \| Grace Mkamburi ← kenyanwallstreet.com** | Grace Mkamburi | https://kenyanwallstreet.com/ |
| `za opinions.yml` | **Opinions \| Jonathan Mwaniki ← the-star.co.ke/opinion** | Jonathan Mwaniki | https://www.the-star.co.ke/opinion/ |
| `za lifestyle.yml` | **Lifestyle \| Jona Munyi ← pulse.co.ke/lifestyle** | Jona Munyi | https://www.pulse.co.ke/lifestyle |
| `za technology.yml` | **Technology \| Elizabeth Muthoni ← techweez.com** | Elizabeth Muthoni | https://techweez.com/ |
| `za agriculture.yml` | **Agriculture \| Timothy Muli ← smartfarmerkenya.com** | Timothy Muli | https://smartfarmerkenya.com/ |
| `za africa.yml` | **Pan-Africa Ent. \| Amara Ndlovu ← pulse.ng/entertainment** | Amara Ndlovu | https://www.pulse.ng/entertainment |
| `za diano.yml` | **Diano/X \| Zed Mogaka ← @georgediano (X/Twitter)** | Zed Mogaka | **X/Twitter `@georgediano`** via syndication.twitter.com + Nitter RSS fallbacks |
| `automation.yml` | **Sports \| Nation Kenya sports** | Sports Desk | https://nation.africa/kenya/sports |

Removed: `za ghafla.yml` (ghafla.co.ke). Mpasho is no longer a source; Martin now uses Standard entertainment.

### Dispatchers (trigger another workflow)

| File | What it does |
|------|----------------|
| `za-entertainment-hourly.yml` | Hourly dispatch of **Entertainment \| Mutheu Ann ← pulselive.co.ke** |
| `za-news-hourly.yml` | Disabled manual dispatch helper for News (News is hourly on its own) |
| `retarget-kenya-sources.yml` | One-shot rewrite of leftover international / Mpasho / Football365 URLs |

### Zed Mogaka / Ndiano (George Diano) — detail

- **File:** `.github/workflows/za diano.yml`
- **Persona:** Zed Mogaka
- **Source:** X/Twitter account **`@georgediano`** (George T. Diano)

## Quality / ops (not content scrapers)

| File | Role |
|------|------|
| `harden-writers.yml` | Patch anti-spam rules into writer pipelines |
| `scheduler.yml` | Hourly scheduler hub |
| `submit-sitemaps.yml` | Sitemap ping |
| `seo-audit.yml` / `seo-frontmatter-guard.yml` | SEO checks |
| `podcast-generator.yml` | Podcast from content |
| `satirical-narrator.yml` | Satirical columnist |
| `za jaj.yml` | Opinionated columnist (Jaj) |
| `za manual.yml` | Manual article scraper |
| Social blast workflows (`x blast`, `telegram`, `facebook`, etc.) | Distribution, not scraping |

Removed quality/delete workflows: `after-writers-quality.yml` (was quarantining legitimate posts). `purge-all-posts.yml` and `cleanup-keep-recent.yml` are not present in the tree.

## Schedule reminder (EAT)

See `docs/PUBLISHING_SCHEDULE.md`.
