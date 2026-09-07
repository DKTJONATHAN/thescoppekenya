import os, sys, json, re, time, random, hashlib, base64, itertools, datetime, urllib.parse
import requests
from dateutil import parser as date_parser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from google import genai
from google.genai import types

AUTHOR_NAME    = "Mutheu Ann"
AUTHOR_SLUG    = "mutheu-ann"
CATEGORY       = "Entertainment"
SITE_BASE_URL  = "https://zandani.co.ke"
SOURCE_URL     = "https://www.pulselive.co.ke/articles/entertainment"
SOURCE_DOMAIN  = "pulselive.co.ke"
POSTS_DIR      = os.environ.get("POSTS_DIR", "content/posts")
MEMORY_FILE    = os.environ.get("MEMORY_FILE", ".github/memory_mutheu.json")

MODELS_TO_TRY = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

UNSPLASH_FALLBACKS = [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200",
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
    "BBC", "CNN", "Reuters", "Al Jazeera", "Entertainment Weekly", "EW.com",
]

STYLE_PRESETS = [
    {"name": "Hard News Lead", "format": "Celebrity news report", "lead_style": "Single hard lead", "tone": "Authoritative, factual", "angle": "What actually happened", "structure": "Lead, context, reaction, forward look", "sentence_mix": "Short and medium", "closing": "Forward look"},
    {"name": "Reaction Round-up", "format": "Fan reaction round up", "lead_style": "Loudest fan reaction", "tone": "Lively, observational", "angle": "How fans are responding", "structure": "Reaction lead, recap, voices", "sentence_mix": "Short paraphrased quotes", "closing": "Mood line"},
    {"name": "Trend Take", "format": "Trend analysis", "lead_style": "Wider trend", "tone": "Confident", "angle": "Why this matters in Kenyan pop culture", "structure": "Trend hook, three beats", "sentence_mix": "Mix", "closing": "Forecast"},
    {"name": "Profile Beat", "format": "Personality beat", "lead_style": "Human angle", "tone": "Warm, grounded", "angle": "Who is at the centre", "structure": "Person, context, outlook", "sentence_mix": "Conversational", "closing": "Milestone"},
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

def upload_to_imgbb(image_url, referer_url=""):
    key = os.environ.get("IMGBB_API_KEY")
    if not key or not image_url:
        return image_url
    try:
        headers = {"Referer": referer_url or image_url}
        data = requests.get(image_url, timeout=15, headers=headers).content
        if data[:15].strip().lower().startswith(b"<!doctype") or data[:6].lower() == b"<html>":
            return None
        b64 = base64.b64encode(data).decode("utf-8")
        r = requests.post("https://api.imgbb.com/1/upload", data={"key": key, "image": b64}, timeout=20)
        if r.status_code == 200:
            return r.json()["data"]["url"]
    except Exception as e:
        print(f"imgbb error: {e}")
    return None

def get_unsplash_image(query):
    key = os.environ.get("UNSPLASH_ACCESS_KEY")
    if not key:
        return random.choice(UNSPLASH_FALLBACKS)
    try:
        r = requests.get(
            "https://api.unsplash.com/photos/random?query=" + urllib.parse.quote(query)
            + "&orientation=landscape&client_id=" + key, timeout=10)
        if r.status_code == 200:
            return r.json()["urls"]["regular"]
    except Exception as e:
        print(f"unsplash error: {e}")
    return random.choice(UNSPLASH_FALLBACKS)

def get_target_urls():
    urls = []
    print(f"Scanning {SOURCE_URL}")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
            ctx = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            page = ctx.new_page()
            page.goto(SOURCE_URL, timeout=90000, wait_until="domcontentloaded")
            page.wait_for_timeout(3500)
            for _ in range(3):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(2000)
            soup = BeautifulSoup(page.content(), "html.parser")
            base = SOURCE_URL.split("/")[0] + "//" + SOURCE_URL.split("/")[2]
            for a in soup.select("a[href]"):
                href = a.get("href", "")
                if not href or href.startswith("#"):
                    continue
                if href.startswith("/"):
                    href = base + href
                if not href.startswith("http") or SOURCE_DOMAIN not in href:
                    continue
                if any(x in href for x in ["?page=", "/category/", "/tag/", "/author/"]):
                    continue
                if len(href) < 40:
                    continue
                if href not in urls:
                    urls.append(href)
            browser.close()
    except Exception as e:
        print(f"List scrape error: {e}")
    print(f"Found {len(urls)} candidates")
    return urls[:25]

def scrape_article(url):
    print(f"Scraping {url}")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
            ctx = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            page = ctx.new_page()
            page.goto(url, timeout=60000, wait_until="domcontentloaded")
            page.wait_for_timeout(4000)
            soup = BeautifulSoup(page.content(), "html.parser")
            browser.close()
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
            if age_h > 12:
                print(f"Skipping age {age_h:.1f}h")
                return None, None, None
        except Exception:
            pass

    t = soup.find("title")
    title = t.get_text(strip=True) if t else ""
    for sep in [" | ", " - "]:
        if sep in title:
            title = title.split(sep)[0].strip()

    text = ""
    for sel in ["article", ".post-content", ".entry-content", "main article", ".content"]:
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

def scrub_source_leaks(text):
    if not text:
        return text
    text = re.sub(r"https?://[^\s)\"']*" + re.escape(SOURCE_DOMAIN) + r"[^\s)\"']*", SITE_BASE_URL, text)
    for brand in BRANDS_TO_SCRUB:
        text = re.sub(re.escape(brand), "Za Ndani", text, flags=re.IGNORECASE)
    return text

raw_keys = [os.environ.get(k) for k in ("GEMINI_WRITE_KEY", "GEMINI_API_KEY", "GEMINI_API_KEY1") if os.environ.get(k)]
if not raw_keys:
    print("No Gemini keys"); sys.exit(1)
key_cycle = itertools.cycle(raw_keys)
current_key = next(key_cycle)
client = genai.Client(api_key=current_key)

def gemini_call(prompt, label="", json_mode=False):
    global current_key, client
    cfg = types.GenerateContentConfig(response_mime_type="application/json") if json_mode else None
    for model in MODELS_TO_TRY:
        for attempt in range(4):
            try:
                resp = client.models.generate_content(model=model, contents=prompt, config=cfg)
                out = (resp.text or "").strip()
                if out:
                    print(f"Gemini OK [{model}] {label}")
                    return out
            except Exception as e:
                msg = str(e).lower()
                if any(x in msg for x in ["429", "quota", "rate", "503", "overloaded"]):
                    time.sleep(random.uniform(12, 25))
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

def stage_brief(title, text):
    schema = '{"summary":"2-3 sentences","keywords":["kw1","kw2","kw3"],"people":["names"],"new_facts":["fact1"]}'
    prompt = f"Extract a tight Kenya entertainment brief as JSON only.\nSchema: {schema}\nTitle: {title}\nText:\n{text[:6000]}"
    return parse_json_safely(gemini_call(prompt, "brief", json_mode=True)) or {}

def stage_seo(brief, title):
    schema = '{"title":"max 70 chars","slug":"lowercase-hyphen","description":"max 155 chars","tags":["t1","t2","t3"]}'
    prompt = f"SEO for Za Ndani entertainment as JSON only.\nSchema: {schema}\nTitle: {title}\nBrief: {json.dumps(brief)}"
    return parse_json_safely(gemini_call(prompt, "seo", json_mode=True)) or {
        "title": title[:70], "slug": re.sub(r"[^a-z0-9]+", "-", title.lower())[:60],
        "description": (brief.get("summary") or title)[:155], "tags": brief.get("keywords") or [],
    }

def stage_write(brief, seo, style):
    prompt = (
        f"Write original entertainment article in Markdown for Za Ndani (Kenya).\n"
        f"Persona: {AUTHOR_NAME}. Category: {CATEGORY}. Style: {json.dumps(style)}.\n"
        f"SEO title: {seo.get('title')}. Facts only: {json.dumps(brief)}.\n"
        f"Rules: original prose, no source brands, 450-750 words, no Title/By lines."
    )
    return gemini_call(prompt, "write")

candidates = get_target_urls()
if not candidates:
    print("No candidates"); sys.exit(0)

chosen_text = chosen_img = chosen_title = chosen_hash = None
for url in candidates:
    h = hashlib.sha256(url.encode()).hexdigest()[:24]
    if h in memory.get("published_hashes", []):
        continue
    text, img, title = scrape_article(url)
    if not text or len(text) < 400 or not title:
        continue
    th = hashlib.sha256((title + text[:400]).encode()).hexdigest()[:24]
    if th in memory.get("published_hashes", []):
        continue
    chosen_text, chosen_img, chosen_title, chosen_hash = text, img, title, h
    break

if not chosen_text:
    print("No fresh unique story"); sys.exit(0)

brief = stage_brief(chosen_title, chosen_text)
seo = stage_seo(brief, chosen_title)
style = pick_style(memory.get("style_history", []))
article_md = stage_write(brief, seo, style)
if not article_md:
    print("Write failed"); sys.exit(1)

article_md = re.sub(r"^```(?:markdown)?\n?", "", article_md).rstrip("`").strip()
article_md = scrub_source_leaks(article_md)
final_image = upload_to_imgbb(chosen_img) if chosen_img else get_unsplash_image("kenya entertainment")
if not final_image:
    final_image = get_unsplash_image("kenya entertainment")

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
    f"tags: {tags_yaml}\n"
    f'date: "{publish_ts}"\n'
    f'dateModified: "{publish_ts}"\n'
    f'schema: "NewsArticle"\n'
    "---\n\n"
)
filepath = os.path.join(POSTS_DIR, f"{today_str}-{slug}.md")
with open(filepath, "w", encoding="utf-8") as f:
    f.write(frontmatter + article_md.strip() + "\n")
print(f"Saved {filepath}")

memory.setdefault("published_hashes", []).append(chosen_hash)
memory.setdefault("style_history", []).append(style["name"])
save_memory(memory)
print("Memory updated")
