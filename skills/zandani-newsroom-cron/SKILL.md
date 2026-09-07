---
name: zandani-newsroom-cron
description: Content factory and GitHub Actions cron for Za Ndani. Use when designing or scheduling writer workflows in Africa/Nairobi.
license: MIT
metadata:
  site: https://zandani.co.ke
  version: "2.1"
---

# Za Ndani newsroom cron

Stories land in `content/posts` from Actions, then the Vite build writes the manifest and sitemap.

## Path from cron to a live story

1. `writer-dispatcher.yml` cron (UTC `7,22,37,52` of hours 03-20 = 06:07-23:52 EAT) decides which desk is due (59-minute catch-up + slot ledger).
2. Due desks run as reusable `workflow_call` jobs (`uses: ./.github/workflows/za-news.yml` + `secrets: inherit`). No REST dispatch, no filenames with spaces.
3. The desk script scrapes a Kenya-first source, skips Hollywood via `scripts/voice_guard.py`, rewrites with Gemini using `news_prompt` (report, then a real take).
4. `scripts/finish_desk.py` polishes SEO, injects **What we know**, drops Kenya-fail or repetitive spam. Commentary headings stay.
5. Commit only if there is a new post or memory change. **No story this slot is `exit 0`**, never a red X.

## Kenya-first hard rules

- Skip Hollywood, Emmys, Oscars, Marvel, Premier League, NBA unless the Kenya score is high (local name, county, shilling).
- Keep Bahati / Ghafla / Harambee / Safaricom even when the headline does not say "Kenya".
- Body: Nairobi voice, names, counties, KSh, EAT. Report first, then commentary. Banned AI filler lives in `voice_guard.BANNED_PHRASES`. Never reuse last week's opener.
- Frontmatter: title ≤ 65, description 120–155, `county`, `schema: NewsArticle`.

## Nairobi clock (owned by dispatcher)

- News: every hour 06–23 EAT at HH:00
- Ghafla: 07:00 11:00 15:00 19:00
- Mpasho: 07:30 11:30 15:30 19:30
- Entertainment: 08:00 12:00 16:00 20:00
- Africa 06:15 / 18:15 · Agriculture 07:15 / 17:15 · Business 08:15 / 16:15
- Lifestyle 09:15 / 15:15 · Opinions 10:15 / 14:15 · Sports 11:15 / 19:15
- Technology 12:15 / 18:45 · Diano 13:15 / 20:15 · Jaj Mon+Thu 11:20 / 17:20

Do not put `schedule:` on individual writer YAMLs. Timing is the dispatcher.

Human gate for legal, elections, deaths, children.
