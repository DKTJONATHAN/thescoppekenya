# Za Ndani — Workflow map (who scrapes what)

GitHub Actions UI shows the workflow **`name:`** field. Filenames stay as-is for path stability.

## Writer / scraper workflows

| Workflow file | Actions display name | Author persona | Source site / feed |
|---------------|----------------------|----------------|--------------------|
| `za-news.yml` | **News \| Celestine Nzioka ← kenyans.co.ke** | Celestine Nzioka | https://www.kenyans.co.ke/news |
| `za ghafla.yml` | **Gossip \| Wanjiku Kuria ← ghafla.co.ke** | Wanjiku Kuria | https://www.ghafla.co.ke/ |
| `za mpasho.yml` | **Showbiz \| Martin Kihara ← mpasho.co.ke** | Martin Kihara | https://www.mpasho.co.ke/ |
| `za Entertainment.yml` | **Entertainment \| Mutheu Ann ← pulselive.co.ke** | Mutheu Ann | https://www.pulselive.co.ke/articles/entertainment |
| `za sports.yml` | **Sports \| Jona Munyi ← nation.africa/kenya/sports** | Jona Munyi | https://nation.africa/kenya/sports |
| `za business.yml` | **Business \| Grace Mkamburi ← kenyanwallstreet.com** | Grace Mkamburi | https://kenyanwallstreet.com/ |
| `za opinions.yml` | **Opinions \| Jonathan Mwaniki ← the-star.co.ke/opinion** | Jonathan Mwaniki | https://www.the-star.co.ke/opinion/ |
| `za lifestyle.yml` | **Lifestyle \| Jona Munyi ← pulse.co.ke/lifestyle** | Jona Munyi | https://www.pulse.co.ke/lifestyle |
| `za technology.yml` | **Technology \| Elizabeth Muthoni ← techweez.com** | Elizabeth Muthoni | https://techweez.com/ |
| `za agriculture.yml` | **Agriculture \| Timothy Muli ← smartfarmerkenya.com** | Timothy Muli | https://smartfarmerkenya.com/ |
| `za africa.yml` | **Pan-Africa Ent. \| Amara Ndlovu ← pulse.ng/entertainment** | Amara Ndlovu | https://www.pulse.ng/entertainment |
| `za diano.yml` | **Diano/X \| Zed Mogaka ← @georgediano (X/Twitter)** | Zed Mogaka | **X/Twitter `@georgediano`** via syndication.twitter.com + Nitter RSS fallbacks |
| `automation.yml` | **Sports \| Nation Kenya sports** | Sports Desk | https://nation.africa/kenya/sports |

### Uniqueness rules (Ghafla + Mpasho + other writers)

- Separate memory files per persona (URL hash + title/text hash, style history, angle history).
- Style preset rotation (avoid same style 2–3 runs in a row).
- Angle planner + similarity review; soft rewrite if source similarity or house-style repetition is high.
- Age filter on source articles; skip already-published hashes.
- Brand scrub so Ghafla / Mpasho / Nation / Standard never leak into published copy.

### Dispatchers (trigger another workflow)

| File | What it does |
|------|----------------|
| `za-entertainment-hourly.yml` | Hourly dispatch of **Entertainment \| Mutheu Ann** |
| `za-news-hourly.yml` | Disabled manual dispatch helper for News (News is hourly on its own) |
| `retarget-kenya-sources.yml` | One-shot helper; **must not** strip Ghafla or Mpasho |

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

## Schedule reminder (EAT)

See `docs/PUBLISHING_SCHEDULE.md`.
