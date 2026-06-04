# Content Workflow Audit

Date: 2026-06-04

## Bad Practices Found

1. Headlines used hype patterns such as "shocking", "massive", "explosive", "truth", "revealed", and "breaking news" even when the story was not breaking.
2. Some generated article titles and slugs carried stale year language, including 2024 phrasing inside 2026 content.
3. The main writing pipeline rotated between entertainment styles that encouraged teaser endings, open questions, "wow-factor" framing, and social-media-first language.
4. The second scraper used a cleaner headline prompt, but the article prompt still asked for witty, celebrity-focused writing instead of a consistent newsroom voice.
5. Undated scraped pages could be treated as fresh, increasing the risk of publishing stale or evergreen content as news.
6. The normalization script appended the same "What this means for Kenyans", "Key facts", and "FAQ" sections to many posts, creating boilerplate pages.
7. Internal links in one workflow were selected randomly, which can create irrelevant links and weak topical signals.
8. Candidate filtering was too loose, allowing policy, terms, and other low-value pages to enter article workflows.
9. Thin source text thresholds were too low in the main pipeline, making rewrites possible from weak evidence.
10. Quality review relied heavily on AI self-scoring and did not have deterministic checks for hype, stale years, source leaks, generic filler, or article length.
11. Meta descriptions used generic CTA-style endings such as "Read the full story" and boilerplate "key facts" language.
12. The workflow could create duplicate topics through similar slugs and repeated coverage of the same event.

## Recommendations

1. Publish fewer but stronger articles. Skip stories without a clear publish date, enough source text, or a distinct new development.
2. Use one house style across all generators: clear lede, verified facts, specific context, restrained ending.
3. Keep titles factual and specific. Put the person, agency, team, show, or event first and avoid hype words.
4. Remove stale years from titles and slugs unless the year is part of the actual entity or event name.
5. Stop adding generic SEO sections automatically. Add explainers, FAQs, or bullet lists only when the story genuinely needs them.
6. Make internal links topic-matched by entity and subject overlap.
7. Treat claims, reactions, and allegations separately from confirmed facts.
8. Use deterministic quality gates after AI review so bad patterns are blocked even when the model misses them.
9. Keep meta descriptions useful and factual, around 120-150 characters, without CTA filler.
10. Monitor Search Console by template type: title style, category, article length, source freshness, and duplicate topic clusters.

## Workflow Changes Made

1. `_pipeline.py` now bans more hype phrases and uses restrained editorial style presets.
2. `_pipeline.py` now skips undated scraped pages instead of treating them as fresh.
3. `_pipeline.py` now rejects thin, policy, utility, and stale-year candidates before writing.
4. `_pipeline.py` now cleans titles, checks duplicate slugs, and runs deterministic quality gates before saving.
5. `_pipeline.py` now asks AI reviewers to detect unsupported claims, hype, and generic filler.
6. `run_scraper.py` now uses the same factual house style, skips undated pages, cleans hype from titles, and uses topic-matched internal links.
7. `scripts/normalize_posts_seo.py` now removes generic boilerplate sections instead of appending them to every article.
