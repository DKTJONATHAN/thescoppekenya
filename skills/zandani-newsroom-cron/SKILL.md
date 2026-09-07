---
name: zandani-newsroom-cron
description: Content factory and GitHub Actions cron for Za Ndani. Use when designing or scheduling writer workflows in Africa/Nairobi.
license: MIT
metadata:
  site: https://zandani.co.ke
  version: "2.0"
---

# Za Ndani newsroom cron

Stories land in `content/posts` from Actions, then the Vite build writes the manifest and sitemap.

## Path from cron to a live story

1. `writer-dispatcher.yml` cron (`8,23,38,53 3-20 * * *` UTC = 06:08–23:53 EAT) decides which desk is due (44-minute catch-up + slot ledger).
2. Dispatcher REST-POSTs `workflow_dispatch` with a URL-encoded workflow file name (spaces in `za Entertainment.yml` must be encoded).
3. The desk script scrapes a Kenya-first source, skips Hollywood / empty scores via `scripts/voice_guard.py`, rewrites with Gemini using `news_prompt`.
4. `scripts/finish_desk.py` polishes SEO, injects **What we know**, drops anything that still fails Kenya-first or banned-phrase spam.
5. Commit only if there is a new post or memory change. **No story this slot is `exit 0`**, never a red X.

## Kenya-first hard rules

- Skip Hollywood, Emmys, Oscars, Marvel, Premier League, NBA unless the Kenya score is high (local name, county, shilling).
- Keep Bahati / Ghafla / Harambee / Safaricom even when the headline does not say "Kenya".
- Body: Nairobi voice, names, counties, KSh, EAT. Banned AI filler lives in `voice_guard.BANNED_PHRASES`.
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
