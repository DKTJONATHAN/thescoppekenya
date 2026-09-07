"""Shared scrape + rewrite pipeline for Zandani category writers.
Hard-news by default: who/what/where/when/how. No commentary spam.
"""
import os, json, re, time, random, hashlib, datetime, urllib.parse
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from google import genai
from google.genai import types

MODELS_TO_TRY = [
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
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
    "what this means right now", "how this changes the picture",
]

BRANDS_TO_SCRUB = [
    "Kenyans.co.ke", "Daily Nation", "Nation.Africa", "The Standard", "Standard Media",
    "Citizen Digital", "Tuko", "Pulse Live", "Capital FM", "K24", "NTV Kenya", "KTN News",
    "BBC", "CNN", "Reuters", "Al Jazeera", "Business Daily", "Smart Farmer Kenya",
    "Techweez", "OkayAfrica", "Africanews",
]

# Hard-news only — no Analysis / Human Angle commentary defaults
DEFAULT_STYLES = [
    {
        "name": "Hard News Lead",
        "format": "News report",
        "lead_style": "Who did what, where, when.",
        "tone": "Neutral wire-service. No opinion.",
        "angle": "What happened",
        "structure": "Lead, facts by importance, quotes, status",
        "sentence_mix": "Short and medium",
        "closing": "Status only if already scheduled",
    },
    {
        "name": "Event Report",
        "format": "Event report",
        "lead_style": "Open with the event and principal actor.",
        "tone": "Factual, clipped.",
        "angle": "Sequence of events",
        "structure": "Lead, sequence, confirmation, numbers",
        "sentence_mix": "Short",
        "closing": "Status",
    },
    {
        "name": "Statement Report",
        "format": "Statement report",
        "lead_style": "Official action or statement first.",
        "tone": "Neutral, attribution-heavy.",
        "angle": "What was said or ordered",
        "structure": "Lead, quote/order, background, response",
        "sentence_mix": "Medium",
        "closing": "Response or next step if known",
    },
]


def strip_spam(text):
    if not text:
        return text
    text = re.sub(r"[^.\n]*is central to this update for Kenyan readers[.\s]*", "", text, flags=re.I)
    text = re.sub(r"[^.\n]*is the central subject of the update[.\s]*", "", text, flags=re.I)
    text = re.sub(r"[^.\n]*central subject of the update[.\s]*", "", text, flags=re.I)
    text = re.sub(r"[^.\n]*central to this update[.\s]*", "", text, flags=re.I)
    return text.strip()


def is_spam(text):
    if not text:
        return True
    low = text.lower()
    markers = [
        "is the central subject of the update",
        "central subject of the update",
        "central to this update",
        "what this means for kenyans",
        "search-ready summary",
        "key takeaway",
        "it remains to be seen",
    ]
    if any(m in low for m in markers):
        return True
    if re.search(r"##\s*analysis\b", text, re.I):
        return True
    if any(p in low for p in BANNED_PHRASES):
        return True
    if len(re.findall(r"\w+", text)) < 280:
        return True
    return False


def run_writer(cfg):
    author = cfg["author_name"]
    category = cfg["category"]
    source_url = cfg["source_url"]
    source_domain = cfg["source_domain"]
    posts_dir = os.environ.get("POSTS_DIR", "content/posts")
    memory_file = os.environ.get("MEMORY_FILE", cfg["memory_file"])
    styles = cfg.get("styles") or DEFAULT_STYLES
    role = cfg.get("role", f"{category.lower()} correspondent")
    audience = cfg.get("audience", "Kenyan readers")
    extra_path_hints = cfg.get("path_hints", ["article", "news", "story", "post", "/20"])
    opinion_mode = bool(cfg.get("opinion_mode"))

    now_utc = datetime.datetime.utcnow()
    now_eat = now_utc + datetime.timedelta(hours=3)
    publish_ts = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
    today_str = now_eat.strftime("%Y-%m-%d")
    full_date_str = now_eat.strftime("%A, %B %d, %Y")

    def load_memory():
        if not os.path.exists(memory_file):
            return {"published_hashes": [], "style_history": [], "angle_history": []}
        try:
            with open(memory_file, "r", encoding="utf-8") as f:
                raw = json.load(f)
            if isinstance(raw, list):
                return {"published_hashes": raw[-500:], "style_history": [], "angle_history": []}
            if isinstance(raw, dict):
                raw.setdefault("published_hashes", [])
                raw.setdefault("style_history", [])
                raw.setdefault("angle_history", [])
                raw["style_history"] = [
                    (h.get("stylePreset") or h.get("name") or "") if isinstance(h, dict) else str(h)
                    for h in raw["style_history"]
                ]
                raw["style_history"] = [h for h in raw["style_history"] if h]
                return raw
        except Exception as e:
            print(f"Memory load error: {e}")
        return {"published_hashes": [], "style_history": [], "angle_history": []}

    def save_memory(mem):
        os.makedirs(os.path.dirname(memory_file) or ".", exist_ok=True)
        mem["published_hashes"] = mem.get("published_hashes", [])[-500:]
        mem["style_history"] = mem.get("style_history", [])[-30:]
        mem["angle_history"] = mem.get("angle_history", [])[-80:]
        with open(memory_file, "w", encoding="utf-8") as f:
            json.dump(mem, f, indent=2)

    memory = load_memory()

    def pick_style(history):
        recent = set(list(history)[-2:])
        candidates = [s for s in styles if s["name"] not in recent] or styles
        return random.choice(candidates)

    def content_hash(title, body):
        raw = (title + "|" + body[:800]).lower()
        raw = re.sub(r"\s+", " ", raw)
        return hashlib.sha256(raw.encode()).hexdigest()[:24]

    def scrub_brands(text):
        for b in BRANDS_TO_SCRUB:
            text = re.sub(re.escape(b), "", text, flags=re.I)
        return text

    def scrape_source():
        stories = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(source_url, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(2500)
                html = page.content()
                browser.close()
            soup = BeautifulSoup(html, "html.parser")
            for a in soup.select("a[href]")[:80]:
                href = a.get("href") or ""
                title = a.get_text(" ", strip=True)
                if len(title) < 25 or len(title) > 140:
                    continue
                if not any(x in href for x in extra_path_hints):
                    continue
                if href.startswith("/"):
                    href = urllib.parse.urljoin(source_url, href)
                if source_domain not in href:
                    continue
                stories.append({"title": title, "url": href})
            seen = set()
            uniq = []
            for s in stories:
                if s["url"] in seen:
                    continue
                seen.add(s["url"])
                uniq.append(s)
            return uniq[:12]
        except Exception as e:
            print(f"Scrape error: {e}")
            return []

    def fetch_article(url):
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, wait_until="domcontentloaded", timeout=40000)
                page.wait_for_timeout(1500)
                html = page.content()
                browser.close()
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "aside"]):
                tag.decompose()
            paragraphs = [
                p.get_text(" ", strip=True)
                for p in soup.select("p")
                if len(p.get_text(strip=True)) > 40
            ]
            body = "\n\n".join(paragraphs[:18])
            return scrub_brands(body)[:6000]
        except Exception as e:
            print(f"Fetch article error: {e}")
            return ""

    def call_gemini(prompt):
        api_key = (
            os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
            or os.environ.get("GEMINI_WRITE_KEY")
        )
        if not api_key:
            raise RuntimeError("No GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)
        last_err = None
        for model in MODELS_TO_TRY:
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.4 if not opinion_mode else 0.7,
                        max_output_tokens=4096,
                    ),
                )
                text = (resp.text or "").strip()
                if text:
                    return text, model
            except Exception as e:
                last_err = e
                print(f"Model {model} failed: {e}")
                time.sleep(1)
        raise RuntimeError(f"All models failed: {last_err}")

    def build_prompt(story, source_body, style):
        if opinion_mode:
            return f"""You are {author}, opinion columnist for Za Ndani (Kenya).
Today is {full_date_str} EAT.
Write a clear opinion piece for {audience}. Still ban keyword spam.

SOURCE TITLE: {story['title']}
SOURCE (facts only for grounding):
{source_body[:4500]}

STYLE: {style['name']}. Lead: {style.get('lead_style')}. Tone: {style.get('tone')}.
Structure: {style.get('structure')}.

RULES:
- 650-900 words. Original prose.
- NEVER write 'is the central subject of the update' or any keyword-stuffing line.
- No competing media brands. No em-dashes.
- Output ONLY the article body in markdown. No meta.
Banned: {', '.join(BANNED_PHRASES[:12])}...
"""

        return f"""You are {author}, a straight-news {role} for Za Ndani (Kenya).
Today is {full_date_str} EAT.
This is a NEWS website, not commentary. Write ONLY facts. Who, what, where, when, how. No opinion.

SOURCE TITLE: {story['title']}
SOURCE URL: {story['url']}
SOURCE (facts only, rewrite completely):
{source_body[:4500]}

STYLE: {style['name']}. Lead: {style.get('lead_style')}. Tone: {style.get('tone')}. Structure: {style.get('structure')}.

MARKDOWN OUTPUT:
1) H2 factual headline, then hard-news lead (1-2 sentences): who + what + where + when.
2) Body 4-7 short paragraphs: next facts, attributed statements, numbers, places.
3) Optional one-line status closer only if a next step is already scheduled. No moral. No prediction.

RULES: 500-800 words. NO Analysis section. NO commentary. NO what this means.
NEVER write 'is the central subject of the update' or any keyword-stuffing line.
Do not repeat the title as a stuffed sentence. No competing media brands. No em-dashes.
Banned: {', '.join(BANNED_PHRASES[:18])}...
Output ONLY the article body in markdown. No meta.
"""

    def slugify(title):
        s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        return s[:80]

    def write_post(title, body_md, style_name, source):
        body_md = strip_spam(body_md)
        slug = f"{today_str}-{slugify(title)}"
        path = os.path.join(posts_dir, f"{slug}.md")
        os.makedirs(posts_dir, exist_ok=True)
        excerpt = body_md[:160].replace(chr(10), " ").replace('"', "'").strip()
        fm = f"""---
title: "{title.replace('"', "'")}"
date: {publish_ts}
author: "{author}"
category: "{category}"
image: ""
excerpt: "{excerpt}..."
readTime: {max(3, len(body_md.split()) // 180)}
source: "{source}"
stylePreset: "{style_name}"
schema: "NewsArticle"
---

{body_md}
"""
        with open(path, "w", encoding="utf-8") as f:
            f.write(fm)
        print(f"Wrote {path}")
        return slug

    print(f"[{author}] hard-news run {category} @ {publish_ts}")
    stories = scrape_source()
    if not stories:
        print("No stories found")
        return
    style = pick_style(memory.get("style_history", []))
    print(f"Style: {style['name']}")
    for story in stories:
        body = fetch_article(story["url"])
        if len(body) < 200:
            continue
        prompt = build_prompt(story, body, style)
        try:
            article, model_used = call_gemini(prompt)
            print(f"Used {model_used}")
        except Exception as e:
            print(f"Generation failed: {e}")
            continue
        article = strip_spam(scrub_brands(article))
        if is_spam(article):
            print("Rejected: spam or too short")
            continue
        h = content_hash(story["title"], article)
        if h in memory.get("published_hashes", []):
            print("Duplicate hash, skip")
            continue
        title = story["title"]
        if article.startswith("#"):
            first = article.split("\n", 1)[0]
            title = re.sub(r"^#+\s*", "", first).strip() or title
            article = article.split("\n", 1)[-1].strip()
        write_post(title, article, style["name"], story["url"])
        memory.setdefault("published_hashes", []).append(h)
        memory.setdefault("style_history", []).append(style["name"])
        save_memory(memory)
        print("Memory updated")
        return
    print("No suitable story published this run")
