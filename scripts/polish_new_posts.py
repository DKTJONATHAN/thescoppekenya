#!/usr/bin/env python3
"""Normalize freshly written markdown posts before they go live."""
from __future__ import annotations

import datetime as dt
import pathlib
import re
import sys

POSTS_DIR = pathlib.Path("content/posts")
MAX_TITLE = 65
MIN_DESC = 120
MAX_DESC = 155
MIN_WORDS = 450

BANNED = [
    "in today's digital age",
    "delve into",
    "dive in",
    "it's worth noting",
    "a testament to",
    "navigating the landscape",
    "tapestry",
    "game-changer",
    "stay tuned",
    "moreover",
    "furthermore",
    "in conclusion",
    "what this means for kenyans",
    "search-ready summary",
    "key takeaway",
]

BOILER_HEADINGS = [
    r"what this means for kenyans",
    r"key facts",
    r"search[- ]ready summary",
    r"faq[s]?",
    r"frequently asked questions",
    r"what is the most important takeaway",
]


def split_fm(text: str):
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    raw, body = parts[1], parts[2]
    data = {}
    for line in raw.splitlines():
        if ":" not in line:
            continue
        key, val = line.split(":", 1)
        data[key.strip()] = val.strip().strip('"').strip("'")
    return data, body.lstrip("\n")


def dump_fm(data: dict) -> str:
    order = [
        "title", "slug", "description", "excerpt", "author", "authorUrl",
        "image", "category", "tags", "date", "dateModified", "focusKeyword",
        "schema",
    ]
    lines = ["---"]
    seen = set()
    for key in order:
        if key in data and data[key] != "":
            val = data[key]
            if key == "tags" and not str(val).startswith("["):
                val = f'["{val}"]'
            if key != "tags":
                val = str(val).replace('"', "'")
                lines.append(f'{key}: "{val}"')
            else:
                lines.append(f"{key}: {val}")
            seen.add(key)
    for key, val in data.items():
        if key in seen:
            continue
        lines.append(f'{key}: "{str(val).replace(chr(34), chr(39))}"')
    lines.append("---\n")
    return "\n".join(lines)


def slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower())
    return s.strip("-")[:70]


def trim_title(title: str) -> str:
    title = re.sub(r"\s+", " ", title).strip()
    title = re.sub(r"\s*[\[\(]\d{4}[\]\)]\s*", " ", title).strip()
    if len(title) <= MAX_TITLE:
        return title
    cut = title[: MAX_TITLE + 1]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut.strip(" -:,")


def trim_desc(desc: str, title: str) -> str:
    desc = re.sub(r"\s+", " ", desc or "").strip()
    if not desc:
        desc = f"{title} — the latest from Kenya, reported by Za Ndani."
    if len(desc) > MAX_DESC:
        cut = desc[: MAX_DESC + 1]
        desc = cut.rsplit(" ", 1)[0].rstrip(".,;:") + "."
    if len(desc) < MIN_DESC:
        pad = " Coverage from Nairobi and across Kenya."
        desc = (desc.rstrip(".") + pad)[:MAX_DESC]
    return desc


def strip_body(body: str) -> str:
    blocks = re.split(r"\n\s*\n+", body.strip())
    kept = []
    skip = False
    for block in blocks:
        heading = re.sub(r"^#+\s*", "", block).strip().lower()
        if any(re.search(pat, heading) for pat in BOILER_HEADINGS):
            skip = True
            continue
        if skip and block.startswith("#"):
            skip = False
        if skip:
            continue
        low = block.lower()
        if any(p in low for p in BANNED) and len(block) < 280:
            continue
        kept.append(block.strip())
    text = "\n\n".join(kept).strip()
    text = text.replace("\u2014", "-").replace("\u2013", "-")
    return text


def focus_keyword(title: str) -> str:
    words = [w for w in re.findall(r"[A-Za-z0-9']+", title) if len(w) > 2][:6]
    return " ".join(words).lower()


def polish_file(path: pathlib.Path) -> bool:
    original = path.read_text(encoding="utf-8", errors="ignore")
    data, body = split_fm(original)
    if not data.get("title"):
        return False
    data["title"] = trim_title(data["title"])
    data["description"] = trim_desc(data.get("description") or data.get("excerpt", ""), data["title"])
    if not data.get("slug"):
        data["slug"] = slugify(data["title"])
    data["slug"] = slugify(data["slug"])
    if not data.get("date"):
        data["date"] = dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    data["dateModified"] = dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    data["focusKeyword"] = data.get("focusKeyword") or focus_keyword(data["title"])
    data["schema"] = data.get("schema") or "NewsArticle"
    body = strip_body(body)
    words = re.findall(r"\w+", body)
    if len(words) < MIN_WORDS:
        print(f"WARN thin: {path.name} ({len(words)} words)")
    new = dump_fm(data) + body + "\n"
    if new != original:
        path.write_text(new, encoding="utf-8")
        print(f"polished {path.name}")
        return True
    return False


def main():
    if not POSTS_DIR.exists():
        print("no posts dir")
        return 0
    changed = 0
    files = sorted(POSTS_DIR.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)[:40]
    for path in files:
        if polish_file(path):
            changed += 1
    print(f"polished {changed} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
