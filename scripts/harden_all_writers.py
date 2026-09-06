#!/usr/bin/env python3
"""Harden embedded AI writer pipelines in .github/workflows/za*.yml.

Fixes:
- Expand BANNED_PHRASES with known spam leads
- Force hard-news lead + labelled Analysis structure in write prompts
- Replace "never block publishing" soft uniqueness with hard fail on spam
- Inject runtime is_spam() gate before saving markdown
- Strip BOM from workflow files
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(".github/workflows")

EXTRA_BANS = [
    '"is central to this update for kenyan readers"',
    '"is the central subject of the update"',
    '"what this means for kenyans"',
    '"search-ready summary"',
    '"key takeaway"',
    '"in a significant development"',
    '"sparking conversations"',
    '"taking social media by storm"',
]

HARD_RULES_BLOCK = '''                  "WRITE THE ARTICLE IN PURE MARKDOWN with this exact order:\\n"
                  "1) HARD NEWS LEAD (mandatory, 1-2 sentences only): Who + what + when + where + why/how. "
                  "Name the main actor and the action first. No opinion in the lead.\\n"
                  "2) FACTUAL BODY (3-6 short paragraphs): evidence, numbers, official statements, who is affected.\\n"
                  "3) ANALYSIS section under an H2 heading exactly 'Analysis': openly labelled commentary only here.\\n\\n"
                  "Hard rules:\\n- 550 to 750 words.\\n"
                  "- Start with an H2 heading, then the hard news lead paragraph.\\n"
                  "- Use 2 or 3 H3 subheadings in the body.\\n"
                  "- No HTML. No frontmatter. No author byline. No date line.\\n"
                  "- No em-dashes or en-dashes. Use single hyphens only.\\n"
                  "- Do NOT mention or link to the original source publication or its brand.\\n"
                  "- Do NOT echo whole sentences from the source. Reframe everything.\\n"
                  "- NEVER write the phrases: is central to this update for Kenyan readers; "
                  "is the central subject of the update; what this means for Kenyans; search-ready summary.\\n"
                  "- NEVER repeat the same sentence or near-sentence. If a fact is stated once, do not restate it.\\n"
                  "- Each paragraph must add new information.\\n"
                  "- Do not open with a generic relevance line.\\n"
                  "- Do not add FAQ, Key Facts, or templated summary blocks.\\n"'''

IS_SPAM_FN = '''
          def is_spam_article(text):
              if not text:
                  return True
              low = text.lower()
              spam_marks = [
                  "is central to this update for kenyan readers",
                  "is the central subject of the update",
                  "what this means for kenyans",
                  "search-ready summary",
                  "key facts",
                  "frequently asked questions",
              ]
              if any(m in low for m in spam_marks):
                  print("Spam phrase detected")
                  return True
              words = re.findall(r"\\w+", text)
              if len(words) < 350:
                  print(f"Too thin: {len(words)} words")
                  return True
              # Repetition: most common 8-word window share
              toks = re.findall(r"[a-z0-9]+", low)
              if len(toks) > 80:
                  windows = [" ".join(toks[i:i+8]) for i in range(0, len(toks)-7)]
                  from collections import Counter
                  c = Counter(windows)
                  top = c.most_common(1)[0][1] if c else 0
                  if top >= 4:
                      print(f"Repetition windows top={top}")
                      return True
              return False
'''

HARD_FAIL_SNIPPET = '''
          if is_spam_article(article_md):
              print("HARD FAIL: spam/thin/repetitive article — not publishing")
              sys.exit(1)
'''


def strip_bom(text: str) -> str:
    return text[1:] if text.startswith("\ufeff") else text


def expand_banned_phrases(text: str) -> str:
    # Find BANNED_PHRASES = [ ... ]
    m = re.search(r"BANNED_PHRASES\s*=\s*\[(.*?)\]", text, re.S)
    if not m:
        return text
    block = m.group(1)
    missing = [b for b in EXTRA_BANS if b.lower().replace("'", '"') not in block.lower() and b not in block]
    if not missing:
        return text
    insertion = ",\n              " + ",\n              ".join(missing)
    # insert before closing of list content
    new_block = block.rstrip()
    if new_block and not new_block.endswith(","):
        new_block += ","
    new_block += insertion + "\n          "
    return text[: m.start(1)] + new_block + text[m.end(1) :]


def harden_write_prompt(text: str) -> str:
    # Replace the common "WRITE THE ARTICLE IN PURE MARKDOWN." rules block start
    # with our stronger structure when present.
    patterns = [
        r'"WRITE THE ARTICLE IN PURE MARKDOWN\.\\n"\s*\n\s*"Hard rules:\\n- 550 to 750 words\.\\n"',
        r'"WRITE THE ARTICLE IN PURE MARKDOWN\.\n"\s*\n\s*"Hard rules:\n- 550 to 750 words\.\n"',
    ]
    for pat in patterns:
        if re.search(pat, text):
            text = re.sub(pat, HARD_RULES_BLOCK.strip(), text, count=1)
            break

    # Opinions / softer writers: still ban spam leads
    if "is central to this update for Kenyan readers" not in text:
        text = text.replace(
            '"- Banned phrases: {\', '.join(BANNED_PHRASES)}.\\n"',
            '"- Banned phrases: {\', '.join(BANNED_PHRASES)}.\\n"\n'
            '                  "- NEVER use: is central to this update for Kenyan readers; '
            'is the central subject of the update.\\n"',
        )
    return text


def replace_soft_uniqueness(text: str) -> str:
    # Turn soft "never block" into hard fail
    text = text.replace(
        "# Soft uniqueness retry: never block publishing",
        "# Hard uniqueness: spam/thin content must not publish",
    )
    # After review thresholds, if still high sim/rep — exit
    soft = (
        "          # Soft uniqueness retry: never block publishing\n"
        "          if sim >= 8:"
    )
    # Broader: after scrub_source_leaks, inject is_spam
    if "def is_spam_article" not in text:
        # inject function near scrub_source_leaks or before stage_write
        anchor = "def scrub_source_leaks(text):"
        if anchor in text:
            text = text.replace(anchor, IS_SPAM_FN + "\n          " + anchor, 1)
        else:
            # inject before raw_keys
            text = text.replace(
                "raw_keys = [os.environ.get(k)",
                IS_SPAM_FN + "\n          raw_keys = [os.environ.get(k)",
                1,
            )

    # Inject hard fail after scrub_source_leaks(article_md)
    if "HARD FAIL: spam/thin" not in text:
        text = re.sub(
            r"(article_md\s*=\s*scrub_source_leaks\(article_md\)\s*\n)",
            r"\1" + HARD_FAIL_SNIPPET,
            text,
            count=1,
        )
        # alternate scrub pattern
        if "HARD FAIL: spam/thin" not in text:
            text = re.sub(
                r"(article_md\s*=\s*re\.sub\(r\"\^```.*?article_md.*?\n(?:.*?\n){0,6}?article_md\s*=\s*scrub_source_leaks\(article_md\)\s*\n)",
                lambda m: m.group(0) + HARD_FAIL_SNIPPET,
                text,
                count=1,
            )

    # If review says high repetition, hard exit instead of only rewrite
    text = re.sub(
        r"if sim >= 7 or rep >= 7 or voc <= 4:\n\s*print\(\"Triggering rewrite\"\)",
        'if sim >= 7 or rep >= 7 or voc <= 4:\n'
        '              print("Triggering rewrite")\n'
        '              if sim >= 9 or rep >= 9:\n'
        '                  print("HARD FAIL: extreme source similarity or house-style repetition")\n'
        '                  sys.exit(1)',
        text,
        count=1,
    )
    return text


def process_file(path: pathlib.Path) -> bool:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    text = strip_bom(raw)
    if "google.genai" not in text and "genai.Client" not in text:
        # not a gemini writer pipeline
        if text != raw:
            path.write_text(text, encoding="utf-8")
            return True
        return False

    original = text
    text = expand_banned_phrases(text)
    text = harden_write_prompt(text)
    text = replace_soft_uniqueness(text)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed = []
    for path in sorted(ROOT.glob("*.yml")) + sorted(ROOT.glob("*.yaml")):
        name = path.name.lower()
        if not (
            name.startswith("za")
            or name in {"automation.yml", "satirical-narrator.yml", "podcast-generator.yml", "eeat builder.yml"}
        ):
            # still strip BOM on scheduler-like files
            raw = path.read_text(encoding="utf-8", errors="ignore")
            if raw.startswith("\ufeff"):
                path.write_text(raw[1:], encoding="utf-8")
                changed.append(path.name + " (bom)")
            continue
        try:
            if process_file(path):
                changed.append(path.name)
                print(f"hardened {path.name}")
            else:
                print(f"unchanged {path.name}")
        except Exception as e:
            print(f"error {path.name}: {e}")
    print("changed:", ", ".join(changed) if changed else "(none)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
