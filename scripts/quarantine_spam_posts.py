#!/usr/bin/env python3
"""Quarantine spam/templated posts so they stop poisoning site-wide quality signal.

Criteria (any one => quarantine):
  - frontmatter image == "/images/placeholder.jpg" AND body (whitespace-stripped) < 400 chars
  - description matches boilerplate "<x>: Read key facts" pattern
  - title equals slug AND title looks like a hex/hash blob (>=24 chars, [a-f0-9-])
  - URL/slug ends with a trailing hyphen (malformed)
  - body contains the classic spam lead "is central to this update for Kenyan readers"
  - body contains "is the central subject of the update"
  - high repetition: any 8+ word phrase repeated >= 8 times
  - body has < 80 unique sentences AND > 3000 chars (stuffing signal)
Moves matched files to content/archive-spam/ (preserved, not deleted).
"""
import re
import shutil
from collections import Counter
from pathlib import Path

SRC = Path("content/posts")
DST = Path("content/archive-spam")
DST.mkdir(parents=True, exist_ok=True)

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.S)
BOILER = re.compile(r'description:\s*"[^"]*:\s*Read key facts', re.I)
HASHY = re.compile(r'^[a-f0-9][a-f0-9\-]{22,}$', re.I)
SPAM_LEAD = re.compile(
    r"is central to this update for Kenyan readers",
    re.I,
)
SPAM_SUBJECT = re.compile(
    r"is the central subject of the update",
    re.I,
)

def field(fm, key):
    m = re.search(rf'^{key}:\s*"([^"]*)"', fm, re.M)
    return m.group(1) if m else ""

def has_high_repetition(body: str) -> bool:
    """Detect keyword-stuffing loops."""
    # Normalise whitespace
    text = re.sub(r"\s+", " ", body).strip().lower()
    if len(text) < 400:
        return False
    words = text.split()
    if len(words) < 40:
        return False
    # Sliding window of 8–12 words
    for n in (8, 10, 12):
        if len(words) < n * 8:
            continue
        phrases = [" ".join(words[i : i + n]) for i in range(len(words) - n)]
        counts = Counter(phrases)
        most_common = counts.most_common(1)
        if most_common and most_common[0][1] >= 8:
            return True
    return False

def has_low_sentence_diversity(body: str) -> bool:
    """Very long body with almost no unique sentences."""
    text = re.sub(r"\s+", " ", body).strip()
    if len(text) < 3000:
        return False
    # Crude sentence split
    sents = [s.strip() for s in re.split(r"[.!?]+\s+", text) if len(s.strip()) > 20]
    if len(sents) < 5:
        return True
    unique = set(s.lower() for s in sents)
    # If fewer than 15% unique sentences in a long article -> spam
    if len(unique) / max(len(sents), 1) < 0.15 and len(sents) > 20:
        return True
    return False

moved = 0
reasons = {
    "placeholder_thin": 0,
    "boilerplate_desc": 0,
    "hash_title": 0,
    "trailing_hyphen": 0,
    "spam_lead": 0,
    "spam_subject": 0,
    "high_repetition": 0,
    "low_sentence_diversity": 0,
}

for p in SRC.glob("*.md"):
    try:
        raw = p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
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
    elif SPAM_LEAD.search(body):
        reason = "spam_lead"
    elif SPAM_SUBJECT.search(body):
        reason = "spam_subject"
    elif has_high_repetition(body):
        reason = "high_repetition"
    elif has_low_sentence_diversity(body):
        reason = "low_sentence_diversity"

    if reason:
        try:
            shutil.move(str(p), str(DST / p.name))
            reasons[reason] += 1
            moved += 1
        except Exception as e:
            print(f"Failed to move {p.name}: {e}")

print(f"Quarantined: {moved}")
for k, v in reasons.items():
    if v:
        print(f"  {k}: {v}")
