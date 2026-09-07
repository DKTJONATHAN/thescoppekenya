import os, sys, json, re, time, random, hashlib, base64, itertools, datetime, urllib.parse
import requests
from dateutil import parser as date_parser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from google import genai
from google.genai import types

AUTHOR_NAME    = "Martin Kihara"
AUTHOR_SLUG    = "martin-kihara"
CATEGORY       = "Showbiz"
SITE_BASE_URL  = "https://zandani.co.ke"
SOURCE_URL     = "https://www.mpasho.co.ke/"
SOURCE_DOMAIN  = "mpasho.co.ke"
POSTS_DIR      = os.environ.get("POSTS_DIR", "content/posts")
MEMORY_FILE    = os.environ.get("MEMORY_FILE", ".github/memory_martin_mpasho.json")

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
    "BBC", "CNN", "Reuters", "Al Jazeera", "Mpasho", "Mpasho Kenya",
]

STYLE_PRESETS = [
    {"name": "Hard News Lead", "format": "Showbiz news report", "lead_style": "Single hard lead", "tone": "Authoritative, factual", "angle": "What actually happened", "structure": "Lead, context, reaction, forward look", "sentence_mix": "Short and medium", "closing": "Forward look"},
    {"name": "Reaction Round-up", "format": "Fan reaction round up", "lead_style": "Loudest fan reaction", "tone": "Lively, observational", "angle": "How fans are responding", "structure": "Reaction lead, recap, voices, what next", "sentence_mix": "Short paraphrased quotes", "closing": "Mood line"},
    {"name": "Trend Take", "format": "Trend analysis", "lead_style": "Wider trend signal", "tone": "Confident, observational", "angle": "Why this matters in Kenyan pop culture", "structure": "Trend hook, three beats, where next", "sentence_mix": "Mix of crisp and longer", "closing": "Trend forecast"},
    {"name": "Profile Beat", "format": "Personality beat", "lead_style": "Human angle", "tone": "Warm, grounded", "angle": "Who is at the centre", "structure": "Person beat, context, outlook", "sentence_mix": "Conversational", "closing": "Forward milestone"},
    {"name": "Receipts Piece", "format": "Receipts and timeline", "lead_style": "Contradiction past vs present", "tone": "Sharp, factual", "angle": "What the public record shows", "structure": "Today, timeline beats, sum", "sentence_mix": "Punchy short lines", "closing": "Pointed observation"},
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
    if len(history) >= 2 and history[-1] == history[-2]:
        candidates = [s for s in STYLE_PRESETS if s["name"] != history[-1]] or candidates
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
            "https://api.unsplash.com/photos/random?query=" + urllib.parse.quote(query)
            + "&orientation=landscape&client_id=" + key,
            timeout=10,
        )
        if r.status_code == 200:
            return r.json()["urls"]["regular"]
    except Exception as e:
        print(f"unsplash error: {e}")
    return fallback

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
    return urls[:25]

def scrape_article(url):
    print(f"Scraping {url}")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
            )
            ctx = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
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
            if age_h > 12:
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
    for sel in ["article", ".node__content", ".field--name-body", ".article__body", ".post-content", ".entry-content", "main article", ".content"]:
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
    picks = random.sample(files, min(4, len(files)))
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
    text = re.sub(r"(Za Ndani)(?:\s+Za Ndani)+", r"\1", text)
    return text

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
        for attempt in range(5):
            try:
                resp = client.models.generate_content(model=model, contents=prompt, config=cfg)
                out = (resp.text or "").strip()
                if out:
                    print(f"Gemini OK [{model}] {label}")
                    return out
            except Exception as e:
                msg = str(e).lower()
                transient = any(x in msg for x in ["429", "quota", "rate", "503", "unavailable", "500", "overloaded", "resource_exhausted"])
                if transient:
                    time.sleep(random.uniform(15, 30))
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
    schema = '{"summary":"2-3 sentences","keywords":["kw1","kw2","kw3","kw4","kw5"],"people":["names"],"new_facts":["fact1","fact2"],"why_now":"one line"}'
    prompt = (
        "You are a Kenyan entertainment desk editor. From this Mpasho-sourced story, extract a tight brief as JSON only.\n"
        f"Schema: {schema}\nTitle: {title}\nText:\n{text[:6000]}"
    )
    return parse_json_safely(gemini_call(prompt, "brief", json_mode=True)) or {}

def stage_seo(brief, title):
    schema = '{"title":"max 70 chars","slug":"lowercase-hyphen","description":"max 155 chars","tags":["tag1","tag2","tag3","tag4"]}'
    prompt = (
        "Write SEO for a Za Ndani showbiz article as JSON only.\n"
        f"Schema: {schema}\nOriginal title: {title}\nBrief: {json.dumps(brief)}"
    )
    return parse_json_safely(gemini_call(prompt, "seo", json_mode=True)) or {
        "title": title[:70],
        "slug": re.sub(r"[^a-z0-9]+", "-", title.lower())[:60],
        "description": (brief.get("summary") or title)[:155],
        "tags": brief.get("keywords") or [],
    }

def stage_angle(brief, style, angle_history):
    recent = "; ".join(angle_history[-8:])
    schema = '{"angle_title":"short","frame":"story_progression|reaction|timeline|profile|trend","why_unique":"one line","must_include":["item1","item2"],"avoid":["FAQ","generic explainer"]}'
    prompt = (
        f"Propose a unique editorial angle as JSON only (avoid repeating recent angles: {recent}).\n"
        f"Schema: {schema}\nStyle: {style['name']}\nBrief: {json.dumps(brief)}"
    )
    return parse_json_safely(gemini_call(prompt, "angle", json_mode=True))

def stage_write(brief, seo, style, angle_plan, internal):
    prompt = (
        f"Write a complete original showbiz article in Markdown for Za Ndani (Kenya).\n"
        f"Persona: {AUTHOR_NAME}. Category: {CATEGORY}.\n"
        f"Style preset: {json.dumps(style)}\n"
        f"Angle: {json.dumps(angle_plan)}\n"
        f"SEO title: {seo.get('title')}\n"
        f"Brief facts only (do not copy source wording): {json.dumps(brief)}\n"
        f"{internal}\n"
        f"Rules:\n"
        f"- Original prose only. No copying source sentences.\n"
        f"- No banned phrases: {', '.join(BANNED_PHRASES[:12])}\n"
        f"- No source brand names (Mpasho, Nation, Standard, etc.)\n"
        f"- 450-750 words. Varied sentence length. Concrete Kenyan context.\n"
        f"- Do not start with Title/By/Author lines. Body only."
    )
    return gemini_call(prompt, "write")

def stage_review(article_md, source_text):
    schema = '{"source_similarity":0,"house_style_repetition":0,"voice_variety":10,"notes":"short"}'
    prompt = (
        f"Score this article vs source for uniqueness as JSON only.\nSchema: {schema}\n"
        f"Source excerpt:\n{source_text[:2500]}\nArticle:\n{article_md[:3500]}"
    )
    return parse_json_safely(gemini_call(prompt, "review", json_mode=True))

def stage_rewrite(article_md, review, style):
    prompt = (
        f"Rewrite for higher originality and voice variety. Keep facts. Style: {style['name']}.\n"
        f"Review notes: {json.dumps(review)}\nArticle:\n{article_md}"
    )
    return gemini_call(prompt, "rewrite")

candidates = get_target_urls()
if not candidates:
    print("No candidates")
    sys.exit(0)

chosen_text = chosen_img = chosen_title = chosen_hash = None
for url in candidates:
    h = hashlib.sha256(url.encode()).hexdigest()[:24]
    if h in memory.get("published_hashes", []):
        print(f"Already published hash {h}")
        continue
    text, img, title = scrape_article(url)
    if not text or len(text) < 400 or not title:
        continue
    th = hashlib.sha256((title + text[:400]).encode()).hexdigest()[:24]
    if th in memory.get("published_hashes", []):
        print(f"Title/text hash seen {th}")
        continue
    chosen_text, chosen_img, chosen_title, chosen_hash = text, img, title, h
    break

if not chosen_text:
    print("No fresh unique story")
    sys.exit(0)

brief = stage_brief(chosen_title, chosen_text)
seo = stage_seo(brief, chosen_title)
style = pick_style(memory.get("style_history", []))
print(f"Style chosen: {style['name']}")
angle_plan = stage_angle(brief, style, memory.get("angle_history", [])) or {
    "angle_title": "Straight story angle",
    "frame": "story_progression",
    "why_unique": "Fallback keeps the article on the actual development",
    "must_include": ["one clear new fact", "one specific reaction"],
    "avoid": ["FAQ blocks", "generic wrap-up"],
}
print(f"Angle: {angle_plan.get('frame')} | {angle_plan.get('angle_title')}")

article_md = stage_write(brief, seo, style, angle_plan, get_internal_links())
if not article_md:
    print("Write failed")
    sys.exit(1)

review = stage_review(article_md, chosen_text) or {}
sim = int(review.get("source_similarity", 0) or 0)
rep = int(review.get("house_style_repetition", 0) or 0)
voc = int(review.get("voice_variety", 10) or 10)
print(f"Review sim={sim} rep={rep} voice={voc}")
if sim >= 7 or rep >= 7 or voc <= 4:
    rewritten = stage_rewrite(article_md, review, style)
    if rewritten and len(rewritten) > 400:
        article_md = rewritten

if sim >= 8:
    alt_angle = stage_angle(brief, style, memory.get("angle_history", []) + [angle_plan.get("frame", "")]) or angle_plan
    alt_md = stage_write(brief, seo, style, alt_angle, get_internal_links())
    if alt_md and len(alt_md) > 400:
        article_md = alt_md
        angle_plan = alt_angle
        print("Applied alternate uniqueness angle")

article_md = re.sub(r"^```(?:markdown)?\n?", "", article_md).rstrip("`").rstrip().strip()
article_md = re.sub(r"^(Title|By|Author|Date)\s*:\s*.*?$", "", article_md, flags=re.I | re.M)
article_md = article_md.replace("\u2014", "-").replace("\u2013", "-")
article_md = scrub_source_leaks(article_md)

if chosen_img:
    final_image = upload_to_imgbb(chosen_img)
else:
    q = "kenya " + (brief.get("keywords") or [CATEGORY.lower()])[0]
    final_image = get_unsplash_image(q)

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
angle_signature = f"{angle_plan.get('frame', 'unknown')}|{(brief.get('keywords') or ['na'])[0]}|{style['name']}"
memory.setdefault("angle_history", []).append(angle_signature)
save_memory(memory)
print("Memory updated")
