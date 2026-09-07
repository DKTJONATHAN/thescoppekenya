---
name: zandani-newsroom-cron
description: Content factory and GitHub Actions cron for Za Ndani. Use when designing or scheduling writer workflows in Africa/Nairobi.
license: MIT
metadata:
  site: https://zandani.co.ke
  version: "1.0"
---

# Za Ndani newsroom cron

Stories land in content/posts from Actions, then the Vite build writes the manifest and sitemap.

## Four loops

1. Intake — desk workflows, one story per run, memory JSON against duplicates
2. Quality gate — seo-frontmatter-guard, banned phrases, EAT dates
3. Publish — manifest + sitemap + indexer
4. Distribution — social only after the URL returns 200

## Nairobi clock

- 05:45 Africa + overnight
- 06:05-21:05 hourly news
- 07:30 / 13:30 / 19:30 entertainment
- 09:00 / 16:00 business + tech
- 00:30 06:30 12:30 18:30 sitemap
- 22:30 EEAT sweep

Human gate for legal, elections, deaths, children.
