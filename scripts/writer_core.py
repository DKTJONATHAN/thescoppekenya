"""Shared scrape + rewrite pipeline for Zandani category writers."""
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
]

BRANDS_TO_SCRUB = [
    "Kenyans.co.ke", "Daily Nation", "Nation.Africa", "The Standard", "Standard Media",
    "Citizen Digital", "Tuko", "Pulse Live", "Capital FM", "K24", "NTV Kenya", "KTN News",
    "BBC", "CNN", "Reuters", "Al Jazeera", "Business Daily", "Smart Farmer Kenya",
    "Techweez", "OkayAfrica", "Africanews",
]

DEFAULT_STYLES = [
    {"name": "News Report", "format": "News report", "lead_style": "Lead with the key fact", "tone": "Authoritative, factual", "angle": "What this means right now", "structure": "Lead, three context paragraphs, reaction, outlook", "sentence_mix": "Short and medium", "closing": "Clear takeaway"},
    {"name": "Backgrounder", "format": "Backgrounder", "lead_style": "Place this inside a longer pattern", "tone": "Measured, knowledgeable", "angle": "How we got here", "structure": "Today, three beats, pattern, outlook", "sentence_mix": "Medium with one short closer", "closing": "Pattern recognition closer"},
    {"name": "Human Angle", "format": "Human angle", "lead_style": "Lead with how this hits ordinary Kenyans", "tone": "Grounded, practical", "angle": "What this changes for the average reader", "structure": "Hook, three impacts, practical action", "sentence_mix": "Conversational, concrete", "closing": "Action oriented closer"},
    {"name": "Analysis", "format": "Analysis", "lead_style": "Open with the tension or trade-off", "tone": "Clear, slightly urgent", "angle": "Who wins and who loses", "structure": "Tension, three forces, stakes, next steps", "sentence_mix": "Medium", "closing": "A pointed question"},
]

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

    now_utc = datetime.datetime.utcnow()
    now_eat = now_utc + datetime.timedelta(hours=3)
    publish_ts = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
    today_str = now_eat.strftime("%Y-%m-%d")

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
        recent = set(history[-3:])
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

    def has_banned(text):
        low = text.lower()
        return any(p in low for p in BANNED_PHRASES)

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
            paragraphs = [p.get_text(" ", strip=True) for p in soup.select("p") if len(p.get_text(strip=True)) > 40]
            body = "\n\n".join(paragraphs[:18])
            return scrub_brands(body)[:6000]
        except Exception as e:
            print(f"Fetch article error: {e}")
            return ""

    def call_gemini(prompt):
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_WRITE_KEY")
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
        return f"""You are {author}, {role} for Zandani (Kenya).
Write an original article in English for {audience}.

SOURCE STORY TITLE: {story['title']}
SOURCE URL: {story['url']}
SOURCE BODY (use for facts only, rewrite completely):
{source_body[:4500]}

STYLE PRESET: {style['name']}
Format: {style.get('format', 'News report')}
Lead style: {style.get('lead_style', 'Lead with the key fact')}
Tone: {style.get('tone', 'Clear')}
Angle: {style.get('angle', 'What this means')}
Structure: {style.get('structure', 'Lead, context, outlook')}
Sentence mix: {style.get('sentence_mix', 'Short and medium')}
Closing: {style.get('closing', 'Clear takeaway')}

RULES:
- 650-950 words
- Original rewrite. No copying sentences.
- No banned phrases
- Scrub any competing media brand names
- Kenya / East Africa / Africa focus
- Output ONLY the article body in markdown (## subheads allowed). No title line. No meta.
"""

    def slugify(title):
        s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        return s[:80]

    def write_post(title, body_md, style_name, source):
        slug = f"{today_str}-{slugify(title)}"
        path = os.path.join(posts_dir, f"{slug}.md")
        os.makedirs(posts_dir, exist_ok=True)
        fm = f"""---
title: "{title.replace('"', "'")}"
date: {publish_ts}
author: "{author}"
category: "{category}"
image: ""
excerpt: "{body_md[:160].replace(chr(10), ' ').replace('"', "'").strip()}..."
readTime: {max(3, len(body_md.split()) // 180)}
source: "{source}"
stylePreset: "{style_name}"
---

{body_md}
"""
        with open(path, "w", encoding="utf-8") as f:
            f.write(fm)
        print(f"Wrote {path}")
        return slug

    print(f"[{author}] starting {category} run @ {publish_ts}")
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
        return
    print("No suitable story published this run")
