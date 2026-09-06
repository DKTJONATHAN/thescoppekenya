# Za Ndani — Workflow map (who scrapes what)

GitHub Actions UI shows the workflow **`name:`** field. Filenames stay as-is for path stability.

## Writer / scraper workflows

| Workflow file | Actions display name | Author persona | Source site / feed |
|---------------|----------------------|----------------|--------------------|
| `za-news.yml` | **News \| Celestine Nzioka ← kenyans.co.ke** | Celestine Nzioka | https://www.kenyans.co.ke/news |
| `za Entertainment.yml` | **Entertainment \| Mutheu Ann ← ew.com** | Mutheu Ann | https://ew.com/ |
| `za ghafla.yml` | **Gossip \| Wanjiku Kuria ← ghafla.co.ke** | Wanjiku Kuria | https://www.ghafla.co.ke/ke/ |
| `za mpasho.yml` | **Showbiz \| Martin Kihara ← mpasho.co.ke** | Martin Kihara | https://www.mpasho.co.ke/ |
| `za sports.yml` | **Sports \| Jona Munyi ← bbc.com/sport/football** | Jona Munyi | https://www.bbc.com/sport/football |
| `za business.yml` | **Business \| Grace Mkamburi ← kenyanwallstreet.com** | Grace Mkamburi | https://kenyanwallstreet.com/ |
| `za opinions.yml` | **Opinions \| Jonathan Mwaniki ← the-star.co.ke/opinion** | Jonathan Mwaniki | https://www.the-star.co.ke/opinion/ |
| `za lifestyle.yml` | **Lifestyle \| Jona Munyi ← pulse.co.ke/lifestyle** | Jona Munyi | https://www.pulse.co.ke/lifestyle |
| `za technology.yml` | **Technology \| Elizabeth Muthoni ← techweez.com** | Elizabeth Muthoni | https://techweez.com/ |
| `za agriculture.yml` | **Agriculture \| Timothy Muli ← smartfarmerkenya.com** | Timothy Muli | https://smartfarmerkenya.com/ |
| `za africa.yml` | **Pan-Africa Ent. \| Amara Ndlovu ← pulse.ng/entertainment** | Amara Ndlovu | https://www.pulse.ng/entertainment |
| `za diano.yml` | **Diano/X \| Zed Mogaka ← @georgediano (X/Twitter)** | Zed Mogaka | **X/Twitter `@georgediano`** via syndication.twitter.com + Nitter RSS fallbacks |

### Dispatchers (trigger another workflow)

| File | What it does |
|------|----------------|
| `za-entertainment-hourly.yml` | Hourly dispatch of **Entertainment \| Mutheu Ann ← ew.com** |
| `za-news-hourly.yml` | Disabled manual dispatch helper for News (News is hourly on its own) |

### Zed Mogaka / Ndiano (George Diano) — detail

- **File:** `.github/workflows/za diano.yml`
- **Persona:** Zed Mogaka
- **Source:** X/Twitter account **`@georgediano`** (George T. Diano)
- **How it scrapes:**
  1. Primary: `https://syndication.twitter.com/srv/timeline-profile/screen-name/georgediano`
  2. Fallback: Nitter RSS mirrors (`/{account}/rss`)
- **Not a normal news site scraper** — it turns recent tweets into satirical/context articles with Gemini + Google Search grounding.

## Quality / ops (not content scrapers)

| File | Role |
|------|------|
| `after-writers-quality.yml` | Quarantine spam + polish + SEO lint after writers |
| `harden-writers.yml` | Patch anti-spam rules into writer pipelines |
| `purge-all-posts.yml` | Delete all posts + archive |
| `cleanup-keep-recent.yml` | Keep last-24h posts only |
| `scheduler.yml` | Hourly scheduler hub |
| `submit-sitemaps.yml` | Sitemap ping |
| `seo-audit.yml` / `seo-frontmatter-guard.yml` | SEO checks |
| `podcast-generator.yml` | Podcast from content |
| `satirical-narrator.yml` | Satirical columnist |
| `za jaj.yml` | Opinionated columnist (Jaj) |
| `automation.yml` | Broad multi-source research generator |
| `za manual.yml` | Manual article scraper |
| Social blast workflows (`x blast`, `telegram`, `facebook`, etc.) | Distribution, not scraping |

## Schedule reminder (EAT)

See `docs/PUBLISHING_SCHEDULE.md`.
