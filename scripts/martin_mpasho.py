#!/usr/bin/env python3
"""Martin Kihara — straight showbiz reporter (Mpasho). No commentary."""
import os, sys, json, re, time, random, hashlib, base64, itertools, datetime, urllib.parse
import requests
from dateutil import parser as date_parser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from google import genai
from google.genai import types

try:
    from voice_guard import news_prompt, should_skip_story, strip_banned, inject_know_if_missing, seo_fields, polish_body, model_skipped
except ImportError:
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from voice_guard import news_prompt, should_skip_story, strip_banned, inject_know_if_missing, seo_fields, polish_body, model_skipped


AUTHOR_NAME = "Martin Kihara"
AUTHOR_SLUG = "martin-kihara"
CATEGORY = "Showbiz"
SITE_BASE_URL = "https://zandani.co.ke"
SOURCE_URL = "https://www.mpasho.co.ke/"
SOURCE_DOMAIN = "mpasho.co.ke"
POSTS_DIR = os.environ.get("POSTS_DIR", "content/posts")
MEMORY_FILE = os.environ.get("MEMORY_FILE", ".github/memory_martin_mpasho.json")
MAX_CANDIDATES = 25
MAX_SCRAPE_TRIES = 10
FRESH_HOURS = 12

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
    "fans are divided", "the internet is buzzing", "social media went into a frenzy",
]

STYLE_PRESETS = [
    {
        "name": "Hard Showbiz Lead",
        "lead_style": "Who did what, where, when.",
        "tone": "Neutral wire-service. No opinion.",
        "structure": "Lead, facts by importance, quotes, status",
    },
    {
        "name": "Event Report",
        "lead_style": "Open with the event and principal actor.",
        "tone": "Factual, clipped.",
        "structure": "Lead, sequence, confirmation, numbers",
    },
    {
        "name": "Statement Report",
        "lead_style": "Official action or public statement first.",
        "tone": "Neutral, attribution-heavy.",
        "structure": "Lead, quote/order, background, response",
    },
]

BRANDS_TO_SCRUB = [
    "Kenyans.co.ke", "Daily Nation", "Nation.Africa", "The Standard", "Standard Media",
    "Citizen Digital", "Tuko", "Pulse Live", "Capital FM", "K24", "NTV Kenya", "KTN News",
    "BBC", "CNN", "Reuters", "Al Jazeera", "Mpasho", "Mpasho Kenya", "Mpasho.co.ke",
]

# Reject site chrome / brand assets masquerading as article photos
LOGO_URL_RE = re.compile(
    r"logo|favicon|icon|sprite|brand|header[-_]?img|site[-_]?mark|"
    r"mpasho[-_]?logo|wordmark|badge|avatar|placeholder|default[-_]?image|"
    r"wp-content/uploads/.*/logo|/logos?/|/icons?/",
    re.I,
)

now_utc = datetime.datetime.utcnow()
now_eat = now_utc + datetime.timedelta(hours=3)
publish_ts = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
today_str = now_eat.strftime("%Y-%m-%d")
full_date_str = now_eat.strftime("%A, %B %d, %Y")


def load_memory():
    empty = {"published_hashes": [], "style_history": []}
    if not os.path.exists(MEMORY_FILE):
        return empty
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if isinstance(raw, list):
            empty["published_hashes"] = raw[-500:]
            return empty
        if isinstance(raw, dict):
            raw.setdefault("published_hashes", [])
            raw.setdefault("style_history", [])
            raw["style_history"] = [
                (h.get("stylePreset") or h.get("name") or "") if isinstance(h, dict) else str(h)
                for h in raw["style_history"]
            ]
            raw["style_history"] = [h for h in raw["style_history"] if h]
            return raw
    except Exception as e:
        print(f"Memory load error: {e}")
    return empty


def save_memory(mem):
    os.makedirs(os.path.dirname(MEMORY_FILE) or ".", exist_ok=True)
    mem["published_hashes"] = mem.get("published_hashes", [])[-500:]
    mem["style_history"] = mem.get("style_history", [])[-30:]
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
        data = requests.get(image_url, timeout=15).content
        b64 = base64.b64encode(data).decode("utf-8")
        r = requests.post("https://api.imgbb.com/1/upload", data={"key": key, "image": b64}, timeout=20)
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
            "https://api.unsplash.com/photos/random?query="
            + urllib.parse.quote(query)
            + "&orientation=landscape&client_id="
            + key,
            timeout=10,
        )
        if r.status_code == 200:
            return r.json()["urls"]["regular"]
    except Exception as e:
        print(f"unsplash error: {e}")
    return fallback


def _abs_url(src, page_url):
    if not src:
        return ""
    src = src.strip()
    if src.startswith("//"):
        return "https:" + src
    if src.startswith("http"):
        return src
    if src.startswith("/"):
        base = page_url.split("/")[0] + "//" + page_url.split("/")[2]
        return base + src
    return urllib.parse.urljoin(page_url, src)


def _is_logo_url(url):
    if not url:
        return True
    if LOGO_URL_RE.search(url):
        return True
    # Tiny / tracking / data URIs are never article photos
    if url.startswith("data:"):
        return True
    low = url.lower()
    if any(ext in low for ext in (".svg", ".ico", ".gif")) and "logo" in low:
        return True
    return False


def pick_article_image(soup, page_url):
    """
    Use the FIRST image that appears in the story body on the original page.
    Do NOT prefer OG/Twitter meta images. Skip logos, icons, and tiny assets.
    """
    # Prefer the main article/content container so we get story images, not site chrome
    containers = []
    for sel in [
        "article .entry-content",
        "article .post-content",
        "article .article-body",
        "article .node__content",
        ".entry-content",
        ".post-content",
        ".article-body",
        "article",
        "main",
    ]:
        c = soup.select_one(sel)
        if c and c not in containers:
            containers.append(c)
    if not containers:
        containers = [soup]

    def extract_src(img):
        src = (
            img.get("data-src")
            or img.get("data-lazy-src")
            or img.get("data-original")
            or img.get("src")
            or ""
        )
        # Prefer largest from srcset when present
        srcset = img.get("srcset") or img.get("data-srcset") or ""
        if srcset:
            parts = [p.strip().split()[0] for p in srcset.split(",") if p.strip()]
            if parts:
                src = parts[-1]
        return src.strip()

    for container in containers:
        for img in container.find_all("img"):
            src = extract_src(img)
            abs_u = _abs_url(src, page_url)
            if not abs_u:
                continue
            if _is_logo_url(abs_u):
                continue
            # Skip obvious non-story assets
            low = abs_u.lower()
            if any(x in low for x in (".svg", ".ico", "sprite", "icon-", "logo", "avatar", "placeholder", "default-image")):
                continue
            # Skip tiny dimension hints in URL
            m = re.search(r"[-_](\d{2,4})x(\d{2,4})", low)
            if m:
                w, h = int(m.group(1)), int(m.group(2))
                if w < 200 or h < 150:
                    continue
            print(f"First story image: {abs_u[:140]}")
            return abs_u

    print("No usable first story image found")
    return ""


def get_target_urls():
    urls = []
    print(f"Scanning {SOURCE_URL}")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
            )
            ctx = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                viewport={"width": 1920, "height": 1080},
            )
            page = ctx.new_page()
            page.goto(SOURCE_URL, timeout=90000, wait_until="domcontentloaded")
            page.wait_for_timeout(3500)
            for _ in range(3):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(2500)
            soup = BeautifulSoup(page.content(), "html.parser")
            base = SOURCE_URL.split("/")[0] + "//" + SOURCE_URL.split("/")[2]
            for a in soup.select("a[href]"):
                href = a.get("href", "")
                if not href or href.startswith("#"):
                    continue
                if href.startswith("/"):
                    href = base + href
                if not href.startswith("http"):
                    continue
                if SOURCE_DOMAIN not in href:
                    continue
                if any(x in href for x in ["#", "?page=", "/category/", "/tag/", "/author/", "/about", "/contact"]):
                    continue
                if len(href) < 40:
                    continue
                if href not in urls:
                    urls.append(href)
            browser.close()
    except Exception as e:
        print(f"List scrape error: {e}")
    print(f"Found {len(urls)} candidate links")
    return urls[:MAX_CANDIDATES]


def scrape_article(url):
    print(f"Scraping {url}")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
            )
            ctx = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = ctx.new_page()
            page.goto(url, timeout=60000, wait_until="domcontentloaded")
            page.wait_for_timeout(3500)
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
    title = re.sub(r"\s*[-|]\s*Mpasho.*", "", title, flags=re.I).strip()

    text = ""
    for sel in [
        "article",
        ".node__content",
        ".field--name-body",
        ".article__body",
        ".post-content",
        ".entry-content",
        "main article",
        ".content",
    ]:
        c = soup.select_one(sel)
        if c:
            text = "\n\n".join(
                p.get_text(" ", strip=True)
                for p in c.find_all("p")
                if len(p.get_text(strip=True)) > 30
            )
            if len(text) > 500:
                break
    if len(text) < 500:
        text = "\n\n".join(
            p.get_text(" ", strip=True)
            for p in soup.find_all("p")
            if len(p.get_text(strip=True)) > 30
        )

    img = pick_article_image(soup, url)
    return text, img, title


def scrub_source_leaks(text):
    if not text:
        return text
    text = re.sub(
        r"https?://[^\s)\"']*" + re.escape(SOURCE_DOMAIN) + r"[^\s)\"']*",
        SITE_BASE_URL,
        text,
    )
    for brand in BRANDS_TO_SCRUB:
        text = re.sub(re.escape(brand), "Za Ndani", text, flags=re.IGNORECASE)
    text = re.sub(r"(Za Ndani)(?:\s+Za Ndani)+", r"\1", text)
    return text


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
        "the internet is buzzing",
        "social media went into a frenzy",
    ]
    if any(m in low for m in markers):
        return True
    if re.search(r"##\s*analysis\b", text, re.I):
        return True
    if len(re.findall(r"\w+", text)) < 250:
        return True
    return False


raw_keys = [
    os.environ.get(k)
    for k in ("GEMINI_WRITE_KEY", "GEMINI_API_KEY", "GEMINI_API_KEY1")
    if os.environ.get(k)
]
if not raw_keys:
    print("No Gemini keys configured")
    sys.exit(1)
key_cycle = itertools.cycle(raw_keys)
current_key = next(key_cycle)
client = genai.Client(api_key=current_key)


def gemini_call(prompt, label=""):
    global current_key, client
    for model in MODELS_TO_TRY:
        for attempt in range(5):
            try:
                resp = client.models.generate_content(model=model, contents=prompt)
                out = (resp.text or "").strip()
                if out:
                    print(f"Gemini OK [{model}] {label}")
                    return out
            except Exception as e:
                msg = str(e).lower()
                transient = any(
                    x in msg
                    for x in [
                        "429",
                        "quota",
                        "rate",
                        "503",
                        "unavailable",
                        "500",
                        "overloaded",
                        "resource_exhausted",
                    ]
                )
                if transient:
                    time.sleep(random.uniform(15, 30))
                    current_key = next(key_cycle)
                    client = genai.Client(api_key=current_key)
                    continue
                print(f"Gemini error [{model}] {label}: {e}")
                break
    return None


def stage_write(raw_title, raw_text, style):
    if should_skip_story((raw_title or "") + " " + (raw_text or ""), CATEGORY):
        print("Skip (not Kenya-first): " + (raw_title or "")[:80])
        return None
    prompt = news_prompt(AUTHOR_NAME, full_date_str, style, raw_title, raw_text, role="correspondent", desk=CATEGORY)
    out = gemini_call(prompt, "write")
    if model_skipped(out):
        print("Model skipped foreign story")
        return None
    return polish_body(out or "")


def generate_suitable_title(scraped_title, article_body, source_snippet):
    """
    Ask Gemini for a complete, suitable headline.
    Return the exact generated title with NO truncation/chopping.
    """
    prompt = (
        "You are a Kenyan entertainment / showbiz headline writer for Za Ndani.\n"
        "SCRAPED SOURCE TITLE: " + (scraped_title or "") + "\n"
        "SOURCE SNIPPET:\n" + (source_snippet or "")[:1400] + "\n"
        "ARTICLE BODY (for context):\n" + (article_body or "")[:1800] + "\n\n"
        "TASK: Generate ONE complete, suitable, high-quality headline for this story.\n"
        "RULES:\n"
        "- The title MUST be a full, natural, complete headline (not a fragment).\n"
        "- Capture the main news angle clearly. Prefer concrete names, places, and the key fact.\n"
        "- Kenyan showbiz tone: sharp, readable, SEO-friendly but never clickbait or hype.\n"
        "- Do NOT copy the scraped title verbatim unless it is already perfect and complete.\n"
        "- Do NOT end with ellipsis (...), a dash, or a cut-off phrase.\n"
        "- Do NOT add site names (Mpasho, Za Ndani, etc.).\n"
        "- Output ONLY the title text. No quotes, no JSON, no explanation, no trailing punctuation beyond normal headline style.\n"
    )
    result = gemini_call(prompt, "title")
    if not result:
        return (scraped_title or "").strip()
    # Clean only formatting wrappers — never chop length
    clean = result.strip()
    clean = re.sub(r"^```(?:json|text)?\s*", "", clean)
    clean = re.sub(r"\s*```$", "", clean)
    clean = re.sub(r'^["\'`]+|["\'`]+$', "", clean).strip()
    clean = re.sub(r"\s+", " ", clean)
    # Remove accidental prefixes the model sometimes adds
    clean = re.sub(r"^(Title|Headline|Final title)\s*[:\-–—]\s*", "", clean, flags=re.I).strip()
    if len(clean) < 12:
        return (scraped_title or "").strip()
    print(f"Generated full title ({len(clean)} chars): {clean}")
    return clean


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:80]


def main():
    memory = load_memory()
    style = pick_style(memory.get("style_history", []))
    print(f"[{AUTHOR_NAME}] hard-news run @ {publish_ts} style={style['name']}")

    candidates = get_target_urls()
    if not candidates:
        print("No candidates")
        save_memory(memory)
        return 0

    seen = set(memory.get("published_hashes", []))
    tries = 0
    for url in candidates:
        if tries >= MAX_SCRAPE_TRIES:
            break
        h = hashlib.sha256(url.encode()).hexdigest()[:24]
        if h in seen:
            print(f"Already published hash {h}")
            continue
        tries += 1
        text, img, title = scrape_article(url)
        if not text or len(text) < 400 or not title:
            continue
        th = hashlib.sha256((title + text[:400]).encode()).hexdigest()[:24]
        if th in seen:
            print(f"Title/text hash seen {th}")
            continue

        article = stage_write(title, text, style)
        if not article:
            print("Write failed")
            continue
        article = polish_body(scrub_source_leaks(article))
        if is_spam(article):
            print("Rejected spam or empty")
            continue

        # Strip any accidental H1 the model may have emitted
        if article.startswith("#"):
            article = article.split("\n", 1)[-1].strip()

        # Generate a complete, suitable title via Gemini and use it EXACTLY (no chopping)
        out_title = generate_suitable_title(title, article, text)
        # Final safety: never leave a truncated-looking title
        out_title = re.sub(r"\s*[|:\-–—…]+\s*$", "", out_title).strip()
        if not out_title:
            out_title = title

        # Use the FIRST image that appears in the story body (already selected by pick_article_image)
        if img and not _is_logo_url(img):
            final_image = upload_to_imgbb(img)
        else:
            print("No usable article image — Unsplash fallback")
            final_image = get_unsplash_image("kenya celebrity showbiz")

        # Still use seo_fields for description/excerpt/county, but OVERRIDE the title
        # so the 65-char chop inside seo_fields is never applied to the published title.
        seo = seo_fields(out_title, article, CATEGORY, AUTHOR_NAME)
        final_title = out_title  # exact Gemini title — do not use seo["title"]
        slug = f"{today_str}-{slugify(final_title)}"
        # Escape quotes for YAML safety
        safe_title = final_title.replace('"', '\\"')
        frontmatter = (
            "---\n"
            f'title: "{safe_title}"\n'
            f'slug: "{slugify(final_title)}"\n'
            f'description: "{seo["description"]}"\n'
            f'excerpt: "{seo["excerpt"]}"\n'
            f'author: "{AUTHOR_NAME}"\n'
            f'authorUrl: "{SITE_BASE_URL}/author/{AUTHOR_SLUG}"\n'
            f'image: "{final_image}"\n'
            f'category: "{CATEGORY}"\n'
            f'county: "{seo["county"]}"\n'
            f'tags: ["showbiz", "entertainment", "kenya"]\n'
            f'date: "{publish_ts}"\n'
            f'dateModified: "{publish_ts}"\n'
            f'schema: "NewsArticle"\n'
            f'stylePreset: "{style["name"]}"\n'
            "---\n\n"
        )
        os.makedirs(POSTS_DIR, exist_ok=True)
        filepath = os.path.join(POSTS_DIR, f"{slug}.md")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(frontmatter + article.strip() + "\n")
        print(f"Saved {filepath}")

        memory.setdefault("published_hashes", []).append(h)
        memory.setdefault("published_hashes", []).append(th)
        memory.setdefault("style_history", []).append(style["name"])
        save_memory(memory)
        print("Memory updated")
        return 0

    print("No fresh unique story")
    save_memory(memory)
    return 0


if __name__ == "__main__":
    sys.exit(main())
