#!/usr/bin/env python3
"""Kenya-first voice, GEO/SEO and skip rules for every Za Ndani desk."""
from __future__ import annotations

import re
from typing import Optional

KENYA_POSITIVE = [
    r"\bkenya\b", r"\bkenyan\b", r"\bnairobi\b", r"\bmombasa\b", r"\bkisumu\b",
    r"\bnakuru\b", r"\beldoret\b", r"\bthika\b", r"\bkiambu\b", r"\bkakamega\b",
    r"\bkwale\b", r"\bkilifi\b", r"\bkisii\b", r"\bmeru\b", r"\bnyeri\b",
    r"\bwestlands\b", r"\bkasarani\b", r"\brironi\b", r"\bwaiyaki\b",
    r"\bruto\b", r"\bgachagua\b", r"\braila\b", r"\bsafaricom\b", r"\bm-?pesa\b",
    r"\bkplc\b", r"\bepra\b", r"\bharambee\b", r"\bgor mahia\b", r"\bafc leopards\b",
    r"\bwanjiku\b", r"\bcelestine\b", r"\bmutheu\b", r"\bza ndani\b",
    r"\bksh\b", r"\bshilling\b", r"\biebc\b", r"\bdci\b", r"\bodpp\b",
    r"\bnairobi expressway\b", r"\bmoja expressway\b", r"\beacc\b",
    r"\bsotik\b", r"\bnarok\b", r"\bmachakos\b", r"\bkitui\b", r"\bgarissa\b",
    r"\bturkana\b", r"\blamu\b", r"\bmalindi\b", r"\bnyandarua\b",
    r"\bkaren\b", r"\bkilimani\b", r"\blavington\b", r"\beastleigh\b",
    r"\bpipeline\b", r"\bkayole\b", r"\blangata\b", r"\bngong\b", r"\brongai\b",
    r"\bjuja\b", r"\bruiru\b", r"\bsyokimau\b", r"\bdonholm\b", r"\bumoja\b",
    r"\bburu buru\b", r"\bembakasi\b", r"\bmathare\b", r"\bkibera\b",
    r"\bnse\b", r"\bcbk\b", r"\bkra\b", r"\bkonza\b", r"\bequity bank\b",
    r"\bkcb\b", r"\bkq\b", r"\bkenya airways\b", r"\bartel kenya\b",
    r"\bmaize\b", r"\bpyrethrum\b", r"\bncpb\b", r"\bgalana\b", r"\bkulalu\b",
    r"\btuzo\b", r"\bghafla\b", r"\bmpasho\b", r"\bcitizen tv\b", r"\bntv\b",
    r"\bkiss 100\b", r"\bclassic 105\b", r"\bhustler fund\b", r"\bsha\b",
    r"\bnhif\b", r"\bntsa\b", r"\bmatatu\b", r"\bodpc\b", r"\bjudiciary\b",
]

EAST_AFRICA = [
    r"\buganda\b", r"\btanzania\b", r"\brwanda\b", r"\bethiopia\b",
    r"\bzanzibar\b", r"\bdar es salaam\b", r"\bkampala\b", r"\bkigali\b",
    r"\bsouth sudan\b", r"\bburundi\b", r"\beac\b", r"\beast african\b",
]

KENYAN_SHOWBIZ = [
    r"\bbahati\b", r"\bsize ?8\b", r"\bsauti sol\b", r"\bnadia mukami\b",
    r"\bwahu\b", r"\bnameless\b", r"\bochungulo\b", r"\bdiamond platnumz\b",
    r"\balikiba\b", r"\bharmonize\b", r"\bzuchu\b", r"\bnandy\b",
    r"\bjalang'o\b", r"\bjalango\b", r"\bmaina kageni\b", r"\bchipukeezy\b",
    r"\bnyashinski\b", r"\bbensoul\b", r"\bbiena\b", r"\bmejia\b", r"\bmejjah\b",
    r"\bwendy kimani\b", r"\bamber ray\b", r"\bvera sidika\b", r"\bhuddah\b",
    r"\bmilly chebby\b", r"\bgeorge diano\b", r"\bdiano\b", r"\botoo\b",
    r"\bakothe man\b", r"\bmammito\b", r"\bdj afro\b", r"\bking kaka\b",
    r"\bjuliani\b", r"\bkhaligraph\b", r"\bwillis raburu\b", r"\bjulie gichuru\b",
    r"\bbetty kyalo\b", r"\bjanet mbugua\b", r"\bkamene goro\b",
    r"\bpatricia kihoro\b", r"\bsarah hassan\b", r"\bbrenda wairimu\b",
    r"\bcatherine kamau\b", r"\bnini wacera\b", r"\bcorazon kwamboka\b",
    r"\belsa majimbo\b", r"\blupita nyong'?o\b", r"\beunice njambi\b",
    r"\bkambua\b", r"\bking'?angi\b", r"\bbazokizo\b", r"\bwatendawili\b",
    r"\bnikita kering\b", r"\bcharity nzisa\b", r"\bxtarisitic\b",
    r"\beliud kipchoge\b", r"\bkipchoge\b", r"\bfaith kipyegon\b",
    r"\bkipyegon\b", r"\bferdinand omanyala\b", r"\bomanyala\b",
    r"\bmary moraa\b", r"\bgengetone\b", r"\bkubaff\b", r"\bmoikanos\b",
    r"\bbabu owino\b", r"\bedwin sifuna\b", r"\bwajackoyah\b", r"\bsonko\b",
]

WESTERN_SKIP = [
    r"\boscar\b", r"\bemmy\b", r"\boscars?\b", r"\bgrammy\b",
    r"\bmarvel\b", r"\bdisney\b", r"\bnetflix\b", r"\bgolden globe\b",
    r"\bwhite house\b", r"\bbranagh\b", r"\boldman\b", r"\breiner\b",
    r"\bday-lewis\b", r"\bfirth\b", r"\bsuper bowl\b", r"\bmet gala\b",
    r"\bbachelor\b", r"\breal housewives\b", r"\bkardashian\b",
    r"\bbafta\b", r"\bsag award\b", r"\bolivier\b", r"\bbillboard hot\b",
    r"\btaylor swift\b", r"\bbeyonce\b", r"\bkim kardashian\b",
    r"\bbrad pitt\b", r"\bangelina\b", r"\boppenheimer\b", r"\bbarbenheimer\b",
    r"\bgame of thrones\b", r"\bwesteros\b",
    r"\bpremier league\b", r"\bchampions league\b", r"\bmlb\b", r"\bnba\b",
    r"\bnfl\b", r"\bnhl\b",
]

BANNED_PHRASES = [
    "sasa basi", "melting the pot", "spill the tea", "tea is hot", "grab your popcorn",
    "buckle up", "breaking news", "dive in", "delve into", "moreover", "furthermore",
    "in conclusion", "it's worth noting", "a testament to", "navigating the landscape",
    "in today's digital age", "tapestry", "game-changer", "stay tuned", "unpack",
    "is central to this update for kenyan readers",
    "is the central subject of the update", "central subject of the update",
    "central to this update", "what this means for kenyans", "what this means for kenya",
    "key takeaway", "search-ready summary", "in a significant development",
    "sparking debate", "raising questions", "underscores the need",
    "only time will tell", "the bigger picture", "it remains to be seen",
    "this development comes as", "a wake-up call", "food for thought",
    "fans are divided", "the internet is buzzing", "social media went into a frenzy",
    "ignited a nuanced conversation", "bold forecast", "in the realm of pop culture",
    "what this means right now", "how this changes the picture",
    "a poignant", "bittersweetness", "curated public image",
    "ignited a fiery online debate", "sparked a debate across",
    "in a shocking turn of events", "netizens took to", "kenyans on twitter",
    "the nation is gripped", "as earlier reported", "at the time of going to press",
    "this comes amid", "this comes hard on the heels", "without mincing words",
    "make no mistake", "let that sink in", "needless to say", "at the end of the day",
    "the rest is history", "time will tell", "one thing is certain",
    "a storm is brewing", "all hell broke loose", "went viral overnight",
]

COUNTIES = [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos",
    "Kajiado", "Kilifi", "Kwale", "Kakamega", "Kisii", "Meru", "Nyeri", "Kericho",
    "Bomet", "Narok", "Garissa", "Turkana", "Lamu", "Kitui", "Nyandarua", "Laikipia",
    "Bungoma", "Busia", "Siaya", "Homa Bay", "Migori", "Trans Nzoia", "Nandi",
    "Murang'a", "Kirinyaga", "Embu", "Tharaka-Nithi", "Makueni", "Taita-Taveta",
]


def kenya_score(blob: str) -> int:
    text = (blob or "").lower()
    score = 0
    for pat in KENYA_POSITIVE:
        if re.search(pat, text):
            score += 4
    for pat in EAST_AFRICA:
        if re.search(pat, text):
            score += 2
    for pat in KENYAN_SHOWBIZ:
        if re.search(pat, text):
            score += 5
    for pat in WESTERN_SKIP:
        if re.search(pat, text):
            score -= 6
    return score


def _western(text: str) -> bool:
    return any(re.search(p, text) for p in WESTERN_SKIP)


def _local_name(text: str) -> bool:
    return any(re.search(p, text) for p in KENYAN_SHOWBIZ)


def should_skip_story(blob: str, category: str = "News") -> bool:
    cat = (category or "").lower()
    text = (blob or "").lower()
    score = kenya_score(blob)
    western = _western(text)
    local = _local_name(text)
    if cat in {"opinions", "opinion"}:
        return False
    if cat in {"entertainment", "gossip", "lifestyle"}:
        if local and not western:
            return False
        if local and score >= 0:
            return False
        if western and score < 8:
            return True
        return score < 2
    if cat in {"africa"}:
        return score < 2
    if cat in {"sports"}:
        if re.search(r"\b(harambee|gor mahia|afc leopards|fkf|sharks|kpl|moikanos|kipchoge|kipyegon|omanyala|shujaa|tusker)\b", text):
            return False
        if western and score < 4:
            return True
        return score < 0
    if cat in {"agriculture"}:
        if western and score < 4:
            return True
        return score < 0
    if cat in {"business", "technology"}:
        if western and score < 4:
            return True
        return score < 2
    if western and score < 8:
        return True
    return score < 4


def strip_banned(text: str) -> str:
    if not text:
        return text
    out = text
    for p in BANNED_PHRASES:
        out = re.sub(re.escape(p), "", out, flags=re.I)
    out = re.sub(r"[^\.\n]*is central to this update[^\.\n]*[\.\s]*", "", out, flags=re.I)
    out = re.sub(r"[^\.\n]*is the central subject of the update[^\.\n]*[\.\s]*", "", out, flags=re.I)
    out = re.sub(r" {2,}", " ", out)
    return out.strip()


def is_spam(text: str, min_words: int = 180) -> bool:
    if not text:
        return True
    low = text.lower()
    stuffing = [
        "is the central subject of the update",
        "central to this update for kenyan readers",
        "search-ready summary",
        "key takeaway",
        "what this means for kenyans",
    ]
    if any(m in low for m in stuffing):
        return True
    words = re.findall(r"\w+", text)
    if len(words) < min_words:
        return True
    paras = [re.sub(r"\s+", " ", p.strip().lower()) for p in re.split(r"\n\s*\n", text) if p.strip()]
    if len(paras) >= 2 and len(set(paras)) < len(paras) * 0.6:
        return True
    grams = [" ".join(words[i:i + 8]).lower() for i in range(0, max(0, len(words) - 7), 4)]
    if grams:
        from collections import Counter
        top = Counter(grams).most_common(1)[0]
        if top[1] >= 3 and len(top[0]) > 20:
            return True
    return False


def model_skipped(article: Optional[str]) -> bool:
    if not article:
        return True
    head = article.strip().split("\n", 1)[0].strip().upper()
    return head.startswith("SKIP")


def guess_county(blob: str) -> str:
    text = blob or ""
    for c in COUNTIES:
        if re.search(rf"\b{re.escape(c)}\b", text, re.I):
            return c
    return "Nairobi"


COMMENTARY_HEADINGS = [
    "Why it matters",
    "The Nairobi read",
    "What it costs you",
    "The take",
    "Between the lines",
]


def pick_commentary_heading(seed: str) -> str:
    if not seed:
        return COMMENTARY_HEADINGS[0]
    idx = sum(ord(c) for c in seed) % len(COMMENTARY_HEADINGS)
    return COMMENTARY_HEADINGS[idx]


def news_prompt(
    author: str,
    date_eat: str,
    style: dict,
    title: str,
    source_body: str,
    role: str = "correspondent",
    opinion: bool = False,
    desk: str = "News",
    avoid: str = "",
) -> str:
    heading = style.get("commentary_heading") or pick_commentary_heading(title + date_eat)
    know_ok = should_have_know(desk, title)
    if opinion or not know_ok:
        know = (
            "Do NOT include a 'What we know' list. This is not a hard-news brief. "
            "Write the piece without a fact box."
        )
    else:
        know = (
            "After the lede, add a short 'What we know' list of 3-5 bullets. "
            "Each bullet is one fact with a name, place, time or number. No filler. "
            "Never nest headings inside the list. Do not start a bullet with '###'."
        )
    voice = (
        "VOICE: Nairobi newsroom. Mix straight reporting with a human take. "
        "Facts first, then a point of view. Short sentences. Concrete nouns. "
        "Names, counties, shillings. Kenyan English is allowed. "
        "NEVER open the lede with weekday + time-of-day + calendar date "
        "(e.g. 'On Tuesday afternoon, September 8, 2026'). "
        "Start with who did what and where. Put time later only if it matters. "
        "Do not fake Sheng. Never write like a US morning show, a press release, "
        "or a recycled wire dump. Prefer Westlands Exit, Waiyaki Way, Kasarani "
        "over 'a major highway'."
    )
    avoid_block = ""
    if avoid:
        avoid_block = (
            "\nDO NOT repeat these recent openings, stock phrases or angles:\n"
            f"{avoid[:1200]}\n"
        )
    if opinion:
        return f"""You are {author}, opinion columnist for Za Ndani (Kenya).
Today is {date_eat} EAT.
{voice}

SOURCE TITLE: {title}
SOURCE (facts only for grounding):
{source_body[:4500]}

STYLE: {style.get('name')}. Lead: {style.get('lead_style')}. Tone: {style.get('tone')}.
Structure: {style.get('structure')}.
{avoid_block}
RULES:
- 650-900 words. Original prose. Argument in the first line.
- Kenya first. If the source is foreign, say what it costs a reader in Nairobi.
- {know}
- Commentary is the job: take a side, name who benefits, who pays.
- Vary sentence length. Do not reuse the same opener twice.
- NEVER write 'is the central subject of the update' or keyword stuffing.
- No competing media brands. No em-dashes.
- Output ONLY the article body in markdown. No meta.
Banned: {', '.join(BANNED_PHRASES[:14])}...
"""

    return f"""You are {author}, a {role} for Za Ndani (Kenya).
Today is {date_eat} EAT. Desk: {desk}.
{voice}
Do not write wire-copy with no brain, and do not write a column with no facts.
Report, then comment.

SOURCE TITLE: {title}
SOURCE (facts only, rewrite completely):
{source_body[:4500]}

STYLE: {style.get('name')}. Lead: {style.get('lead_style')}. Tone: {style.get('tone')}. Structure: {style.get('structure')}.
Commentary heading for THIS piece (use exactly): {heading}
{avoid_block}
MARKDOWN OUTPUT:
1) H2 factual headline (max ~65 characters), then a 40-60 word lede: who + what + where. Do NOT open with 'On Monday/Tuesday... morning/afternoon, Month Day, Year'. No calendar clock in the first sentence. Time only mid-article if essential.
2) {know}
3) Body 3-5 short paragraphs of reported fact, attributed statements, numbers, places.
4) COMMENTARY under an H3 heading exactly '{heading}'. 110-180 words. A real take: who gains, who is left standing, what a reader in traffic on Thika Road should notice. Do not restate the lede. No moral. No 'only time will tell'.

RULES: 520-850 words. Reporting AND commentary — both required. Do not skip the take.
If the source is Hollywood, US awards, Premier League, NBA or other foreign showbiz with no Kenyan stake, DO NOT write it — stop and output SKIP.
Kenya or East Africa must be in the story. Money in KSh. Distance in km.
Vary verbs and openers. Never start two paragraphs the same way. Never open with weekday + date + time-of-day.
NEVER write 'is the central subject of the update' or any keyword-stuffing line.
Do not repeat the title as a stuffed sentence. No competing media brands. No em-dashes.
Banned: {', '.join(BANNED_PHRASES[:18])}...
Output ONLY the article body in markdown. No meta.
"""


def seo_fields(title: str, body: str, category: str, author: str) -> dict:
    clean = re.sub(r"^#+\s*", "", title).strip()
    if len(clean) > 65:
        cut = clean[:66]
        clean = cut.rsplit(" ", 1)[0].strip(" -:,")
    plain = re.sub(r"[#*_>`]", "", body)
    plain = re.sub(r"\s+", " ", plain).strip()
    desc = plain[:155]
    if len(plain) > 155:
        desc = desc.rsplit(" ", 1)[0].rstrip(".,;:") + "."
    if len(desc) < 120:
        desc = (desc.rstrip(".") + " Coverage from Nairobi, Kenya.")[:155]
    excerpt = plain[:160].replace('"', "'")
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
    out: list[str] = []
    skipping = False
    for i, line in enumerate(lines):
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


def _clean_know_bullets(body: str) -> str:
    m = re.search(r"(?im)^(#{2,3}\s*What we know:?\s*)$", body)
    if not m:
        return body
    start = m.end()
    lines = body[start:].splitlines(True)
    kept: list[str] = []
    consumed = 0
    for line in lines:
        stripped = line.strip()
        if not stripped:
            kept.append(line)
            consumed += len(line)
            peek = "".join(lines[len(kept):]).lstrip()
            if peek.startswith("#"):
                break
            continue
        if re.match(r"^#{2,3}\s+", stripped) and not re.match(r"^#{2,3}\s*What we know", stripped, re.I):
            break
        if stripped.startswith(("-", "*", "+")):
            fact = re.sub(r"^[-*+]\s+", "", stripped)
            fact = re.sub(r"^#{1,6}\s+", "", fact).strip()
            if len(fact) >= 22 and (re.search(r"[.!?]$", fact) or re.search(r"\d", fact) or len(fact) >= 80):
                kept.append(f"- {fact}\n")
            consumed += len(line)
            continue
        break
    return body[:start] + "\n" + "".join(kept).rstrip() + "\n\n" + body[start + consumed:].lstrip()


def inject_know_if_missing(body: str, category: str = "News", title: str = "") -> str:
    if not should_have_know(category, title):
        return strip_know_block(body or "")
    text = body or ""
    if re.search(r"what we know", text, re.I):
        return _clean_know_bullets(text)
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
    """Remove calendar/clock openers like 'On Tuesday afternoon, September 8, 2026,'."""
    if not body:
        return body
    lines = body.splitlines()
    out: list[str] = []
    stripped_once = False
    i = 0
    patterns = [
        re.compile(
            r"^(?:On\s+)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+"
            r"(?:morning|afternoon|evening|night|dawn|dusk)?\s*,?\s*"
            r"(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+"
            r"\d{1,2}(?:st|nd|rd|th)?(?:,)?\s*\d{4}\s*[,:]?\s*",
            re.I,
        ),
        re.compile(
            r"^(?:On\s+)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+"
            r"(?:morning|afternoon|evening|night)\s*,\s*",
            re.I,
        ),
        re.compile(
            r"^On\s+(?:the\s+)?(?:morning|afternoon|evening|night)\s+of\s+"
            r"(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+"
            r"\d{1,2}(?:st|nd|rd|th)?(?:,)?\s*\d{4}\s*[,:]?\s*",
            re.I,
        ),
        re.compile(
            r"^On\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+"
            r"\d{1,2}(?:st|nd|rd|th)?(?:,)?\s*\d{4}\s*[,:]?\s*",
            re.I,
        ),
    ]
    while i < len(lines):
        line = lines[i]
        if not stripped_once and line.strip() and not line.strip().startswith("#"):
            para_lines = [line]
            j = i + 1
            while j < len(lines) and lines[j].strip():
                para_lines.append(lines[j])
                j += 1
            para = " ".join(l.strip() for l in para_lines)
            new_para = para
            for pat in patterns:
                m = pat.match(new_para)
                if m:
                    new_para = new_para[m.end():].strip()
                    break
            if new_para and new_para[0].islower():
                new_para = new_para[0].upper() + new_para[1:]
            out.append(new_para)
            stripped_once = True
            i = j
            if i < len(lines) and not lines[i].strip():
                out.append("")
                i += 1
            continue
        out.append(line)
        i += 1
    result = "\n".join(out).strip()
    if body.endswith("\n"):
        result += "\n"
    return result


def polish_body(body: str, category: str = "News", title: str = "") -> str:
    cleaned = strip_date_lede(strip_banned(body or ""))
    return inject_know_if_missing(cleaned, category, title)
