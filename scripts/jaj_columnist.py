import os, sys, json, re, time, random, hashlib, datetime, glob
from google import genai
from google.genai import types

try:
    from voice_guard import news_prompt, should_skip_story, strip_banned, inject_know_if_missing, seo_fields, polish_body, model_skipped
except ImportError:
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from voice_guard import news_prompt, should_skip_story, strip_banned, inject_know_if_missing, seo_fields, polish_body, model_skipped


AUTHOR_NAME   = "Jaj"
AUTHOR_SLUG   = "jaj"
CATEGORY      = "Opinions"
SITE_BASE_URL = "https://zandani.co.ke"
POSTS_DIR     = os.environ.get("POSTS_DIR", "content/posts")
MEMORY_FILE   = os.environ.get("MEMORY_FILE", ".github/memory_opinions.json")
MAX_ARTICLES  = int(os.environ.get("MAX_ARTICLES", "1") or "1")
SOURCE_CATEGORY = (os.environ.get("SOURCE_CATEGORY") or "").strip()

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
    "is the central subject of the update", "central subject of the update",
    "central to this update", "search-ready summary", "key takeaway",
]

STYLE_PRESETS = [
    {"name": "Hot Take", "tone": "Blunt, witty, Kenyan street-smart", "structure": "Claim, three punches, soft landing"},
    {"name": "Civic Lens", "tone": "Serious, civic, fair", "structure": "Problem, evidence, who pays, demand"},
    {"name": "Culture Read", "tone": "Observant, cultural", "structure": "Scene, meaning, stakes, close"},
    {"name": "Accountability", "tone": "Direct, pointed", "structure": "Name it, prove it, cost, next step"},
]

now_utc = datetime.datetime.utcnow()
now_eat = now_utc + datetime.timedelta(hours=3)
publish_ts = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
today_str = now_eat.strftime("%Y-%m-%d")
full_date_str = now_eat.strftime("%A, %B %d, %Y")

def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return {"used_slugs": [], "style_history": [], "published_hashes": []}
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if not isinstance(raw, dict):
            return {"used_slugs": [], "style_history": [], "published_hashes": []}
        raw.setdefault("used_slugs", [])
        raw.setdefault("style_history", [])
        raw.setdefault("published_hashes", [])
        return raw
    except Exception as e:
        print(f"Memory load error: {e}")
        return {"used_slugs": [], "style_history": [], "published_hashes": []}

def save_memory(mem):
    os.makedirs(os.path.dirname(MEMORY_FILE) or ".", exist_ok=True)
    mem["used_slugs"] = mem.get("used_slugs", [])[-200:]
    mem["style_history"] = mem.get("style_history", [])[-30:]
    mem["published_hashes"] = mem.get("published_hashes", [])[-500:]
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(mem, f, indent=2)

memory = load_memory()

def parse_frontmatter(text):
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    meta = {}
    for line in parts[1].splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip().strip('"').strip("'")
    return meta, parts[2].strip()

def list_source_posts():
    posts = []
    for path in sorted(glob.glob(os.path.join(POSTS_DIR, "*.md")), reverse=True)[:80]:
        try:
            with open(path, "r", encoding="utf-8") as f:
                raw = f.read()
        except Exception:
            continue
        meta, body = parse_frontmatter(raw)
        cat = (meta.get("category") or "").lower()
        if cat == "opinions":
            continue
        if SOURCE_CATEGORY and SOURCE_CATEGORY.lower() not in cat:
            continue
        slug = os.path.splitext(os.path.basename(path))[0]
        if slug in memory.get("used_slugs", []):
            continue
        title = meta.get("title") or slug
        if len(body) < 300:
            continue
        posts.append({"slug": slug, "title": title, "category": meta.get("category", ""), "body": body[:3500]})
    return posts

def pick_style(history):
    recent = set(history[-3:])
    candidates = [s for s in STYLE_PRESETS if s["name"] not in recent] or STYLE_PRESETS
    return random.choice(candidates)

def content_hash(title, body):
    raw = (title + "|" + body[:800]).lower()
    raw = re.sub(r"\s+", " ", raw)
    return hashlib.sha256(raw.encode()).hexdigest()[:24]

def strip_spam(text):
    if not text:
        return text
    text = re.sub(r"[^\.\n]*is the central subject of the update[\.\s]*", "", text, flags=re.I)
    text = re.sub(r"[^\.\n]*central subject of the update[\.\s]*", "", text, flags=re.I)
    text = re.sub(r"[^\.\n]*central to this update[\.\s]*", "", text, flags=re.I)
    return text.strip()

def has_banned(text):
    low = text.lower()
    return any(p in low for p in BANNED_PHRASES)

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
                config=types.GenerateContentConfig(temperature=0.9, max_output_tokens=4096),
            )
            text = (resp.text or "").strip()
            if text:
                return text, model
        except Exception as e:
            last_err = e
            print(f"Model {model} failed: {e}")
            time.sleep(1)
    raise RuntimeError(f"All models failed: {last_err}")

def build_prompt(src, style):
    return news_prompt(
        AUTHOR_NAME,
        full_date_str,
        style,
        src.get("title",""),
        src.get("body","")[:3000],
        role="opinion columnist",
        opinion=True,
        desk="Opinions",
    )


def slugify(title):
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s[:80]

def write_post(title, body_md, style_name, source_slug):
    body_md = polish_body(body_md)
    seo = seo_fields(title, body_md, CATEGORY, AUTHOR_NAME)
    slug = f"{today_str}-opinion-{slugify(seo['title'])}"
    path = os.path.join(POSTS_DIR, f"{slug}.md")
    os.makedirs(POSTS_DIR, exist_ok=True)
    fm = f"""---
title: "{seo['title']}"
slug: "{slugify(seo['title'])}"
description: "{seo['description']}"
excerpt: "{seo['excerpt']}"
date: {publish_ts}
dateModified: {publish_ts}
author: "{AUTHOR_NAME}"
category: "{CATEGORY}"
county: "{seo['county']}"
image: ""
readTime: {max(3, len(body_md.split()) // 180)}
source: "internal:{source_slug}"
stylePreset: "{style_name}"
schema: "NewsArticle"
---

{body_md}
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(fm)
    print(f"Wrote {path}")
    return slug

def main():
    print(f"[{AUTHOR_NAME}] columnist run @ {publish_ts} max={MAX_ARTICLES}")
    sources = list_source_posts()
    if not sources:
        print("No unused source posts")
        return
    written = 0
    for src in sources:
        if written >= MAX_ARTICLES:
            break
        style = pick_style(memory.get("style_history", []))
        prompt = build_prompt(src, style)
        try:
            article, model_used = call_gemini(prompt)
        except Exception as e:
            print(f"Generation failed: {e}")
            continue
        if model_skipped(article):
            print("Model skipped foreign story")
            continue
        article = polish_body(article)
        if has_banned(article) or len(article) < 400:
            print("Rejected: banned or too short")
            continue
        title = src["title"]
        if article.startswith("#"):
            first = article.split("\n", 1)[0]
            title = re.sub(r"^#+\s*", "", first).strip() or title
            article = article.split("\n", 1)[-1].strip()
        if not title.lower().startswith(("why", "how", "kenya", "the case", "stop", "we ")):
            title = f"Why {title}" if len(title) < 70 else title
        h = content_hash(title, article)
        if h in memory.get("published_hashes", []):
            print("Duplicate hash, skip")
            continue
        write_post(title, article, style["name"], src["slug"])
        memory.setdefault("used_slugs", []).append(src["slug"])
        memory.setdefault("style_history", []).append(style["name"])
        memory.setdefault("published_hashes", []).append(h)
        save_memory(memory)
        written += 1
        print("Memory updated")
    if written == 0:
        print("No opinion piece published this run")
    else:
        print(f"Published {written} opinion piece(s)")

if __name__ == "__main__":
    main()
