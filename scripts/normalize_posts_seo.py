#!/usr/bin/env python3
import os
import re
from datetime import datetime, timezone
from pathlib import Path

POSTS_DIR = Path("content/posts")
SITE_URL = "https://zandani.co.ke"


def parse_frontmatter(raw: str):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", raw, flags=re.S)
    if not m:
        return {}, raw
    fm_raw, body = m.group(1), m.group(2)
    data = {}
    order = []
    for line in fm_raw.splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        key = k.strip()
        val = v.strip()
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        if val.startswith("[") and val.endswith("]"):
            parts = [x.strip().strip('"').strip("'") for x in val[1:-1].split(",") if x.strip()]
            data[key] = parts
        else:
            data[key] = val
        order.append(key)
    return (data, body)


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:70] if s else "kenya-news-update"


def strip_md(text: str) -> str:
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[#>*_`~\-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def first_words(text: str, n: int) -> str:
    words = strip_md(text).split()
    return " ".join(words[:n])


def clamp_description(desc: str, focus_keyword: str) -> str:
    d = re.sub(r"\s+", " ", (desc or "").strip())
    if focus_keyword and focus_keyword.lower() not in d.lower():
        d = f"{focus_keyword}: {d}".strip()
    d = re.sub(
        r"\b(Read key facts,? what this means for Kenyans,? and practical next steps\.?|Read the full story|Get the details|See what happened)\b",
        "",
        d,
        flags=re.I,
    )
    if len(d) < 105:
        d = f"{d} Latest verified update with the key context readers need.".strip()
    if len(d) > 160:
        d = d[:160].rsplit(" ", 1)[0].strip()
    return d


def ensure_body_sections(body: str, focus_keyword: str) -> str:
    body = remove_generic_padding(body)
    text100 = first_words(body, 100).lower()
    if focus_keyword and focus_keyword.lower() not in text100:
        paragraphs = body.split("\n\n", 1)
        if len(paragraphs) == 2:
            paragraphs[0] = f"{paragraphs[0]} {focus_keyword} is the central subject of the update."
            body = "\n\n".join(paragraphs)
    return body.rstrip() + "\n"


def remove_generic_padding(body: str) -> str:
    patterns = [
        r"\n## What this means for Kenyans\n(?:.*\n?){1,4}",
        r"\n## Key facts\n(?:- .*\n?){1,6}",
        r"\n## FAQ\n[\s\S]*?(?=\n## |\Z)",
    ]
    cleaned = body
    for pattern in patterns:
        cleaned = re.sub(pattern, "\n", cleaned, flags=re.I)
    cleaned = re.sub(
        r"\bFollow official updates and verify deadlines, fees, and policy details before taking action\.\s*",
        "",
        cleaned,
        flags=re.I,
    )
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def serialize_frontmatter(data: dict) -> str:
    ordered_keys = [
        "title",
        "slug",
        "description",
        "excerpt",
        "author",
        "author_url",
        "image",
        "category",
        "tags",
        "canonical",
        "date",
        "dateModified",
        "focusKeyword",
        "schema",
    ]
    lines = ["---"]
    for k in ordered_keys:
        if k not in data:
            continue
        v = data[k]
        if isinstance(v, list):
            items = ", ".join([f'"{str(x).replace(chr(34), chr(39))}"' for x in v[:8]])
            lines.append(f"{k}: [{items}]")
        else:
            vv = str(v).replace('"', "'").strip()
            lines.append(f'{k}: "{vv}"')
    lines.append("---")
    return "\n".join(lines)


def normalize_file(path: Path) -> bool:
    raw = path.read_text(encoding="utf-8")
    data, body = parse_frontmatter(raw)

    title = data.get("title") or path.stem
    slug = data.get("slug") or slugify(title)
    author = data.get("author") or "Za Ndani"
    category = data.get("category") or "News"
    date = data.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    date_modified = data.get("dateModified") or data.get("updated") or data.get("modified") or date
    focus_keyword = data.get("focusKeyword") or title[:65]
    canonical = f"{SITE_URL}/article/{slug}"
    excerpt = data.get("excerpt") or strip_md(body)[:140]
    description = clamp_description(data.get("description") or excerpt, focus_keyword)
    tags = data.get("tags")
    if not isinstance(tags, list) or not tags:
        tags = [slug.replace("-", " "), category.lower(), "kenya news"]

    body = ensure_body_sections(body, focus_keyword)

    normalized = {
        **data,
        "title": title,
        "slug": slug,
        "description": description,
        "excerpt": excerpt,
        "author": author,
        "image": data.get("image") or "/images/placeholder.jpg",
        "category": category,
        "tags": tags,
        "canonical": canonical,
        "date": date,
        "dateModified": date_modified,
        "focusKeyword": focus_keyword,
        "schema": data.get("schema") or "NewsArticle",
    }

    out = f"{serialize_frontmatter(normalized)}\n\n{body}"
    if out != raw:
        path.write_text(out, encoding="utf-8")
        return True
    return False


def main():
    if not POSTS_DIR.exists():
        print("No content/posts directory found")
        return
    changed = 0
    for p in POSTS_DIR.glob("*.md"):
        try:
            if normalize_file(p):
                changed += 1
        except Exception as e:
            print(f"Failed {p.name}: {e}")
    print(f"Normalized posts: {changed}")


if __name__ == "__main__":
    main()

