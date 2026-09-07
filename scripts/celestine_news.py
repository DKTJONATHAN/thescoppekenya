#!/usr/bin/env python3
"""Celestine Nzioka — straight hard-news reporter for Za Ndani. No commentary."""
import os, sys, json, re, time, random, hashlib, itertools, datetime, urllib.parse
from dateutil import parser as date_parser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from google import genai
from google.genai import types

AUTHOR_NAME = "Celestine Nzioka"
CATEGORY = "News"
SOURCE_URL = "https://www.kenyans.co.ke/news"
SOURCE_DOMAIN = "kenyans.co.ke"
POSTS_DIR = os.environ.get("POSTS_DIR", "content/posts")
MEMORY_FILE = os.environ.get("MEMORY_FILE", ".github/memory_celestine_news.json")
MAX_CANDIDATES = 20
MAX_SCRAPE_TRIES = 8
FRESH_HOURS = 18

MODELS_TO_TRY = [
    "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash",
    "gemini-3.5-flash-lite", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-3-flash-preview",
]

BANNED_PHRASES = [
    "sasa basi", "melting the pot", "spill the tea", "dive in", "delve into",
    "moreover", "furthermore", "in conclusion", "it's worth noting",
    "a testament to", "navigating the landscape", "in today's digital age",
    "tapestry", "game-changer", "stay tuned", "unpack", "breaking news",
    "is central to this update for kenyan readers",
    "is the central subject of the update", "central subject of the update",
    "central to this update", "what this means for kenyans", "what this means for kenya",
    "key takeaway", "search-ready summary", "in a significant development",
    "sparking debate", "raising questions", "underscores the need",
    "only time will tell", "the bigger picture", "it remains to be seen",
    "this development comes as", "a wake-up call", "food for thought",
]

STYLE_PRESETS = [
    {"name": "Hard News Lead", "lead_style": "Who did what, where, when.",
     "tone": "Neutral wire-service. No opinion.", "structure": "Lead, facts by importance, quotes, status"},
    {"name": "Event Report", "lead_style": "Open with the event and principal actor.",
     "tone": "Factual, clipped.", "structure": "Lead, sequence, confirmation, numbers"},
    {"name": "Statement Report", "lead_style": "Official action or statement first.",
     "tone": "Neutral, attribution-heavy.", "structure": "Lead, quote/order, background, response"},
]

STOPWORDS = {
    "the","a","an","of","to","in","on","for","and","or","with","from","by","at","is","as",
    "new","kenya","kenyan","kenyans","after","says","said","over","into","about","how","why",
    "what","who","this","that","has","have","will","not","its","their","his","her",
}

now_utc = datetime.datetime.utcnow()
now_eat = now_utc + datetime.timedelta(hours=3)
publish_ts = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
today_str = now_eat.strftime("%Y-%m-%d")
full_date_str = now_eat.strftime("%A, %B %d, %Y")

def canonicalize_url(url):
    if not url:
        return ""
    p = urllib.parse.urlparse(url.strip())
    path = re.sub(r"/+", "/", p.path).rstrip("/")
    return urllib.parse.urlunparse((p.scheme or "https", p.netloc.lower().replace("www.", ""), path, "", "", ""))

def norm_title(text):
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    return " ".join(w for w in words if w not in STOPWORDS and len(w) > 2)

def load_memory():
    empty = {"published_hashes": [], "published_urls": [], "published_titles": [], "style_history": []}
    if not os.path.exists(MEMORY_FILE):
        return empty
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if isinstance(raw, list):
            empty["published_hashes"] = raw[-800:]
            return empty
        for k in empty:
            raw.setdefault(k, empty[k])
        return raw
    except Exception as e:
        print(f"Memory load error: {e}")
        return empty

def save_memory(mem):
    os.makedirs(os.path.dirname(MEMORY_FILE) or ".", exist_ok=True)
    for k, n in [("published_hashes", 800), ("published_urls", 800), ("published_titles", 800), ("style_history", 30)]:
        mem[k] = mem.get(k, [])[-n:]
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(mem, f, indent=2)

def pick_style(history):
    recent = set(list(history)[-2:])
    c = [s for s in STYLE_PRESETS if s["name"] not in recent] or STYLE_PRESETS
    return random.choice(c)

def browser_page(url, wait_ms=1800):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = browser.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        page.goto(url, timeout=45000, wait_until="domcontentloaded")
        page.wait_for_timeout(wait_ms)
        html = page.content()
        browser.close()
    return BeautifulSoup(html, "html.parser")

def get_target_urls():
    urls = []
    try:
        soup = browser_page(SOURCE_URL, 2000)
        for a in soup.select("a[href]"):
            href = a.get("href", "")
            if "/news/" not in href or any(x in href for x in ["#", "?page=", "/category/", "/tag/"]):
                continue
            full = href if href.startswith("http") else "https://www.kenyans.co.ke" + href
            full = canonicalize_url(full)
            if full and full not in urls:
                urls.append(full)
    except Exception as e:
        print(f"List scrape error: {e}")
    print(f"Found {len(urls)} candidates")
    return urls[:MAX_CANDIDATES]

def scrape_article(url):
    try:
        soup = browser_page(url, 1600)
    except Exception as e:
        print(f"Scrape failed: {e}")
        return None, None, None
    meta = soup.find("meta", property="article:published_time")
    if meta and meta.get("content"):
        try:
            pt = date_parser.parse(meta["content"])
            if pt.tzinfo is None:
                pt = pt.replace(tzinfo=datetime.timezone.utc)
            if (datetime.datetime.now(datetime.timezone.utc) - pt).total_seconds() / 3600 > FRESH_HOURS:
                return None, None, None
        except Exception:
            pass
    t = soup.find("title")
    title = t.get_text(strip=True) if t else ""
    for sep in [" | ", " - "]:
        if sep in title:
            title = title.split(sep)[0].strip()
    text = ""
    for sel in ["article", ".node__content", ".field--name-body", ".article__body", "main article", ".content"]:
        c = soup.select_one(sel)
        if c:
            text = "\n\n".join(p.get_text(" ", strip=True) for p in c.find_all("p") if len(p.get_text(strip=True)) > 30)
            if len(text) > 500:
                break
    if len(text) < 500:
        text = "\n\n".join(p.get_text(" ", strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 30)
    img = ""
    for m in soup.find_all("meta"):
        prop = m.get("property") or m.get("name") or ""
        if prop in ("og:image", "twitter:image"):
            img = m.get("content", "")
            break
    return text, img, title

def strip_spam(text):
    if not text:
        return text
    text = re.sub(r"[^.\n]*is central to this update for Kenyan readers[.\s]*", "", text, flags=re.I)
    text = re.sub(r"[^.\n]*is the central subject of the update[.\s]*", "", text, flags=re.I)
    text = re.sub(r"[^.\n]*central subject of the update[.\s]*", "", text, flags=re.I)
    return text.strip()

def is_spam(text):
    if not text:
        return True
    low = text.lower()
    markers = [
        "is the central subject of the update", "central subject of the update",
        "central to this update", "what this means for kenyans", "search-ready summary",
        "key takeaway", "it remains to be seen",
    ]
    if any(m in low for m in markers):
        return True
    if re.search(r"##\s*analysis\b", text, re.I):
        return True
    if len(re.findall(r"\w+", text)) < 300:
        return True
    return False

raw_keys = [os.environ.get(k) for k in ("GEMINI_WRITE_KEY", "GEMINI_API_KEY", "GEMINI_API_KEY1") if os.environ.get(k)]
if not raw_keys:
    print("No Gemini keys")
    sys.exit(1)
key_cycle = itertools.cycle(raw_keys)
current_key = next(key_cycle)
client = genai.Client(api_key=current_key)

def gemini_call(prompt, label=""):
    global current_key, client
    for model in MODELS_TO_TRY:
        for attempt in range(3):
            try:
                resp = client.models.generate_content(model=model, contents=prompt)
                out = (resp.text or "").strip()
                if out:
                    print(f"Gemini OK [{model}] {label}")
                    return out
            except Exception as e:
                msg = str(e).lower()
                if any(x in msg for x in ["404", "not_found", "not found", "deprecated"]):
                    break
                if any(x in msg for x in ["429", "quota", "rate", "503", "unavailable", "500", "overloaded"]):
                    time.sleep(8)
                    current_key = next(key_cycle)
                    client = genai.Client(api_key=current_key)
                    continue
                print(f"Gemini error [{model}] {label}: {e}")
                break
    return None

def stage_write(raw_title, raw_text, style):
    prompt = (
        f"You are {AUTHOR_NAME}, a straight-news reporter for Za Ndani (Kenya). Today is {full_date_str} EAT.\n"
        "This is a NEWS website, not commentary. Write ONLY facts. Who, what, where, when, how. No opinion.\n\n"
        f"STYLE: {style['name']}. Lead: {style['lead_style']}. Tone: {style['tone']}. Structure: {style['structure']}.\n\n"
        f"SOURCE TITLE: {raw_title}\nSOURCE (facts only, rewrite completely):\n{raw_text[:5000]}\n\n"
        "MARKDOWN OUTPUT:\n"
        "1) H2 factual headline, then hard-news lead (1-2 sentences): who + what + where + when.\n"
        "2) Body 4-7 short paragraphs: next facts, attributed statements, numbers, places.\n"
        "3) Optional one-line status closer only if a next step is already scheduled. No moral. No prediction.\n\n"
        "RULES: 500-700 words. NO Analysis section. NO commentary. NO what this means.\n"
        "NEVER write is the central subject of the update or any keyword-stuffing line.\n"
        "Do not repeat the title as a stuffed sentence. No competing media brands. No em-dashes.\n"
        f"Banned: {', '.join(BANNED_PHRASES[:15])}...\n"
    )
    return gemini_call(prompt, "write")

def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:80]

def write_post(title, body_md, style_name, source_url, image=""):
    body_md = strip_spam(body_md)
    slug = f"{today_str}-{slugify(title)}"
    path = os.path.join(POSTS_DIR, f"{slug}.md")
    os.makedirs(POSTS_DIR, exist_ok=True)
    excerpt = re.sub(r"\s+", " ", body_md[:160].replace(chr(34), chr(39))).strip()
    title_safe = title.replace(chr(34), chr(39))
    lines = [
        "---",
        f'title: "{title_safe}"',
        f"date: {publish_ts}",
        f'author: "{AUTHOR_NAME}"',
        f'category: "{CATEGORY}"',
        f'image: "{image}"',
        f'excerpt: "{excerpt}..."',
        f"readTime: {max(3, len(body_md.split()) // 180)}",
        f'source: "{source_url}"',
        f'stylePreset: "{style_name}"',
        "---",
        "",
        body_md,
        "",
    ]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Wrote {path}")
    return slug

def main():
    memory = load_memory()
    style = pick_style(memory.get("style_history", []))
    print(f"[{AUTHOR_NAME}] hard-news run @ {publish_ts} style={style['name']}")
    links = get_target_urls()
    if not links:
        print("No links")
        save_memory(memory)
        return 0
    seen = set(memory.get("published_hashes", []))
    for link in links[:MAX_SCRAPE_TRIES]:
        canon = canonicalize_url(link)
        h = hashlib.md5(canon.encode()).hexdigest()
        if h in seen:
            continue
        text, img, ttl = scrape_article(link)
        if not text or len(text) < 500:
            continue
        article = stage_write(ttl or "", text, style)
        if not article or is_spam(article):
            print("Rejected spam or empty")
            continue
        title = ttl or "Kenya news update"
        if article.startswith("#"):
            first = article.split("\n", 1)[0]
            title = re.sub(r"^#+\s*", "", first).strip() or title
            article = article.split("\n", 1)[-1].strip()
        write_post(title, article, style["name"], link, img or "")
        memory.setdefault("published_hashes", []).append(h)
        memory.setdefault("published_urls", []).append(canon)
        memory.setdefault("style_history", []).append(style["name"])
        memory.setdefault("published_titles", []).append(norm_title(title))
        save_memory(memory)
        return 0
    print("No suitable story")
    save_memory(memory)
    return 0

if __name__ == "__main__":
    sys.exit(main())
