# Za Ndani — working workflows

Cron lives in **one** file: `writer-dispatcher.yml`. Every writer is `workflow_call` + manual dispatch only.

## Nairobi clock (EAT)

| Desk | File | When |
|------|------|------|
| News | `za-news.yml` | Hourly 06:00–23:00 |
| Ghafla | `za-ghafla.yml` | 07:00, 11:00, 15:00, 19:00 |
| Mpasho | `za-mpasho.yml` | 07:30, 11:30, 15:30, 19:30 |
| Entertainment | `za-entertainment.yml` | 08:00, 12:00, 16:00, 20:00 |
| Africa | `za-africa.yml` | 06:15, 18:15 |
| Agriculture | `za-agriculture.yml` | 07:15, 17:15 |
| Business | `za-business.yml` | 08:15, 16:15 |
| Lifestyle | `za-lifestyle.yml` | 09:15, 15:15 |
| Opinions | `za-opinions.yml` | 10:15, 14:15 |
| Sports | `za-sports.yml` | 11:15, 19:15 |
| Technology | `za-technology.yml` | 12:15, 18:45 |
| Diano | `za-diano.yml` | 13:15, 20:15 |
| Jaj | `za-jaj.yml` | Mon + Thu 11:20, 17:20 |

Dispatcher cron (UTC): 07, 22, 37, 52 past hours 03–20.

## Other working files

| File | Role |
|------|------|
| `scheduler.yml` | Publish posts whose `publishDate` has arrived (minute 9 each hour) |
| `submit-sitemaps.yml` | Ping Google/Bing |
| `indexjump.yml` | Index new article URLs on push |
| `seo-audit.yml` | Polish + lint latest posts |
| `seo-frontmatter-guard.yml` | Normalize frontmatter on push |

Voice: report first, then a real take. No filler stacks, no repeated openers.
