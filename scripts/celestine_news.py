#!/usr/bin/env python3
import os, sys, json, re, time, random, hashlib, base64, itertools, datetime, urllib.parse
import requests
from dateutil import parser as date_parser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from google import genai
from google.genai import types

AUTHOR_NAME = "Celestine Nzioka"
AUTHOR_SLUG = "celestine-nzioka"
CATEGORY = "News"
SITE_BASE_URL = "https://zandani.co.ke"
SOURCE_URL = "https://www.kenyans.co.ke/news"
SOURCE_DOMAIN = "kenyans.co.ke"
POSTS_DIR = os.environ.get("POSTS_DIR", "content/posts")
MEMORY_FILE = os.environ.get("MEMORY_FILE", ".github/memory_celestine_news.json")
MAX_CANDIDATES = 12
MAX_SCRAPE_TRIES = 5
FRESH_HOURS = 18

MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
]

BANNED_PHRASES = [
    "sasa basi", "melting the pot", "spill the tea", "dive in", "delve into",
    "moreover", "furthermore", "in conclusion", "it's worth noting",
    "a testament to", "navigating the landscape", "in today's digital age",
    "tapestry", "game-changer", "stay tuned", "unpack", "breaking news",
]

BRANDS_TO_SCRUB = [
    "Kenyans.co.ke", "kenyans.co.ke", "BBC", "CNN", "Reuters", "Al Jazeera",
    "Daily Nation", "Nation.Africa", "Standard Media", "The Standard",
    "Citizen Digital", "Tuko", "Pulse Live", "Capital FM", "K24", "NTV Kenya", "KTN News",
]

STYLE_PRESETS = [
    {"name": "Hard News Lead", "format": "Inverted pyramid news report",
     "lead_style": "Single-sentence hard lead naming the actor, action, place and impact.",
     "tone": "Authoritative, neutral, declarative", "angle": "What happened and who is affected first",
     "structure": "Lead, then 3 short context paragraphs, then 2 reaction paragraphs, then a forward-look closer",
     "sentence_mix": "Mostly short and medium", "closing": "Forward-looking sentence on what to watch next"},
    {"name": "Explainer", "format": "Question-driven explainer",
     "lead_style": "Frame the news with the central question readers are asking",
     "tone": "Calm, instructive, plain-spoken", "angle": "Why this matters to ordinary Kenyans",
     "structure": "Hook, then H3 sub-questions, then implications",
     "sentence_mix": "Conversational rhythm", "closing": "One-line takeaway"},
]

now_utc = datetime.datetime.utcnow()
now_eat = now_utc + datetime.timedelta(hours=3)
publish_ts = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
today_str = now_eat.strftime("%Y-%m-%d")
full_date_str = now_eat.strftime("%A, %B %d, %Y")


def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return {"published_hashes": [], "style_history": [], "angle_history": []}
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if isinstance(raw, list):
            return {"published_hashes": raw[-500:], "style_history": [], "angle_history": []}
        raw.setdefault("published_hashes", [])
        raw.setdefault("style_history", [])
        raw.setdefault("angle_history", [])
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


def pick_style(history):
    recent = set(list(history)[-2:])
    candidates = [s for s in STYLE_PRESETS if s["name"] not in recent] or STYLE_PRESETS
    return random.choice(candidates)


def upload_to_imgbb(image_url):
    key = os.environ.get("IMGBB_API_KEY")
    if not key or not image_url:
        return image_url
    try:
        data = requests.get(image_url, timeout=12).content
        b64 = base64.b64encode(data).decode("utf-8")
        r = requests.post("https://api.imgbb.com/1/upload", data={"key": key, "image": b64}, timeout=15)
        if r.status_code == 200:
            return r.json()["data"]["url"]
    except Exception as e:
        print(f"imgbb error: {e}")
    return image_url


def get_unsplash_image(query):
    key = os.environ.get("UNSPLASH_ACCESS_KEY")
    fallback = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200"
    if not key:
        return fallback
    try:
        r = requests.get(
            f"https://api.unsplash.com/photos/random?query={urllib.parse.quote(query)}&orientation=landscape&client_id={key}",
            timeout=8,
        )
        if r.status_code == 200:
            return r.json()["urls"]["regular"]
    except Exception as e:
        print(f"unsplash error: {e}")
    return fallback


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
    print(f"Scanning {SOURCE_URL}")
    try:
        soup = browser_page(SOURCE_URL, 2000)
        for a in soup.select("a[href]"):
            href = a.get("href", "")
            if "/news/" not in href:
                continue
            if any(x in href for x in ["#", "?page=", "/category/", "/tag/"]):
                continue
            full = href if href.startswith("http") else "https://www.kenyans.co.ke" + href
            if full not in urls:
                urls.append(full)
    except Exception as e:
        print(f"List scrape error: {e}")
    print(f"Found {len(urls)} candidate links")
    return urls[:MAX_CANDIDATES]


def scrape_article(url):
    print(f"Scraping {url}")
    try:
        soup = browser_page(url, 1600)
    except Exception as e:
        print(f"Scrape failed: {e}")
        return None, None, None

    meta_pub = soup.find("meta", property="article:published_time")
    if meta_pub and meta_pub.get("content"):
        try:
            pt = date_parser.parse(meta_pub["content"])
            if pt.tzinfo is None:
                pt = pt.replace(tzinfo=datetime.timezone.utc)
            age_h = (datetime.datetime.now(datetime.timezone.utc) - pt).total_seconds() / 3600
            if age_h > FRESH_HOURS:
                print(f"Skipping, age {age_h:.1f}h")
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
            if img:
                break
    return text, img, title


def get_internal_links():
    if not os.path.isdir(POSTS_DIR):
        return ""
    files = [f for f in os.listdir(POSTS_DIR) if f.endswith(".md")]
    if not files:
        return ""
    picks = random.sample(files, min(3, len(files)))
    out = "RECENT INTERNAL LINKS (weave 1-2 naturally):\n"
    for f in picks:
        try:
            with open(os.path.join(POSTS_DIR, f), "r", encoding="utf-8") as h:
                c = h.read()
            m = re.search(r'title:\s*"(.*?)"', c)
            ttl = m.group(1) if m else f.replace(".md", "")
            slg = re.search(r'slug:\s*"(.*?)"', c)
            sl = slg.group(1) if slg else f.replace(".md", "")
            out += f"- [{ttl}]({SITE_BASE_URL}/article/{sl})\n"
        except Exception:
            continue
    return out


def scrub_source_leaks(text):
    if not text:
        return text
    text = re.sub(r"https?://[^\s)\"']*" + re.escape(SOURCE_DOMAIN) + r"[^\s)\"']*", SITE_BASE_URL, text)
    for brand in BRANDS_TO_SCRUB:
        text = re.sub(re.escape(brand), "Za Ndani", text, flags=re.IGNORECASE)
    return re.sub(r"(Za Ndani)(?:\s+Za Ndani)+", r"\1", text)


LEGACY_BOILERPLATE = [
    "what this means for kenyans", "key facts", "search-ready summary", "faq",
    "what is the most important takeaway", "the key takeaway is",
]


def strip_article_boilerplate(text):
    if not text:
        return text
    blocks = re.split(r"\n\s*\n+", text.strip())
    cleaned, seen = [], set()
    for block in blocks:
        normalized = re.sub(r"\s+", " ", re.sub(r"[*_`~:#()\[\]{}<>-]", " ", block.lower())).strip()
        if not normalized or any(p in normalized for p in LEGACY_BOILERPLATE) or normalized in seen:
            continue
        seen.add(normalized)
        cleaned.append(block.strip())
    return "\n\n".join(cleaned).strip()


raw_keys = [os.environ.get(k) for k in ("GEMINI_WRITE_KEY", "GEMINI_API_KEY", "GEMINI_API_KEY1") if os.environ.get(k)]
if not raw_keys:
    print("No Gemini keys configured")
    sys.exit(1)
key_cycle = itertools.cycle(raw_keys)
current_key = next(key_cycle)
client = genai.Client(api_key=current_key)


def gemini_call(prompt, label="", json_mode=False):
    global current_key, client
    cfg = types.GenerateContentConfig(response_mime_type="application/json") if json_mode else None
    for model in MODELS_TO_TRY:
        for attempt in range(3):
            try:
                resp = client.models.generate_content(model=model, contents=prompt, config=cfg)
                out = (resp.text or "").strip()
                if out:
                    print(f"Gemini OK [{model}] {label}")
                    return out
            except Exception as e:
                msg = str(e).lower()
                if any(x in msg for x in ["429", "quota", "rate", "503", "unavailable", "500", "overloaded"]):
                    time.sleep(8)
                    current_key = next(key_cycle)
                    client = genai.Client(api_key=current_key)
                    continue
                print(f"Gemini error [{model}] {label}: {e}")
                break
    return None


def parse_json_safely(txt):
    if not txt:
        return None
    clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", txt.strip(), flags=re.I | re.DOTALL).strip()
    try:
        return json.loads(clean)
    except Exception:
        m = re.search(r"\{[\s\S]*\}", clean)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                return None
    return None


def stage_brief(raw_title, raw_text):
    prompt = (
        "Produce a STRICTLY FACTUAL JSON BRIEF from this Kenyan news article. "
        "Do not copy sentences. Names/dates/numbers exact.\n"
        f"SOURCE TITLE: {raw_title}\nSOURCE TEXT:\n{raw_text[:7000]}\n"
        'Return JSON: {"summary":"...","main_events":["..."],"key_people":["..."],"key_places":["..."],"key_numbers":["..."],"keywords":["..."],"angle":"..."}'
    )
    return parse_json_safely(gemini_call(prompt, "brief", json_mode=True))


def stage_seo(brief):
    prompt = (
        "SEO metadata for Za Ndani. STRICT JSON.\n"
        f"BRIEF:\n{json.dumps(brief, ensure_ascii=False)}\n"
        "title under 65 chars, description 120-155 chars, slug hyphenated max 70, tags 4-7.\n"
        'Return JSON: {"title":"...","description":"...","slug":"...","tags":["..."]}'
    )
    return parse_json_safely(gemini_call(prompt, "seo", json_mode=True))


def stage_write(brief, seo, style, internal_links):
    prompt = (
        f"You are {AUTHOR_NAME}, Kenyan news journalist for Za Ndani. Today is {full_date_str} EAT.\n"
        f"STYLE: {style['name']} / {style['tone']} / {style['structure']}\n"
        f"TITLE: {seo.get('title','')}\nBRIEF:\n{json.dumps(brief, ensure_ascii=False)}\n{internal_links}\n"
        "Write 550-750 words of Markdown. H2 hook, standfirst, 2-3 H3s. No HTML, no byline, no em-dashes, "
        "no source brand names, no FAQ or 'what this means for Kenyans'. "
        f"Banned: {', '.join(BANNED_PHRASES)}."
    )
    return gemini_call(prompt, "write")


def main():
    memory = load_memory()
    links = get_target_urls()
    if not links:
        print("No links found")
        return 0

    published_hashes = set(memory.get("published_hashes", []))
    chosen_text = chosen_img = chosen_ttl = chosen_hash = None
    tries = 0
    for link in links:
        if tries >= MAX_SCRAPE_TRIES:
            break
        h = hashlib.md5(link.encode()).hexdigest()
        if h in published_hashes:
            continue
        tries += 1
        text, img, ttl = scrape_article(link)
        if text and len(text) > 500:
            chosen_text, chosen_img, chosen_ttl, chosen_hash = text, img, ttl or "Latest News", h
            break

    if not chosen_text:
        print("Nothing usable to write")
        return 0

    brief = stage_brief(chosen_ttl, chosen_text)
    if not brief or not brief.get("summary"):
        print("Brief failed")
        return 1
    seo = stage_seo(brief)
    if not seo or not seo.get("title"):
        print("SEO failed")
        return 1
    style = pick_style(memory.get("style_history", []))
    print(f"Style chosen: {style['name']}")
    article_md = stage_write(brief, seo, style, get_internal_links())
    if not article_md:
        print("Write failed")
        return 1

    article_md = re.sub(r"^```(?:markdown)?\n?", "", article_md).rstrip("`").strip()
    article_md = article_md.replace("\u2014", "-").replace("\u2013", "-")
    article_md = strip_article_boilerplate(scrub_source_leaks(article_md))

    final_image = upload_to_imgbb(chosen_img) if chosen_img else get_unsplash_image("kenya nairobi news")
    slug = (seo.get("slug") or re.sub(r"[^a-z0-9]+", "-", seo["title"].lower()).strip("-"))[:70]
    tags = seo.get("tags") or brief.get("keywords") or []
    tags_yaml = "[" + ", ".join(f'"{t}"' for t in tags[:8]) + "]"
    desc = (seo.get("description") or brief.get("summary", "")).strip().replace('"', "'")

    os.makedirs(POSTS_DIR, exist_ok=True)
    frontmatter = (
        "---\n"
        f'title: "{seo["title"].replace(chr(34), chr(39))}"\n'
        f'slug: "{slug}"\n'
        f'description: "{desc}"\n'
        f'author: "{AUTHOR_NAME}"\n'
        f'authorUrl: "{SITE_BASE_URL}/author/{AUTHOR_SLUG}"\n'
        f'image: "{final_image}"\n'
        f'category: "{CATEGORY}"\n'
        f'tags: {tags_yaml}\n'
        f'date: "{publish_ts}"\n'
        f'dateModified: "{publish_ts}"\n'
        f'schema: "NewsArticle"\n'
        "---\n\n"
    )
    path = os.path.join(POSTS_DIR, f"{today_str}-{slug}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(frontmatter + article_md.strip() + "\n")
    print(f"Saved {path}")
    memory.setdefault("published_hashes", []).append(chosen_hash)
    memory.setdefault("style_history", []).append(style["name"])
    save_memory(memory)
    print("Memory updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
