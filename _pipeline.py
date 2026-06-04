import os, json, datetime, requests, re, time, sys, hashlib, itertools, base64, random, io
from dateutil import parser as date_parser
from google import genai
from google.genai import types
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from PIL import Image

# -- CONFIG ---------------------------------------------------------------------
publish_timestamp = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
today_str         = datetime.datetime.utcnow().strftime('%Y-%m-%d')
full_date_str     = datetime.datetime.utcnow().strftime('%A, %B %d, %Y')
current_year      = datetime.datetime.utcnow().strftime('%Y')
SITE_BASE_URL     = 'https://zandani.co.ke'
SITE_URL          = 'https://www.mpasho.co.ke/'
SITE_DOMAIN       = 'mpasho.co.ke'
SOURCE_NAME       = 'Mpasho'
YOUR_SITE_NAME    = 'Za Ndani'
MAX_AGE_HOURS     = 10

# March 2026 Model Pipeline Update
MODELS_TO_TRY = [
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash"
]

BANNED_PHRASES = [
    'sasa basi', 'melting the pot', 'spill the tea', 'tea is hot',
    'grab your popcorn', 'buckle up', 'breaking news', 'dive in',
    'delve into', 'moreover', 'furthermore', 'in conclusion',
    "it's worth noting", 'a testament to', 'navigating the landscape',
    "in today's digital age", 'tapestry', 'shocking', 'massive',
    'jaw-dropping', 'explosive', 'you won\'t believe', 'what happened next',
    'read on', 'netizens', 'social media is buzzing'
]

BANNED_URL_PATHS = [
    '/author/', '/tag/', '/page/', '/feed/', '/comment-',
    '/category/', '/terms', '/about', '/privacy', '/contact',
    '/advertise', '/policy', '/disclaimer'
]

HYPE_TITLE_WORDS = [
    'shocking', 'massive', 'explosive', 'heartbreaking', 'urgent',
    'breaking news', 'drama', 'truth', 'full story', 'revealed',
    'exposed', 'uncovered', 'stuns', 'sparks fresh chatter'
]

GENERIC_FILLER_PATTERNS = [
    r'what this means for kenyans',
    r'key facts',
    r'faq',
    r'follow official updates',
    r'verify changes through official channels',
]

# -- STYLE PRESETS --------------------------------------------------------------
STYLE_PRESETS = {
    "reported_news": {
        "name": "reported_news",
        "format": "straight entertainment news",
        "lead_style": "one clear sentence answering who, what, where, when, and why it matters",
        "tone": "calm, specific, newsroom-clean, Kenyan reader aware",
        "angle": "lead with the verifiable development and its immediate context",
        "structure": "lede -> confirmed facts -> relevant context -> reaction only if sourced -> next known step",
        "sentence_mix": "mostly concise sentences with one context sentence per section",
        "closing": "end on the latest verified status, not a teaser"
    },
    "context_brief": {
        "name": "context_brief",
        "format": "explainer / backgrounder",
        "lead_style": "context first, then the latest development in the same paragraph",
        "tone": "authoritative, plain-spoken, useful",
        "angle": "explain why the development matters without overstating certainty",
        "structure": "why it matters -> latest development -> background -> known impact -> what remains unclear",
        "sentence_mix": "medium-length sentences with no rhetorical questions",
        "closing": "state what is confirmed and what readers should watch next"
    },
    "timeline_brief": {
        "name": "timeline_brief",
        "format": "chronological narrative",
        "lead_style": "open with the latest confirmed point, then move backward only where useful",
        "tone": "precise, chronological, restrained",
        "angle": "show the sequence of confirmed events that explains the update",
        "structure": "latest status -> timeline -> context -> unresolved questions",
        "sentence_mix": "short factual sentences for sequence, longer sentences for context",
        "closing": "where things stand right now"
    },
    "reaction_context": {
        "name": "reaction_context",
        "format": "reaction / opinion roundup",
        "lead_style": "summarize the verified development before describing reaction",
        "tone": "measured, conversational, source-aware",
        "angle": "explain the range of public response without treating chatter as fact",
        "structure": "event summary -> sourced reaction -> context -> what is confirmed",
        "sentence_mix": "varied but restrained, no quote-heavy imitation",
        "closing": "return to the confirmed facts"
    },
    "profile_led": {
        "name": "profile_led",
        "format": "profile / character-led feature",
        "lead_style": "introduce the key person as if the reader has never heard of them",
        "tone": "feature magazine - warm, professional, fair",
        "angle": "who the person is and why this verified development matters",
        "structure": "person intro -> why they're in the news -> background -> current story -> significance",
        "sentence_mix": "longer flowing sentences broken by short punchy standalone facts",
        "closing": "what is known about the person's current trajectory"
    }
}
PRESET_NAMES = list(STYLE_PRESETS.keys())

# -- MEMORY (auto-migrate flat array -> dict) ------------------------------------
def load_memory(path):
    if not os.path.exists(path):
        return {"published_hashes": [], "style_history": []}
    raw = json.loads(open(path).read())
    if isinstance(raw, list):
        print("[memory] Migrating flat array -> new dict format")
        return {"published_hashes": raw, "style_history": []}
    raw.setdefault("published_hashes", [])
    raw.setdefault("style_history", [])
    return raw

def save_memory(path, mem):
    mem["published_hashes"] = mem["published_hashes"][-300:]
    mem["style_history"]    = mem["style_history"][-20:]
    with open(path, 'w') as f:
        json.dump(mem, f, indent=2, ensure_ascii=False)

# -- STYLE ROTATION -------------------------------------------------------------
def pick_style_preset(style_history):
    if len(style_history) >= 3:
        last3 = [h.get("stylePreset") for h in style_history[-3:]]
        if len(set(last3)) == 1 and last3[0] in PRESET_NAMES:
            available = [p for p in PRESET_NAMES if p != last3[0]]
            return random.choice(available)
    return random.choice(PRESET_NAMES)

# -- GEMINI CLIENT WITH KEY ROTATION + RETRY ------------------------------------
raw_keys   = [os.environ.get(k) for k in ['GEMINI_WRITE_KEY', 'GEMINI_API_KEY', 'GEMINI_API_KEY1'] if os.environ.get(k)]
if not raw_keys:
    print('No Gemini keys found'); sys.exit(1)
key_cycle   = itertools.cycle(raw_keys)
current_key = next(key_cycle)
client      = genai.Client(api_key=current_key)

def gemini_generate(prompt, label='', temperature=0.7, max_tokens=2048, use_search=False):
    global current_key, client
    for model in MODELS_TO_TRY:
        for attempt in range(6):
            try:
                gen_config = types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
                if use_search:
                    gen_config = types.GenerateContentConfig(
                        tools=[types.Tool(google_search=types.GoogleSearch())],
                        temperature=temperature,
                        max_output_tokens=max_tokens,
                    )
                resp      = client.models.generate_content(model=model, contents=prompt, config=gen_config)
                candidate = resp.candidates[0] if resp.candidates else None
                if candidate and candidate.content and candidate.content.parts:
                    result = ''.join(
                        p.text for p in candidate.content.parts
                        if hasattr(p, 'text') and p.text
                    ).strip()
                else:
                    result = (resp.text or '').strip()
                print(f'[gemini] OK ({model}, temp={temperature}): {label}')
                return result
            except Exception as e:
                err = str(e).lower()
                if any(x in err for x in ['429', 'quota', 'rate', '503', 'unavailable', '500', 'overloaded', 'resource_exhausted']):
                    print(f'[gemini] Rate limit on {model} - rotating key')
                    time.sleep(random.uniform(20, 35))
                    current_key = next(key_cycle)
                    client      = genai.Client(api_key=current_key)
                    continue
                elif any(x in err for x in ['not found', 'not support', 'not_found', 'deprecated']):
                    # If model is not found/deprecated, break to fall back to the next model
                    break
                else:
                    print(f'[gemini] Error ({model}, attempt {attempt+1}): {e}')
                    time.sleep(3)
                    continue
    return None

# -- IMGBB UPLOAD (unchanged) ---------------------------------------------------
def upload_to_imgbb(image_url):
    api_key = os.environ.get('IMGBB_API_KEY')
    if not api_key or not image_url:
        return image_url
    try:
        img_data = requests.get(image_url, timeout=15).content
        img = Image.open(io.BytesIO(img_data))
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        webp_buf = io.BytesIO()
        img.save(webp_buf, format='WEBP', quality=82)
        webp_buf.seek(0)
        b64  = base64.b64encode(webp_buf.read()).decode('utf-8')
        res  = requests.post('https://api.imgbb.com/1/upload',
                             data={'key': api_key, 'image': b64}, timeout=20)
        if res.status_code == 200:
            new_url = res.json()['data']['url']
            print(f'[imgbb] Re-hosted as WebP: {new_url}')
            return new_url
        print(f'[imgbb] Failed: {res.text}')
        return image_url
    except Exception as e:
        print(f'[imgbb] Error: {e}')
        return image_url

# -- SCRAPER (unchanged logic) --------------------------------------------------
def get_target_urls():
    urls = set()
    print(f'[scrape] Scanning {SITE_URL}...')
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage',
                      '--disable-blink-features=AutomationControlled',
                      '--disable-infobars', '--window-size=1920,1080']
            )
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='en-KE',
                timezone_id='Africa/Nairobi',
                extra_http_headers={
                    'Accept-Language': 'en-KE,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-Mode': 'navigate'
                }
            )
            page = context.new_page()
            stealth_sync(page)
            page.goto(SITE_URL, timeout=60000, wait_until='networkidle')
            time.sleep(random.uniform(2, 5))
            for _ in range(3):
                page.evaluate('window.scrollBy(0, 1800)')
                time.sleep(random.uniform(2, 4))
            soup = BeautifulSoup(page.content(), 'html.parser')
            for a in soup.find_all('a', href=True):
                href = a.get('href', '').strip()
                if not href: continue
                full_url = href if href.startswith('http') else f'https://www.{SITE_DOMAIN}' + href
                if SITE_DOMAIN not in full_url: continue
                path = full_url.split(SITE_DOMAIN)[-1].lower()
                slug = path.rstrip('/').split('/')[-1]
                if (len(slug) > 15 and '-' in slug
                        and not any(x in path for x in BANNED_URL_PATHS)):
                    urls.add(full_url)
            browser.close()
    except Exception as e:
        print(f'[scrape] Scan failed: {e}')
    def date_key(u):
        m = re.search(r'/(\d{4})/(\d{2})/(\d{2})/', u)
        return int(m.group(1)+m.group(2)+m.group(3)) if m else 19000101
    urls_list = sorted(list(urls), key=date_key, reverse=True)
    print(f'[scrape] Found {len(urls_list)} candidates. Top 8:')
    for u in urls_list[:8]: print(f'  {u}')
    return urls_list[:12]

def scrape_article(url):
    print(f'[scrape] Fetching: {url}')
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage',
                      '--disable-blink-features=AutomationControlled']
            )
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
            )
            page = context.new_page()
            stealth_sync(page)
            page.route('**/*', lambda route: route.abort()
                       if route.request.resource_type in ['image', 'font', 'media']
                       else route.continue_())
            page.goto(url, timeout=60000, wait_until='networkidle')
            content_sels = [
                '.single-post-content', '.post-body', '.td-post-content',
                '.tdb-block-inner', '.entry-content', '.jeg_content',
                'article', '.content', 'main'
            ]
            for sel in content_sels:
                try:
                    page.wait_for_selector(sel, timeout=8000)
                    print(f'[scrape] Content selector: {sel}')
                    break
                except: continue
            page.evaluate('window.scrollTo(0, document.body.scrollHeight / 2)')
            time.sleep(random.uniform(2, 4))
            soup = BeautifulSoup(page.content(), 'html.parser')
            browser.close()
            pub_time = None
            for script in soup.find_all('script', type='application/ld+json'):
                try:
                    data = json.loads(script.string or '{}')
                    if 'datePublished' in data:
                        pub_time = date_parser.parse(data['datePublished']); break
                except: pass
            if not pub_time:
                meta = soup.find('meta', property='article:published_time') or soup.find('meta', {'name': 'date'})
                if meta and meta.get('content'):
                    pub_time = date_parser.parse(meta['content'])
            if not pub_time:
                pat = r'(\d+)\s*(min|mins|hr|hrs|hour|hours|day|days)\s*ago|\d{1,2}\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'
                for el in soup.find_all(string=re.compile(pat, re.I)):
                    try: pub_time = date_parser.parse(el, fuzzy=True); break
                    except: continue
            if not pub_time:
                m = re.search(r'/(\d{4})/(\d{2})/(\d{2})/', url)
                if m: pub_time = datetime.datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), tzinfo=datetime.timezone.utc)
            if pub_time:
                if pub_time.tzinfo is None:
                    pub_time = pub_time.replace(tzinfo=datetime.timezone.utc)
                age = (datetime.datetime.now(datetime.timezone.utc) - pub_time).total_seconds() / 3600
                print(f'[scrape] Date: {pub_time} ({age:.1f}h old)')
                if age > MAX_AGE_HOURS:
                    print('[scrape] Too old - skip'); return None, None, None
            else:
                print('[scrape] No date found - skip for freshness safety')
                return None, None, None
            title = soup.title.string.strip() if soup.title else ''
            title = re.sub(r'\s*[-|]\s*Mpasho.*', '', title, flags=re.I).strip()
            article_text = ''
            mpasho_sels = [
                '.single-post-content', '.post-body', '.td-post-content',
                '.tdb-block-inner', '.entry', '.jeg_content',
                'article', '.article-body', '.post-content',
                '.entry-content', '.content', 'main'
            ]
            for sel in mpasho_sels:
                cont = soup.select_one(sel)
                if cont:
                    parts = [t.get_text(strip=True) for t in cont.find_all(['p', 'li', 'blockquote']) if len(t.get_text(strip=True)) > 20]
                    article_text = '\n\n'.join(parts)
                    if len(article_text) > 150: break
            if len(article_text) < 150:
                article_text = '\n\n'.join(
                    t.get_text(strip=True) for t in soup.find_all(['p', 'li', 'blockquote'])
                    if len(t.get_text(strip=True)) > 20
                )
            img_url = ''
            og = soup.find('meta', property='og:image')
            if og: img_url = og.get('content', '')
            if not img_url:
                tw = soup.find('meta', {'name': 'twitter:image'})
                if tw: img_url = tw.get('content', '')
            print(f'[scrape] Text length: {len(article_text)}')
            return article_text, img_url, title
    except Exception as e:
        print(f'[scrape] Error: {e}'); return None, None, None

# -- INTERNAL LINKING (topic-matched) ------------------------------------------
def tokenize(text):
    return set(re.findall(r'\b[a-zA-Z]{4,}\b', text.lower()))

def get_internal_links(current_title, current_body, n=3):
    posts_dir = os.environ.get('POSTS_DIR', 'content/posts')
    if not os.path.exists(posts_dir):
        return []
    scores = []
    for fn in os.listdir(posts_dir):
        if not fn.endswith('.md'): continue
        try:
            content = open(os.path.join(posts_dir, fn), encoding='utf-8').read()
            title_m = re.search(r'title:\s*"(.*?)"', content)
            slug_m  = re.search(r'slug:\s*"(.*?)"', content)
            if not title_m or not slug_m: continue
            post_title = title_m.group(1)
            post_slug  = slug_m.group(1)
            post_tokens = tokenize(post_title + ' ' + content[:500])
            cur_tokens  = tokenize(current_title + ' ' + current_body[:500])
            overlap = len(post_tokens & cur_tokens)
            if overlap > 0:
                scores.append((overlap, post_title, f'{SITE_BASE_URL}/article/{post_slug}'))
        except: pass
    scores.sort(reverse=True)
    return scores[:n]

# -- SOURCE LEAK GUARD ----------------------------------------------------------
REPORTING_VERBS = r'(reports?|reported|says?|said|confirmed|revealed|announced|disclosed|told|added|noted|wrote|writes?|stated)'

def scrub_source_leaks(text):
    text = re.sub(r'\bmpasho.co.ke\b', 'zandani.co.ke', text, flags=re.I)
    text = re.sub(
        rf'\bMpasho\b\s+{REPORTING_VERBS}',
        r'Za Ndani \1',
        text, flags=re.I
    )
    text = re.sub(r'\baccording to Mpasho\b', '', text, flags=re.I)
    return text.strip()

def clean_title(title):
    title = re.sub(r'\s+', ' ', (title or '')).strip()
    title = re.sub(r'\b(?:2020|2021|2022|2023|2024|2025|2026)\b', '', title)
    for word in HYPE_TITLE_WORDS:
        title = re.sub(rf'\b{re.escape(word)}\b', '', title, flags=re.I)
    title = re.sub(r'\s+', ' ', title).strip(' -:|')
    return title[:90].strip()

def is_low_value_candidate(url, title, text):
    haystack = f'{url} {title} {text[:700]}'.lower()
    if any(path in url.lower() for path in BANNED_URL_PATHS):
        return True, 'non-article URL'
    if any(x in haystack for x in ['/terms', 'terms and conditions', 'privacy policy', 'advertise with us']):
        return True, 'policy or utility page'
    if len(text or '') < 450:
        return True, 'thin source text'
    if re.search(r'\b(2020|2021|2022|2023|2024)\b', title or '') and current_year not in title:
        return True, 'stale year in title'
    return False, ''

def slug_exists(slug):
    posts_dir = os.environ.get('POSTS_DIR', 'content/posts')
    if not os.path.exists(posts_dir):
        return False
    for fn in os.listdir(posts_dir):
        if not fn.endswith('.md'):
            continue
        try:
            content = open(os.path.join(posts_dir, fn), encoding='utf-8').read(700)
            if re.search(rf'^slug:\s*["\']{re.escape(slug)}["\']', content, flags=re.M):
                return True
        except Exception:
            continue
    return False

def quality_gate(article_body, title):
    problems = []
    lower_body = article_body.lower()
    lower_title = title.lower()
    for phrase in BANNED_PHRASES:
        if phrase.lower() in lower_body or phrase.lower() in lower_title:
            problems.append(f'banned phrase: {phrase}')
    for word in HYPE_TITLE_WORDS:
        if word.lower() in lower_title:
            problems.append(f'hype title word: {word}')
    if any(re.search(pat, lower_body) for pat in GENERIC_FILLER_PATTERNS):
        problems.append('generic SEO filler section')
    if re.search(r'\b2024\b', article_body) and current_year != '2024':
        problems.append('stale 2024 reference')
    if len(strip_markdown_words(article_body)) < 380:
        problems.append('article is too short')
    if re.search(r'\bMpasho\b|mpasho\.co\.ke', article_body, flags=re.I):
        problems.append('source publication leaked')
    return problems

def strip_markdown_words(text):
    stripped = re.sub(r'```[\s\S]*?```', ' ', text or '')
    stripped = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', stripped)
    stripped = re.sub(r'[#>*_`~\-]', ' ', stripped)
    return re.findall(r'\b\w+\b', stripped)

# -- STAGE 1: STORY BRIEF ------------------------------------------------------
def stage1_brief(raw_text, style_preset):
    prompt = (
        f'You are a senior news editor at {YOUR_SITE_NAME}, a Kenyan entertainment news site.\n\n'
        f'Analyse the raw text below and produce a structured story brief.\n'
        f'CRITICAL: Do NOT echo source sentences or reproduce source phrasing.\n'
        f'CRITICAL: Do NOT mention any other website, publication, or news outlet.\n'
        f'CRITICAL: Separate confirmed facts from reactions, claims, and context.\n'
        f'CRITICAL: If a detail is not clearly supported by the raw text, do not include it.\n'
        f'Style context: {style_preset["name"]} - {style_preset["angle"]}\n\n'
        f'RAW TEXT:\n{raw_text[:4000]}\n\n'
        f'Return ONLY valid JSON (no markdown fences, no commentary):\n'
        '{{\n'
        '  "summary": "2-sentence plain-language summary",\n'
        '  "main_event": "one sentence: what happened",\n'
        '  "who": "key people involved",\n'
        '  "where": "location or context",\n'
        '  "when": "timing or date context",\n'
        '  "key_facts": ["fact1", "fact2", "fact3"],\n'
        '  "why_it_matters": "why Kenyan readers should care",\n'
        '  "article_angle": "the specific angle this article will take",\n'
        '  "keywords": ["kw1", "kw2", "kw3", "kw4"],\n'
        '  "suggested_sections": ["section1", "section2", "section3"],\n'
        '  "lead_approach": "describe how the opening sentence should feel",\n'
        '  "unsupported_or_unclear": ["detail that needs caution, if any"],\n'
        '  "must_avoid": ["phrase or approach to avoid 1", "phrase or approach to avoid 2"]\n'
        '}}'
    )
    raw = gemini_generate(prompt, label='stage1-brief', temperature=0.4, max_tokens=800)
    if not raw: raise RuntimeError('Stage 1 returned nothing')
    raw = re.sub(r'```(?:json)?', '', raw).strip().rstrip('`')
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m: return json.loads(m.group())
        raise

# -- STAGE 2: SEO METADATA -----------------------------------------------------
def stage2_seo(brief):
    prompt = (
        f'You are an expert SEO strategist for {SITE_BASE_URL} - a Kenyan entertainment site.\n\n'
        f'Using ONLY the story brief below (do not invent new facts), generate SEO metadata.\n'
        f'NEVER mention Mpasho or mpasho.co.ke in any field.\n\n'
        f'STORY BRIEF:\n{json.dumps(brief, indent=2)}\n\n'
        f'Rules:\n'
        f'- final_title: 45-70 characters, specific noun first, plain news tone, no clickbait, no brackets, no years, no "shocking", "massive", "explosive", "drama", "truth", or "revealed"\n'
        f'- meta_description: 120-150 characters, contains focus keyword, summarizes the fact plainly, no CTA phrase, no hype\n'
        f'- focus_keyword: 2-4 words, celebrity/topic name where possible\n'
        f'- seo_slug: 3-6 hyphenated words, lowercase, no hype words, no stale year\n'
        f'- tags: array of 4-5 tags (1 category, 2-3 celebrity/topic tags, 1 platform/genre tag, each 1-3 words, Title Case)\n\n'
        f'Return ONLY valid JSON (no markdown fences):\n'
        '{"final_title": "...", "meta_description": "...", "focus_keyword": "...", "seo_slug": "...", "tags": [...]}\n'
    )
    raw = gemini_generate(prompt, label='stage2-seo', temperature=0.35, max_tokens=400)
    if not raw: raise RuntimeError('Stage 2 returned nothing')
    raw = re.sub(r'```(?:json)?', '', raw).strip().rstrip('`')
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m: return json.loads(m.group())
        raise

# -- STAGE 3: WRITE ARTICLE ----------------------------------------------------
def stage3_write(brief, seo, style_preset, internal_links):
    link_block = ''
    if internal_links:
        chosen = internal_links[:2]
        link_items = '\n'.join(f'- [{t}]({u})' for _, t, u in chosen)
        link_block = f'\nINTERNAL LINKS - weave 1-2 in naturally if topically relevant:\n{link_items}\n'
    banned_str = ', '.join(BANNED_PHRASES)
    prompt = (
        f'Current Date: {full_date_str}. The current year is {current_year}.\n\n'
        f'You are a skilled journalist at {YOUR_SITE_NAME} writing for a Kenyan audience.\n\n'
        f'Write a complete news article using ONLY the story brief below.\n'
        f'Do NOT reproduce phrases from the original source.\n'
        f'Do NOT mention Mpasho, mpasho.co.ke, or any other publication by name.\n\n'
        f'STORY BRIEF:\n{json.dumps(brief, indent=2)}\n\n'
        f'ARTICLE TITLE: {seo["final_title"]}\n'
        f'FOCUS KEYWORD (use naturally 2-3 times): {seo["focus_keyword"]}\n\n'
        f'{link_block}\n'
        f'STYLE PRESET - {style_preset["name"].upper()}:\n'
        f'- Format: {style_preset["format"]}\n'
        f'- Lead style: {style_preset["lead_style"]}\n'
        f'- Tone: {style_preset["tone"]}\n'
        f'- Angle: {style_preset["angle"]}\n'
        f'- Structure: {style_preset["structure"]}\n'
        f'- Sentence mix: {style_preset["sentence_mix"]}\n'
        f'- Closing: {style_preset["closing"]}\n\n'
        f'STRUCTURE:\n'
        f'1. 40-55 word lede paragraph - NO heading above it. Answers who/what/when/where. Include focus keyword.\n'
        f'2. ## H2 subheading containing the focus keyword.\n'
        f'3. ### subheadings with supporting detail.\n\n'
        f'RULES:\n'
        f'- 450-700 words. Markdown body only (no frontmatter, no title heading, no author/date line).\n'
        f'- Third-person news style. NEVER write "I am Za Ndani", "Za Ndani can confirm", or any self-identification.\n'
        f'- Lead with the latest verified fact. Do not tease, speculate, moralize, or ask rhetorical questions.\n'
        f'- Do not add generic sections titled "What this means for Kenyans", "Key facts", or "FAQ" unless the brief specifically supports them.\n'
        f'- Attribute claims carefully: use "said", "claimed", "alleged", or "according to the post" only when the brief supports it.\n'
        f'- Use internal links only when they genuinely match the same person, show, team, agency, or topic.\n'
        f'- Do not start more than 2 paragraphs with the same word.\n'
        f'- No Sheng. No cliches.\n'
        f'- All dates reflect {current_year}.\n'
        f'BANNED PHRASES: {banned_str}'
    )
    result = gemini_generate(prompt, label='stage3-write', temperature=0.58, max_tokens=1200)
    if not result: raise RuntimeError('Stage 3 returned nothing')
    return result

# -- STAGE 4: REVIEW + CONDITIONAL REWRITE ------------------------------------
def stage4_review(article_body, brief, style_preset, seo):
    review_prompt = (
        f'You are a quality editor at {YOUR_SITE_NAME}.\n\n'
        f'Score the article below. Return ONLY valid JSON - no markdown.\n\n'
        f'ARTICLE (first 3000 chars):\n{article_body[:3000]}\n\n'
        f'BRIEF SUMMARY: {brief.get("summary", "")}\n\n'
        f'- source_similarity (1-10): echoes source structure? 10=identical\n'
        f'- house_style_repetition (1-10): repetitive patterns? 10=very repetitive\n'
        f'- voice_variety (1-10): variety of sentence structures? 10=excellent\n'
        f'- source_mentions (count): references to other publications\n\n'
        f'- unsupported_claims (count): claims not supported by the brief\n'
        f'- hype_or_clickbait (count): hype phrases, teasers, rhetorical questions, or exaggerated title/body language\n'
        f'- generic_filler (count): generic SEO padding or boilerplate advice sections\n\n'
        '{"source_similarity": 0, "house_style_repetition": 0, "voice_variety": 0, "source_mentions": 0, "unsupported_claims": 0, "hype_or_clickbait": 0, "generic_filler": 0, "notes": "..."}'
    )
    raw = gemini_generate(review_prompt, label='stage4-review', temperature=0.2, max_tokens=300)
    try:
        raw_clean = re.sub(r'```(?:json)?', '', raw or '').strip().rstrip('`')
        scores = json.loads(raw_clean)
    except Exception:
        m = re.search(r'\{.*\}', raw or '', re.DOTALL)
        scores = json.loads(m.group()) if m else {
            "source_similarity": 5, "house_style_repetition": 5,
            "voice_variety": 6, "source_mentions": 0, "notes": "parse fallback"
        }
    needs_rewrite = (
        scores.get("source_similarity", 0) >= 7 or
        scores.get("house_style_repetition", 0) >= 7 or
        scores.get("voice_variety", 10) <= 4 or
        scores.get("source_mentions", 0) > 0 or
        scores.get("unsupported_claims", 0) > 0 or
        scores.get("hype_or_clickbait", 0) > 0 or
        scores.get("generic_filler", 0) > 0
    )
    print(f'[review] Scores: {scores}')
    if needs_rewrite:
        print('[review] Auto-rewrite triggered')
        banned_str = ', '.join(BANNED_PHRASES)
        rewrite_prompt = (
            f'You are a senior journalist at {YOUR_SITE_NAME}.\n\n'
            f'The article failed quality review:\n'
            f'  Source similarity: {scores.get("source_similarity")} (must be <7)\n'
            f'  Repetition: {scores.get("house_style_repetition")} (must be <7)\n'
            f'  Voice variety: {scores.get("voice_variety")} (must be >4)\n'
            f'  Source mentions: {scores.get("source_mentions")} (must be 0)\n'
            f'  Notes: {scores.get("notes", "")}\n\n'
            f'Rewrite completely from scratch using only the brief. 500-800 words. Markdown body only.\n'
            f'Do NOT mention Mpasho or any other publication.\n'
            f'Do NOT use hype, open questions, teasers, generic SEO sections, or unsupported claims.\n'
            f'Do NOT use: {banned_str}\n\n'
            f'STORY BRIEF:\n{json.dumps(brief, indent=2)}\n\n'
            f'STYLE: {style_preset["name"]} - {style_preset["angle"]}\n'
            f'TITLE: {seo["final_title"]}'
        )
        article_body = gemini_generate(rewrite_prompt, label='stage4-rewrite', temperature=0.88, max_tokens=1200)
        if not article_body: raise RuntimeError('Stage 4 rewrite returned nothing')
    return article_body, scores

# -- MAIN -----------------------------------------------------------------------
memory_path      = os.environ.get('MEMORY_FILE', '.github/memory_zandani.json')
memory           = load_memory(memory_path)
published_hashes = set(memory["published_hashes"])
style_history    = memory["style_history"]

article_links = get_target_urls()
if not article_links:
    print('[main] No candidates found'); sys.exit(0)

full_raw_text, target_image, target_title, final_hash, source_url = None, None, None, None, None
for link in article_links:
    u_hash = hashlib.md5(link.encode()).hexdigest()
    if u_hash in published_hashes:
        print(f'[main] Skip (already published): {link}'); continue
    text, img, title = scrape_article(link)
    rejected, reason = is_low_value_candidate(link, title, text or '')
    if rejected:
        print(f'[main] Skip ({reason}): {link}')
        continue
    if text and len(text) > 450:
        full_raw_text = text
        target_image  = img
        target_title  = title or 'Entertainment News'
        final_hash    = u_hash
        source_url    = link
        break

if not full_raw_text:
    print('[main] No fresh valid article found'); sys.exit(0)

print(f'[main] Processing: {source_url}')
preset_name  = pick_style_preset(style_history)
style_preset = STYLE_PRESETS[preset_name]
print(f'[main] Style preset: {preset_name}')

brief    = stage1_brief(full_raw_text, style_preset)
time.sleep(4)
seo_data = stage2_seo(brief)
time.sleep(4)

final_title      = clean_title(seo_data.get('final_title', target_title))
meta_description = seo_data.get('meta_description', '')
focus_keyword    = seo_data.get('focus_keyword', '')
seo_slug         = seo_data.get('seo_slug', '')
article_tags     = [str(t) for t in seo_data.get('tags', [])[:5]]
if not final_title:
    final_title = clean_title(target_title) or 'Entertainment update'
if not focus_keyword:
    focus_keyword = ' '.join(final_title.split()[:4])
if not meta_description:
    meta_description = f'{focus_keyword}: latest verified entertainment update with the key context readers need.'
meta_description = re.sub(r'\s+', ' ', meta_description).strip()

if len(meta_description) > 155:
    cut = meta_description[:155]
    last_period = max(cut.rfind('. '), cut.rfind('! '), cut.rfind('? '))
    meta_description = cut[:last_period + 1] if last_period > 100 else cut[:cut.rfind(' ')] + '...'
meta_description = meta_description.replace('"', "'")

if seo_slug and re.match(r'^[a-z0-9-]+$', seo_slug):
    slug = seo_slug[:68]
else:
    slug = re.sub(r'[^a-z0-9]+', '-', final_title.lower()).strip('-')[:68]
slug = re.sub(r'-+', '-', slug).strip('-')
if not slug:
    slug = re.sub(r'[^a-z0-9]+', '-', final_title.lower()).strip('-')[:68] or 'entertainment-update'
if slug_exists(slug):
    print(f'[main] Skip (slug already exists): {slug}')
    sys.exit(0)
canonical_url = f'{SITE_BASE_URL}/article/{slug}'

print(f'[main] Title  : {final_title}')
print(f'[main] Slug   : {slug}')
print(f'[main] Keyword: {focus_keyword}')

current_key = next(key_cycle)
client      = genai.Client(api_key=current_key)
time.sleep(5)

internal_links = get_internal_links(final_title, full_raw_text)
article_body   = stage3_write(brief, seo_data, style_preset, internal_links)
time.sleep(4)

article_body, scores = stage4_review(article_body, brief, style_preset, seo_data)
time.sleep(3)

article_body = re.sub(r'^```(?:markdown)?\n?', '', article_body).rstrip('`').strip()
article_body = re.sub(r'^(Title|By|Date):.*?\n', '', article_body, flags=re.I | re.M)

# Stripping unicode em (\u2014) and en (\u2013) dashes generated by the AI
article_body = article_body.replace('\u2014', '-').replace('\u2013', '-')
article_body = scrub_source_leaks(article_body)
gate_problems = quality_gate(article_body, final_title)
if gate_problems:
    print(f'[quality] Failed deterministic gate: {gate_problems}')
    banned_str = ', '.join(BANNED_PHRASES)
    repair_prompt = (
        f'You are the final editor at {YOUR_SITE_NAME}.\n'
        f'Fix the article below so it passes these issues: {gate_problems}.\n'
        f'Use only the brief. Keep it factual, specific, and restrained. Markdown body only.\n'
        f'No generic SEO sections, no hype, no stale years, no source publication mentions.\n'
        f'BANNED PHRASES: {banned_str}\n\n'
        f'BRIEF:\n{json.dumps(brief, indent=2)}\n\n'
        f'TITLE: {final_title}\nFOCUS KEYWORD: {focus_keyword}\n\n'
        f'ARTICLE TO FIX:\n{article_body[:4000]}'
    )
    repaired = gemini_generate(repair_prompt, label='deterministic-quality-repair', temperature=0.35, max_tokens=1200)
    if repaired:
        article_body = scrub_source_leaks(repaired.replace('\u2014', '-').replace('\u2013', '-').strip())
    gate_problems = quality_gate(article_body, final_title)
    if gate_problems:
        print(f'[quality] Still failed after repair: {gate_problems}')
        sys.exit(1)

final_image   = upload_to_imgbb(target_image) if target_image else ''
excerpt_words = meta_description.split()[:18]
excerpt       = ' '.join(excerpt_words) + ('...' if len(meta_description.split()) > 18 else '')
tags_json     = json.dumps(article_tags)
author_url    = f'{SITE_BASE_URL}/author/za-ndani'

frontmatter_lines = [
    '---',
    f'title: "{final_title.replace(chr(34), chr(39))}"',
    f'slug: "{slug}"',
    f'description: "{meta_description}"',
    f'excerpt: "{excerpt}"',
    f'focusKeyword: "{focus_keyword.replace(chr(34), chr(39))}"',
    'author: "Za Ndani"',
    f'author_url: "{author_url}"',
    f'image: "{final_image}"',
    'category: "Entertainment"',
    f'tags: {tags_json}',
    f'canonical: "{canonical_url}"',
    f'date: "{publish_timestamp}"',
    'authorUrl: "https://zandani.co.ke/author/za-ndani"',
    f'dateModified: "{publish_timestamp}"',
    'schema: "NewsArticle"',
    f'stylePreset: "{preset_name}"',
    f'leadStyle: "{style_preset["lead_style"][:80].replace(chr(34), chr(39))}"',
    f'articleAngle: "{brief.get("article_angle", "")[:100].replace(chr(34), chr(39))}"',
    f'sourceUrl: "{source_url}"',
    '---',
]

posts_dir = os.environ.get('POSTS_DIR', 'content/posts')
os.makedirs(posts_dir, exist_ok=True)
filepath  = os.path.join(posts_dir, today_str + '-' + slug + '.md')
with open(filepath, 'w', encoding='utf-8') as f:
    f.write('\n'.join(frontmatter_lines) + '\n\n' + article_body + '\n')

memory["published_hashes"].append(final_hash)
style_history.append({
    "title":        final_title,
    "stylePreset":  preset_name,
    "leadStyle":    style_preset["lead_style"],
    "articleAngle": brief.get("article_angle", ""),
    "bodySample":   article_body[:200].replace('\n', ' ')
})
memory["style_history"] = style_history
save_memory(memory_path, memory)

print(f'[main] Saved     : {filepath}')
print(f'[main] Canonical : {canonical_url}')
print(f'[main] Preset    : {preset_name}')
print(f'[main] Tags      : {article_tags}')
