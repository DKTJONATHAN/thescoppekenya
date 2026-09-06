#!/usr/bin/env python3
"""Fail the job when new posts have SEO or thin-content problems."""
from __future__ import annotations

import pathlib
import re
import sys
from collections import Counter

POSTS_DIR = pathlib.Path("content/posts")
MAX_TITLE = 70
MIN_DESC = 70
MAX_DESC = 170
MIN_WORDS = 180

ERRORS = []
WARNS = []

BANNED_ERROR = [
    "is central to this update for kenyan readers",
    "is the central subject of the update",
    "what this means for kenyans",
    "search-ready summary",
    "in today's digital age",
    "delve into",
    "navigating the landscape",
]

BANNED_WARN = [
    "it's worth noting",
    "game-changer",
    "tapestry",
]

SPAM_LEAD_RE = re.compile(r"is central to this update for Kenyan readers", re.I)
SPAM_SUBJECT_RE = re.compile(r"is the central subject of the update", re.I)


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


def has_high_repetition(body: str) -> bool:
    text = re.sub(r"\s+", " ", body).strip().lower()
    words = text.split()
    if len(words) < 40:
        return False
    for n in (8, 10, 12):
        if len(words) < n * 8:
            continue
        phrases = [" ".join(words[i : i + n]) for i in range(len(words) - n)]
        counts = Counter(phrases)
        most = counts.most_common(1)
        if most and most[0][1] >= 6:
            return True
    return False


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

    if SPAM_LEAD_RE.search(body):
        ERRORS.append(f"{name}: spam lead 'is central to this update...'")
    if SPAM_SUBJECT_RE.search(body):
        ERRORS.append(f"{name}: spam phrase 'is the central subject of the update'")
    if has_high_repetition(body):
        ERRORS.append(f"{name}: high phrase repetition (keyword stuffing)")

    low = body.lower()
    for phrase in BANNED_ERROR:
        if phrase in low:
            ERRORS.append(f"{name}: banned spam phrase '{phrase}'")
            break
    for phrase in BANNED_WARN:
        if phrase in low:
            WARNS.append(f"{name}: weak phrase '{phrase}'")
            break


def main():
    files = sorted(POSTS_DIR.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)[:40]
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

    print("SEO lint (latest 40 posts)")
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
