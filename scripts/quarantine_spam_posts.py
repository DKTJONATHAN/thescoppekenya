#!/usr/bin/env python3
"""Quarantine spam/templated posts so they stop poisoning site-wide quality signal.

Criteria (any one => quarantine):
  - frontmatter image == "/images/placeholder.jpg" AND body (whitespace-stripped) < 400 chars
  - description matches boilerplate "<x>: Read key facts" pattern
  - title equals slug AND title looks like a hex/hash blob (>=24 chars, [a-f0-9-])
  - URL/slug ends with a trailing hyphen (malformed)
Moves matched files to content/archive-spam/ (preserved, not deleted).
"""
import re, shutil
from pathlib import Path

SRC = Path("content/posts")
DST = Path("content/archive-spam")
DST.mkdir(parents=True, exist_ok=True)

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.S)
BOILER = re.compile(r'description:\s*"[^"]*:\s*Read key facts', re.I)
HASHY = re.compile(r'^[a-f0-9][a-f0-9\-]{22,}$', re.I)

def field(fm, key):
    m = re.search(rf'^{key}:\s*"([^"]*)"', fm, re.M)
    return m.group(1) if m else ""

moved = 0
reasons = {"placeholder_thin":0,"boilerplate_desc":0,"hash_title":0,"trailing_hyphen":0}
for p in SRC.glob("*.md"):
    raw = p.read_text(encoding="utf-8", errors="ignore")
    m = FM_RE.match(raw)
    if not m:
        continue
    fm, body = m.group(1), m.group(2)
    body_stripped = re.sub(r"\s+", " ", body).strip()
    image = field(fm, "image")
    title = field(fm, "title")
    slug = field(fm, "slug") or p.stem
    reason = None
    if image == "/images/placeholder.jpg" and len(body_stripped) < 400:
        reason = "placeholder_thin"
    elif BOILER.search(fm):
        reason = "boilerplate_desc"
    elif title and title == slug and HASHY.match(title):
        reason = "hash_title"
    elif slug.endswith("-") or p.stem.endswith("-"):
        reason = "trailing_hyphen"
    if reason:
        shutil.move(str(p), str(DST / p.name))
        reasons[reason] += 1
        moved += 1

print(f"Quarantined: {moved}")
for k,v in reasons.items():
    print(f"  {k}: {v}")
