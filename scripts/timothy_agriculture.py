import os, sys, json, re, time, random, hashlib, base64, itertools, datetime, urllib.parse
import requests
from dateutil import parser as date_parser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from google import genai
from google.genai import types

AUTHOR_NAME    = "Timothy Muli"
AUTHOR_SLUG    = "timothy-muli"
CATEGORY       = "Agriculture"
SITE_BASE_URL  = "https://zandani.co.ke"
SOURCE_URL     = "https://smartfarmerkenya.com/"
SOURCE_DOMAIN  = "smartfarmerkenya.com"
POSTS_DIR      = os.environ.get("POSTS_DIR", "content/posts")
MEMORY_FILE    = os.environ.get("MEMORY_FILE", ".github/memory_timothy.json")

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
]

BRANDS_TO_SCRUB = [
    "Kenyans.co.ke",
    "Daily Nation",
    "Nation.Africa",
    "The Standard",
    "Standard Media",
    "Citizen Digital",
    "Tuko",
    "Pulse Live",
    "Capital FM",
    "K24",
    "NTV Kenya",
    "KTN News",
    "BBC",
    "CNN",
    "Reuters",
    "Al Jazeera",
    "Smart Farmer Kenya",
]

STYLE_PRESETS = [
    {"name": "Market Report", "format": "Agri market news report", "lead_style": "Lead with the price, harvest or policy move", "tone": "Authoritative, factual, precise", "angle": "What this means for farmers right now", "structure": "Lead, three context paragraphs, reaction, outlook", "sentence_mix": "Short and medium, dense with numbers", "closing": "Clear takeaway for the farmer"},
    {"name": "Policy Brief", "format": "Policy and regulation brief", "lead_style": "Open with the new rule or bill and who it hits", "tone": "Clear, slightly urgent", "angle": "How the policy changes farm economics", "structure": "Announcement, three impacts, who benefits/loses, next steps", "sentence_mix": "Medium with one heavier paragraph", "closing": "A pointed question"},
    {"name": "Backgrounder", "format": "Backgrounder with timeline beats", "lead_style": "Place this season inside a longer pattern", "tone": "Measured, knowledgeable", "angle": "How we got here and where it usually ends", "structure": "Today, three beats, pattern, outlook", "sentence_mix": "Medium with one short closer", "closing": "Pattern recognition closer"},
    {"name": "SME Farmer Angle", "format": "Smallholder angle", "lead_style": "Lead with how this hits smallholder farmers", "tone": "Grounded, practical", "angle": "What this changes for the average Kenyan smallholder", "structure": "Hook, three impacts, practical action", "sentence_mix": "Conversational, concrete", "closing": "Action oriented closer"},
]

now_utc = datetime.datetime.utcnow()
now_eat = now_utc + datetime.timedelta(hours=3)
publish_ts = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
today_str = now_eat.strftime("%Y-%m-%d")

def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return {"published_hashes": [], "style_history": [], "angle_history": []}
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
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
    os.makedirs(os.path.dirname(MEMORY_FILE) or ".", exist_ok=True)
    mem["published_hashes"] = mem.get("published_hashes", [])[-500:]
    mem["style_history"] = mem.get("style_history", [])[-30:]
    mem["angle_history"] = mem.get("angle_history", [])[-80:]
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(mem, f, indent=2)

memory = load_memory()

def pick_style(history):
    recent = set(history[-3:])
    candidates = [s for s in STYLE_PRESETS if s["name"] not in recent] or STYLE_PRESETS
    return random.choice(candidates)

def content_hash(title, body):
    raw = (title + "|" + body[:800]).lower()
    raw = re.sub(r"\s+", " ", raw)
    return hashlib.sha256(raw.encode()).hexdigest()[:24]

def scrub_brands(text):
    for b in BRANDS_TO_SCRUB:
        text = re.sub(re.escape(b), "", text, flags=re.I)
    return text

def has_banned(text):
    low = text.lower()
    return any(p in low for p in BANNED_PHRASES)

def scrape_source():
    stories = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(SOURCE_URL, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(2500)
            html = page.content()
            browser.close()
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.select("a[href]")[:80]:
            href = a.get("href") or ""
            title = a.get_text(" ", strip=True)
            if len(title) < 25 or len(title) > 140:
                continue
            if not any(x in href for x in ["/20", "article", "news", "story", "post"]):
                continue
            if href.startswith("/"):
                href = urllib.parse.urljoin(SOURCE_URL, href)
            if SOURCE_DOMAIN not in href:
                continue
            stories.append({"title": title, "url": href})
        # dedupe
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
        paragraphs = [p.get_text(" ", strip=True) for p in soup.select("p") if len(p.get_text(strip=True)) > 40]
        body = "\n\n".join(paragraphs[:18])
        return scrub_brands(body)[:6000]
    except Exception as e:
        print(f"Fetch article error: {e}")
        return ""

def call_gemini(prompt):
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("No GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    last_err = None
    for model in MODELS_TO_TRY:
        try:
            resp = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.85, max_output_tokens=4096),
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
    return f"""You are {AUTHOR_NAME}, agriculture correspondent for Zandani (Kenya).
Write an original article in English for Kenyan farmers and agribusiness readers.

SOURCE STORY TITLE: {story['title']}
SOURCE URL: {story['url']}
SOURCE BODY (use for facts only, rewrite completely):
{source_body[:4500]}

STYLE PRESET: {style['name']}
Format: {style['format']}
Lead style: {style['lead_style']}
Tone: {style['tone']}
Angle: {style['angle']}
Structure: {style['structure']}
Sentence mix: {style['sentence_mix']}
Closing: {style['closing']}

RULES:
- 650-950 words
- Original rewrite. No copying sentences.
- No banned phrases: {', '.join(BANNED_PHRASES[:10])}...
- Scrub any competing media brand names
- Kenya / East Africa focus
- Use concrete numbers, counties, crops when present
- Output ONLY the article body in markdown (## subheads allowed). No title line. No meta.
"""

def slugify(title):
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s[:80]

def write_post(title, body_md, style_name, source_url):
    slug = f"{today_str}-{slugify(title)}"
    path = os.path.join(POSTS_DIR, f"{slug}.md")
    os.makedirs(POSTS_DIR, exist_ok=True)
    fm = f"""---
title: "{title.replace('"', "'")}"
date: {publish_ts}
author: "{AUTHOR_NAME}"
category: "{CATEGORY}"
image: ""
excerpt: "{body_md[:160].replace(chr(10), ' ').replace('"', "'").strip()}..."
readTime: {max(3, len(body_md.split()) // 180)}
source: "{source_url}"
stylePreset: "{style_name}"
---

{body_md}
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(fm)
    print(f"Wrote {path}")
    return slug

def main():
    print(f"[{AUTHOR_NAME}] starting {CATEGORY} run @ {publish_ts}")
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
        except Exception as e:
            print(f"Generation failed: {e}")
            continue
        if has_banned(article) or len(article) < 400:
            print("Rejected: banned or too short")
            continue
        h = content_hash(story["title"], article)
        if h in memory.get("published_hashes", []):
            print("Duplicate hash, skip")
            continue
        # title from first heading or story
        title = story["title"]
        if article.startswith("#"):
            first = article.split("\n", 1)[0]
            title = re.sub(r"^#+\s*", "", first).strip() or title
            article = article.split("\n", 1)[-1].strip()
        angle_signature = style["name"] + "|" + title[:40]
        if angle_signature in memory.get("angle_history", []):
            print("Angle repeat, skip")
            continue
        write_post(title, article, style["name"], story["url"])
        memory.setdefault("published_hashes", []).append(h)
        memory.setdefault("style_history", []).append(style["name"])
        memory.setdefault("angle_history", []).append(angle_signature)
        save_memory(memory)
        print("Memory updated")
        return  # one post per run
    print("No suitable story published this run")

if __name__ == "__main__":
    main()
