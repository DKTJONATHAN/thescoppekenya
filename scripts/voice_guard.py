#!/usr/bin/env python3
"""Kenya-first voice, GEO/SEO and skip rules for every Za Ndani desk."""
from __future__ import annotations

import re
from typing import Optional

BANNED_PHRASES = [
    "sasa basi", "melting the pot", "spill the tea", "tea is hot", "grab your popcorn",
    "buckle up", "breaking news", "dive in", "delve into", "moreover", "furthermore",
    "in conclusion", "it's worth noting", "a testament to", "navigating the landscape",
    "in today's digital age", "tapestry", "game-changer", "stay tuned", "unpack",
    "is the central subject of the update", "central subject of the update",
    "central to this update", "search-ready summary", "key takeaway",
    "what this means for kenyans", "what this means for kenya",
]

KENYA_HINTS = re.compile(
    r"\b(kenya|kenyan|nairobi|mombasa|kisumu|nakuru|eldoret|ruto|gachagua|raila|"
    r"safaricom|m-?pesa|iebc|odm|uda|azimio|westlands|kasarani|kiambu|kakamega)\b",
    re.I,
)

FOREIGN_HINTS = re.compile(
    r"\b(trump|biden|white house|westminster|premier league only|hollywood|"
    r"los angeles|new york times|hollywood stock exchange)\b",
    re.I,
)


def strip_banned(text: str) -> str:
    if not text:
        return text or ""
    out = text
    for p in BANNED_PHRASES:
        out = re.sub(re.escape(p), "", out, flags=re.I)
    return re.sub(r"\n{3,}", "\n\n", out).strip()


def is_spam(text: str, min_words: int = 120) -> bool:
    words = re.findall(r"\w+", text or "")
    if len(words) < min_words:
        return True
    low = (text or "").lower()
    hits = sum(1 for p in BANNED_PHRASES if p in low)
    return hits >= 3


def kenya_score(text: str) -> int:
    blob = text or ""
    score = len(KENYA_HINTS.findall(blob)) * 3
    score -= len(FOREIGN_HINTS.findall(blob)) * 2
    return score


def should_skip_story(text: str, category: str = "") -> bool:
    blob = text or ""
    if kenya_score(blob) <= 0 and FOREIGN_HINTS.search(blob):
        return True
    return False


def model_skipped(text: str) -> bool:
    t = text or ""
    if len(t) < 180 and re.search(r"\b(skip|not kenya|cannot rewrite|refuse)\b", t, re.I):
        return True
    return False


def news_prompt(
    author: str,
    date_str: str,
    style,
    title: str,
    body: str,
    role: str = "correspondent",
    opinion: bool = False,
    desk: str = "News",
    avoid: str = "",
) -> str:
    style_name = style.get("name") if isinstance(style, dict) else str(style)
    tone = style.get("tone", "") if isinstance(style, dict) else ""
    structure = style.get("structure", "") if isinstance(style, dict) else ""
    mode = "opinion column" if opinion else "news report"
    avoid_line = f"Avoid repeating these recent angles: {avoid}" if avoid else ""
    know = (
        "Do NOT include a 'What we know' list. This is not a hard-news brief."
        if opinion or (desk or "").lower() in {"opinions", "opinion", "lifestyle", "entertainment", "gossip"}
        else "After the lede, add a short 'What we know' list of 3-5 bullets with concrete facts only."
    )
    return f"""You are {author}, {role} for Za Ndani ({desk}).
Date: {date_str}
Mode: {mode}
Style: {style_name}. Tone: {tone}. Structure: {structure}.
Write original Kenyan-first {mode} in clean Markdown. No brand names of rival outlets.
{know}
{avoid_line}

SOURCE TITLE: {title}
SOURCE BODY:
{body[:3500]}

Output the article only. Start with a sharp lede paragraph (no H1 title line)."""


def guess_county(text: str) -> str:
    low = (text or "").lower()
    for name in ("Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Kiambu", "Kakamega", "Kisii", "Meru"):
        if name.lower() in low:
            return name
    return "Nairobi"


def seo_fields(title: str, body: str, category: str, author: str) -> dict:
    clean = re.sub(r"^#+\s*", "", title).strip()
    if len(clean) > 65:
        cut = clean[:66]
        clean = cut.rsplit(" ", 1)[0].strip(" -:,")
    source = body or ""
    # Drop "What we know" so homepage teasers are real ledes
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
        return body or ""
    lines = (body or "").splitlines()
    out: list[str] = []
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
    paras = [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]
    if len(paras) < 2:
        return text
    lede = paras[0]
    rest = paras[1:]
    facts = []
    for p in rest[:4]:
        sent = re.split(r"(?<=[.!?])\s+", p)
        if sent:
            fact = re.sub(r"^#{1,6}\s+", "", sent[0].strip())
            if len(fact) >= 18:
                facts.append(fact)
        if len(facts) >= 4:
            break
    if len(facts) < 3:
        return text
    bullets = "\n".join(f"- {f}" for f in facts)
    return f"{lede}\n\n### What we know\n\n{bullets}\n\n" + "\n\n".join(rest)


def strip_date_lede(body: str) -> str:
    if not body:
        return body or ""
    return re.sub(
        r"^(On\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[^.]{0,80}\.\s*)",
        "",
        body.strip(),
        count=1,
        flags=re.I,
    )


def polish_body(body: str, category: str = "News", title: str = "") -> str:
    cleaned = strip_date_lede(strip_banned(body or ""))
    return inject_know_if_missing(cleaned, category, title)
