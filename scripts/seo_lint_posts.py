#!/usr/bin/env python3
"""Fail the job when new posts have SEO or thin-content problems."""
from __future__ import annotations

import pathlib
import re
import sys

POSTS_DIR = pathlib.Path("content/posts")
MAX_TITLE = 70
MIN_DESC = 70
MAX_DESC = 170
MIN_WORDS = 350

ERRORS = []
WARNS = []

BANNED = [
    "in today's digital age",
    "delve into",
    "it's worth noting",
    "navigating the landscape",
    "what this means for kenyans",
    "search-ready summary",
]


def split_fm(text: str):
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    data = {}
    for line in parts[1].splitlines():
        if ":" not in line:
            continue
        key, val = line.split(":", 1)
        data[key.strip()] = val.strip().strip('"').strip("'")
    return data, parts[2]


def lint(path: pathlib.Path):
    text = path.read_text(encoding="utf-8", errors="ignore")
    data, body = split_fm(text)
    name = path.name
    title = data.get("title", "")
    desc = data.get("description") or data.get("excerpt", "")
    slug = data.get("slug", "")
    image = data.get("image", "")
    date = data.get("date", "")
    words = len(re.findall(r"\w+", body))

    if not title:
        ERRORS.append(f"{name}: missing title")
    elif len(title) > MAX_TITLE:
        ERRORS.append(f"{name}: title {len(title)} chars (max {MAX_TITLE})")
    if not desc:
        ERRORS.append(f"{name}: missing description")
    elif len(desc) < MIN_DESC:
        WARNS.append(f"{name}: short description ({len(desc)} chars)")
    elif len(desc) > MAX_DESC:
        WARNS.append(f"{name}: long description ({len(desc)} chars)")
    if not slug:
        ERRORS.append(f"{name}: missing slug")
    elif re.search(r"[^a-z0-9-]", slug):
        ERRORS.append(f"{name}: slug has invalid characters")
    if not image:
        ERRORS.append(f"{name}: missing image")
    if not date:
        ERRORS.append(f"{name}: missing date")
    if words < MIN_WORDS:
        ERRORS.append(f"{name}: thin content ({words} words)")
    if not re.search(r"^##\s+", body, re.M):
        WARNS.append(f"{name}: no H2 heading")
    if not data.get("focusKeyword"):
        WARNS.append(f"{name}: missing focusKeyword")
    low = body.lower()
    for phrase in BANNED:
        if phrase in low:
            WARNS.append(f"{name}: banned phrase '{phrase}'")
            break
    if title and body.lstrip().lower().startswith(title.lower()[:24]):
        WARNS.append(f"{name}: lede repeats title")


def main():
    files = sorted(POSTS_DIR.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)[:25]
    slugs = {}
    titles = {}
    for path in files:
        data, _ = split_fm(path.read_text(encoding="utf-8", errors="ignore"))
        slug = data.get("slug")
        title = data.get("title")
        if slug:
            slugs.setdefault(slug, []).append(path.name)
        if title:
            titles.setdefault(title.lower(), []).append(path.name)
        lint(path)
    for slug, names in slugs.items():
        if len(names) > 1:
            ERRORS.append(f"duplicate slug '{slug}': {', '.join(names)}")
    for title, names in titles.items():
        if len(names) > 1:
            WARNS.append(f"duplicate title '{title}': {', '.join(names)}")

    print("SEO lint (latest 25 posts)")
    for w in WARNS:
        print("WARN", w)
    for e in ERRORS:
        print("ERROR", e)
    print(f"{len(ERRORS)} errors, {len(WARNS)} warnings")
    if ERRORS:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
