# Za Ndani publishing schedule (Africa/Nairobi = EAT = UTC+3)

GitHub Actions cron is always **UTC**. Times below show both.

## Hourly (high volume)

| Category | Workflow | EAT window | UTC cron |
|----------|----------|------------|----------|
| **News** | `za-news.yml` | Every hour **06:05–23:05** | `5 3-20 * * *` |
| **Entertainment** | `za-entertainment-hourly.yml` → `za Entertainment.yml` | Every hour **06:25–23:25** | `25 3-20 * * *` |

## Daily staggered slots (avoid collisions)

| Category | Workflow | EAT | UTC cron |
|----------|----------|-----|----------|
| Africa / Pan-Africa | `za africa.yml` | 06:08 | `8 3 * * *` |
| Agriculture | `za agriculture.yml` | 07:09 | `9 4 * * *` |
| Business | `za business.yml` | 08:10 | `10 5 * * *` |
| Gossip (Ghafla) | `za ghafla.yml` | 09:12 | `12 6 * * *` |
| Lifestyle | `za lifestyle.yml` | 10:14 | `14 7 * * *` |
| Showbiz (Mpasho) | `za mpasho.yml` | 11:15 | `15 8 * * *` |
| Opinions | `za opinions.yml` | 12:17 | `17 9 * * *` |
| Sports | `za sports.yml` | 13:19 | `19 10 * * *` |
| Technology | `za technology.yml` | 14:20 | `20 11 * * *` |
| George Diano | `za diano.yml` | 15:11 | `11 12 * * *` |
| Podcast / daily brief | `podcast-generator.yml` | 07:05 | `5 4 * * *` |

## Weekly / lighter

| Job | Workflow | When |
|-----|----------|------|
| EEAT clusters | `EEAT BUILDER.yml` | Mon & Thu 09:01 EAT (`1 6 * * 1,4`) |
| Opinionated columnist | `za jaj.yml` | Mon & Thu 11:13 EAT |
| Satirical narrator | `satirical-narrator.yml` | Tue & Fri 14:05 EAT |

## Quality gates

After each writer success, `after-writers-quality.yml` runs:
1. Quarantine spam → `content/archive-spam/`
2. Polish posts
3. SEO lint (fails on spam leads / repetition)

## Notes

- `za-news-hourly.yml` is **disabled** (redundant with hourly `za-news.yml`).
- Stagger minutes (:05 news, :25 entertainment, other categories at unique minutes) to reduce runner contention and Gemini quota spikes.
- Night quiet hours ~00:00–06:00 EAT: no hourly news/entertainment.
