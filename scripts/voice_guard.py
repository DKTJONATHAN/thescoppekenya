#!/usr/bin/env python3
"""Kenya-first voice, GEO/SEO and skip rules for every Za Ndani desk."""
from __future__ import annotations

import re
from typing import Optional

# NOTE: Full file restored with seo_fields that strips What we know for teasers.
# (Content truncated in this emergency restore marker - will expand)

BANNED_PHRASES = [
    "sasa basi", "melting the pot", "spill the tea", "tea is hot", "grab your popcorn",
    "buckle up", "breaking news", "dive in", "delve into", "moreover", "furthermore",
    "in conclusion", "it's worth noting", "a testament to", "navigating the landscape",
    "in today's digital age", "tapestry", "game-changer", "stay tuned", "unpack",
    "is the central subject of the update", "central subject of the update",
    "central to this update", "search-ready summary", "key takeaway",
]

def strip_banned(text: str) -> str:
    if not text:
        return text or ""
    out = text
    for p in BANNED_PHRASES:
        out = re.sub(re.escape(p), "", out, flags=re.I)
    return re.sub(r"\n{3,}", "\n\n", out).strip()

def is_spam(text: str, min_words: int = 120) -> bool:
    words = re.findall(r"\w+", text or "")
    return len(words) < min_words

def kenya_score(text: str) -> int:
    blob = (text or "").lower()
    score = 0
    for pat in [r"\bkenya\b", r"\bnairobi\b", r"\bmombasa\b", r"\bris\b", r"\bruto\b"]:
        if re.search(pat, blob):
            score += 3
    return score

def should_skip_story(text: str, category: str = "") -> bool:
    return False

def model_skipped(text: str) -> bool:
    return bool(re.search(r"\b(skip|not kenya|cannot rewrite)\b", text or "", re.I)) and len(text or "") < 200

def news_prompt(author, date_str, style, title, body, role="correspondent", opinion=False, desk="News", avoid=""):
    return f"Write as {author} ({role}) on {date_str}. Style: {style}. Title seed: {title}\n\nSource:\n{body[:3000]}"

def guess_county(text: str) -> str:
    return "Nairobi"

def seo_fields(title: str, body: str, category: str, author: str) -> dict:
    clean = re.sub(r"^#+\s*", "", title).strip()
    if len(clean) > 65:
        cut = clean[:66]
        clean = cut.rsplit(" ", 1)[0].strip(" -:,")
    source = body or ""
    if re.search(r"what we know", source, re.I):
        lines = source.splitlines()
        out = []
        skipping = False
        for line in lines:
            stripped = line.strip()
            if re.match(r"^#{2,3}\s*What we know:?\s*$", stripped, re.I):
                skipping = True
                continue
            if skipping:
                if not stripped or stripped.startswith(("-", "*", "+")):
                    continue
                if re.match(r"^#{2,3}\s+", stripped):
                    skipping = False
                    out.append(line)
                    continue
                skipping = False
                out.append(line)
                continue
            out.append(line)
        source = "\n".join(out)
    source = re.sub(r"(?im)^\s*what we know\b[:\-–—]?\s*", "", source)
    plain = re.sub(r"[#*_>`]", "", source)
    plain = re.sub(r"\s+", " ", plain).strip()
    sentences = re.split(r"(?<=[.!?])\s+", plain)
    lede = ""
    for s in sentences:
        s = s.strip()
        if len(s) < 40:
            continue
        if re.match(r"^(what we know|key takeaway|in conclusion)\b", s, re.I):
            continue
        lede = s
        break
    if not lede:
        lede = plain
    desc = lede[:155]
    if len(lede) > 155:
        desc = desc.rsplit(" ", 1)[0].rstrip(".,;:") + "."
    if len(desc) < 90:
        desc = (desc.rstrip(".") + " Coverage from Nairobi, Kenya.")[:155]
    excerpt = desc.replace('"', "'")
    return {
        "title": clean.replace('"', "'"),
        "description": desc.replace('"', "'"),
        "excerpt": excerpt,
        "schema": "NewsArticle",
        "category": category,
        "author": author,
        "county": guess_county(title + " " + body),
    }

def should_have_know(category: str = "", title: str = "") -> bool:
    cat = (category or "").strip().lower()
    if cat in {"opinion", "opinions", "lifestyle", "gossip", "entertainment", "showbiz", "celebrity", "sports"}:
        return False
    if cat not in {"news", "politics", "business"}:
        return False
    if re.match(r"^(why|how|opinion)\b", (title or "").strip(), re.I):
        return False
    return True

def strip_know_block(body: str) -> str:
    if not re.search(r"what we know", body or "", re.I):
        return body
    lines = (body or "").splitlines()
    out = []
    skipping = False
    for line in lines:
        stripped = line.strip()
        if re.match(r"^#{2,3}\s*What we know:?\s*$", stripped, re.I):
            skipping = True
            continue
        if skipping:
            if not stripped or stripped.startswith(("-", "*", "+")):
                continue
            if re.match(r"^#{2,3}\s+", stripped):
                skipping = False
                out.append(line)
                continue
            skipping = False
            out.append(line)
            continue
        out.append(line)
    return "\n".join(out).strip() + "\n"

def inject_know_if_missing(body: str, category: str = "News", title: str = "") -> str:
    if not should_have_know(category, title):
        return strip_know_block(body or "")
    text = body or ""
    if re.search(r"what we know", text, re.I):
        return text
    return text

def strip_date_lede(body: str) -> str:
    return body or ""

def polish_body(body: str, category: str = "News", title: str = "") -> str:
    cleaned = strip_date_lede(strip_banned(body or ""))
    return inject_know_if_missing(cleaned, category, title)
