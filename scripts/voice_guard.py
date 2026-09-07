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

# Local names that rarely include the word "Kenya" in a Pulse/Ghafla headline.
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
    r"\bhollywood\b", r"\bemmy\b", r"\boscars?\b", r"\bgrammy\b",
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
    """True = do not write this story."""
    cat = (category or "").lower()
    text = (blob or "").lower()
    score = kenya_score(blob)
    western = _western(text)
    local = _local_name(text)

    if cat in {"opinions", "opinion"}:
        # Columnists rewrite our own Kenya posts; never skip on Hollywood tokens
        # that might appear as contrast.
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


def is_spam(text: str, min_words: int = 220) -> bool:
    if not text:
        return True
    low = text.lower()
    if any(m in low for m in BANNED_PHRASES):
        return True
    if re.search(r"##\s*analysis\b", text, re.I):
        return True
    if len(re.findall(r"\w+", text)) < min_words:
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


def news_prompt(
    author: str,
    date_eat: str,
    style: dict,
    title: str,
    source_body: str,
    role: str = "correspondent",
    opinion: bool = False,
    desk: str = "News",
) -> str:
    know = (
        "After the lede, add a short 'What we know' list of 3-5 bullets. "
        "Each bullet is one fact with a name, place, time or number. No filler."
    )
    voice = (
        "VOICE: Nairobi newsroom. Short sentences. Concrete nouns. Names, counties, "
        "shillings, EAT times. Kenyan English is allowed. Do not fake Sheng. "
        "Never write like a US morning show or a press release. "
        "Prefer Westlands Exit, Waiyaki Way, Kasarani over 'a major highway'."
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

RULES:
- 650-900 words. Original prose. Argument in the first line.
- Kenya first. If the source is foreign, say what it costs a reader in Nairobi.
- {know}
- NEVER write 'is the central subject of the update' or keyword stuffing.
- No competing media brands. No em-dashes.
- Output ONLY the article body in markdown. No meta.
Banned: {', '.join(BANNED_PHRASES[:14])}...
"""

    return f"""You are {author}, a {role} for Za Ndani (Kenya).
Today is {date_eat} EAT. Desk: {desk}.
{voice}
This is a NEWS website. Who, what, where, when, how. No American morning. No hype.

SOURCE TITLE: {title}
SOURCE (facts only, rewrite completely):
{source_body[:4500]}

STYLE: {style.get('name')}. Lead: {style.get('lead_style')}. Tone: {style.get('tone')}. Structure: {style.get('structure')}.

MARKDOWN OUTPUT:
1) H2 factual headline (max ~65 characters), then a 40-60 word lede that stands alone: who + what + where + when in EAT.
2) {know}
3) Body 4-7 short paragraphs: next facts, attributed statements, numbers, places.
4) Optional one-line status closer only if a next step is already scheduled. No moral. No prediction.

RULES: 500-800 words. NO Analysis section. NO commentary essays. NO what this means.
If the source is Hollywood, US awards, Premier League, NBA or other foreign showbiz with no Kenyan stake, DO NOT write it — stop and output SKIP.
Kenya or East Africa must be in the story. Money in KSh. Distance in km.
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


def inject_know_if_missing(body: str) -> str:
    if re.search(r"what we know", body, re.I):
        return body
    paras = [p.strip() for p in re.split(r"\n\s*\n", body.strip()) if p.strip()]
    if len(paras) < 2:
        return body
    lede = paras[0]
    rest = paras[1:]
    facts = []
    for p in rest[:4]:
        sent = re.split(r"(?<=[.!?])\s+", p)
        if sent:
            facts.append(sent[0].strip())
        if len(facts) >= 4:
            break
    if len(facts) < 3:
        return body
    bullets = "\n".join(f"- {f}" for f in facts)
    block = f"{lede}\n\n### What we know\n\n{bullets}\n\n" + "\n\n".join(rest)
    return block


def polish_body(body: str) -> str:
    return inject_know_if_missing(strip_banned(body or ""))
