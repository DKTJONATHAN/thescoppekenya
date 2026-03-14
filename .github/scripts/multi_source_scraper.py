import os
import json
import datetime
import requests
import re
import time
import sys
import hashlib
import itertools
import base64
import random

from google import genai
from google.genai import types
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import yt_dlp

# ============================================================
#  CONSTANTS
# ============================================================
full_date_str     = datetime.datetime.utcnow().strftime("%A, %B %d, %Y")
publish_timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash"]

BANNED_PHRASES = [
    "sasa basi", "melting the pot", "spill the tea", "tea is hot",
    "grab your popcorn", "listen up", "buckle up", "breaking news",
    "sherehe", "form ni gani", "udaku", "hello guys", "welcome back",
    "mambo vipi", "niaje wasee", "karibuni", "tapestry", "dive in",
    "delve into", "moreover", "furthermore", "in conclusion",
    "it's worth noting", "a testament to", "navigating the landscape",
    "in today's digital age", "shed light on",
]

AUTHOR_PERSONAS = {
    "Za Ndani": (
        "Za Ndani, a sharp and cynical Kenyan entertainment journalist. "
        "Emulate the engaging, dramatic tone of authentic Mpasho authors. "
        "Point out the angle mainstream media ignores."
    ),
    "Mutheu Ann": (
        "Mutheu Ann, a plugged-in Kenyan entertainment journalist writing for Za Ndani. "
        "Write in a passionate, high-energy style. Point out the critical angle mainstream media ignores."
    ),
    "Celestine Nzioka": (
        "Celestine Nzioka, a cynical and authoritative Kenyan political and news journalist. "
        "Be hard-hitting and expose the angle mainstream media ignores. Write with authority."
    ),
}

SITE_SELECTORS = {
    "citizen.digital":           ["div.article-content", "div.single-post-content", "div.post-body"],
    "nation.africa":             ["div.article-body", "div.story-content", "section.article__body"],
    "standardmedia.co.ke":       ["div.article-body", "div.story-body", "div#article-content"],
    "tuko.co.ke":                ["div.post-content", "div.article__body", "div.tuko-post-content"],
    "kenyans.co.ke":             ["div.article-content", "div.news-body", "div.field-items"],
    "mpasho.co.ke":              ["div.entry-content", "div.post-content", "article"],
    "nairobinews.nation.africa": ["div.article-body", "div.story-content"],
    "businessdailyafrica.com":   ["div.article-body", "div.story-content"],
    "capitalfm.co.ke":           ["div.entry-content", "div.post-content"],
    "k24tv.co.ke":               ["div.article-content", "div.post-body"],
    "ntv.co.ke":                 ["div.article-content", "div.single-content"],
    "ew.com":                    ["div.article-body", "section[class*=article]", "div[class*=longform]"],
    "people.com":                ["div.article-body", "section.article-body", "div[class*=content-body]"],
    "tmz.com":                   ["div.article-content", "div[class*=article__content]"],
    "bbc.com":                   ["article", "div[data-component=text-block]", "div.article__body-content"],
    "bbc.co.uk":                 ["article", "div[data-component=text-block]"],
    "theguardian.com":           ["div.article-body-commercial-selector", "div[class*=article-body]"],
    "reuters.com":               ["div[class*=article-body]", "div.StandardArticleBody_body"],
    "apnews.com":                ["div.article-body", "div[class*=Article]", "div.RichTextStoryBody"],
    "aljazeera.com":             ["div.article-body", "div[class*=wysiwyg]"],
    "nytimes.com":               ["section[name=articleBody]", "div[class*=StoryBodyCompact]"],
    "dailymail.co.uk":           ["div.article-text", "div#js-article-text"],
    "thesun.co.uk":              ["div.article__content", "div[class*=article-content]"],
    "independent.co.uk":         ["div[class*=article-body]", "div.sc-d7f02f38"],
    "variety.com":               ["div.article-body", "div[class*=article-content]"],
    "hollywoodreporter.com":     ["div.article-body", "div[class*=content-body]"],
    "deadline.com":              ["div.a-content", "div[class*=article-content]"],
}

TITLE_SUFFIXES = [
    " | Citizen Digital", " - Citizen Digital", " | Nation Africa", " - Nation Africa",
    " | Nation", " - Nation", " | The Standard", " - The Standard",
    " | Mpasho", " - Mpasho", " | Kenyans.co.ke", " - Kenyans.co.ke",
    " | Tuko", " - Tuko", " | NTV Kenya", " - NTV Kenya",
    " | K24", " - K24", " | Capital FM", " - Capital FM",
    " | Business Daily", " - Business Daily", " | EW", " - EW",
    " | People", " | TMZ", " | BBC", " - BBC News",
    " | The Guardian", " | Reuters", " | AP News", " | Al Jazeera",
    " | Variety", " | The Hollywood Reporter", " | Deadline",
    " | The Sun", " | Daily Mail",
]

# ============================================================
#  HELPERS
# ============================================================
def fmt_num(n):
    if n is None:
        return "N/A"
    try:
        n = int(n)
        if n >= 1_000_000_000:
            return f"{n / 1_000_000_000:.2f}B"
        if n >= 1_000_000:
            return f"{n / 1_000_000:.2f}M"
        if n >= 1_000:
            return f"{n / 1_000:.1f}K"
        return str(n)
    except Exception:
        return str(n)


def fmt_dur(secs):
    if not secs:
        return "N/A"
    try:
        secs = int(secs)
        m, s = divmod(secs, 60)
        h, m = divmod(m, 60)
        return f"{h}h {m}m {s}s" if h else f"{m}m {s}s"
    except Exception:
        return str(secs)


def dash_scrubber(text):
    if not text:
        return ""
    text = text.replace("\u2014", "-").replace("\u2013", "-")
    return text


def clean_url(url):
    url = url.strip()
    url = re.sub(r"[?&](utm_[^&]*|source=[^&]*|ref=[^&]*)", "", url)
    return url.rstrip("?&")


def parse_urls(raw):
    parts = re.split(r"[\n|,]+", raw)
    return [clean_url(u.strip()) for u in parts if u.strip().startswith("http")]


def detect_platform(url):
    u = url.lower()
    if "youtube.com" in u or "youtu.be" in u:
        return "youtube"
    if "spotify.com" in u:
        return "spotify"
    if "twitter.com" in u or "x.com" in u:
        return "twitter"
    if "tiktok.com" in u:
        return "tiktok"
    if "instagram.com" in u:
        return "instagram"
    if "soundcloud.com" in u:
        return "soundcloud"
    return "article"


def upload_to_imgbb(image_url):
    api_key = os.environ.get("IMGBB_API_KEY")
    if not api_key or not image_url:
        return image_url
    try:
        img_data = requests.get(image_url, timeout=15).content
        b64 = base64.b64encode(img_data).decode("utf-8")
        res = requests.post(
            "https://api.imgbb.com/1/upload",
            data={"key": api_key, "image": b64},
            timeout=20,
        )
        if res.status_code == 200:
            return res.json()["data"]["url"]
        return image_url
    except Exception as e:
        print(f"ImgBB error: {e}")
        return image_url


def get_real_image(query):
    key = os.environ.get("UNSPLASH_ACCESS_KEY")
    fallback = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200"
    if not key:
        return fallback
    try:
        r = requests.get(
            f"https://api.unsplash.com/photos/random?query={query}&orientation=landscape&client_id={key}",
            timeout=10,
        )
        if r.status_code == 200:
            return r.json()["urls"]["regular"]
    except Exception:
        pass
    return fallback


def get_site_key(url):
    for k in SITE_SELECTORS:
        if k in url:
            return k
    return None


# ============================================================
#  SCRAPER: YOUTUBE via yt-dlp
# ============================================================
def scrape_youtube(url):
    data = {"platform": "YouTube", "url": url}
    is_channel = any(x in url for x in ["/@", "/channel/", "/c/", "/user/"]) or (
        "youtube.com" in url and "/watch" not in url and "youtu.be" not in url
    )
    print(f"[YouTube] {'channel' if is_channel else 'video'}: {url}")

    if is_channel:
        opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": "in_playlist",
            "playlist_end": 20,
            "ignoreerrors": True,
        }
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
            if not info:
                data["error"] = "No data returned"
                return data
            data["type"] = "channel"
            data["channel_name"] = (
                info.get("channel") or info.get("uploader") or info.get("title", "Unknown")
            )
            data["subscriber_count"] = info.get("channel_follower_count")
            data["description"] = (info.get("description") or "")[:800]
            data["total_views"] = info.get("view_count")
            data["video_count"] = info.get("playlist_count")
            entries = [e for e in (info.get("entries") or []) if e][:20]
            data["recent_videos"] = [
                {
                    "title": e.get("title", ""),
                    "views": e.get("view_count"),
                    "likes": e.get("like_count"),
                    "duration": e.get("duration"),
                    "upload_date": e.get("upload_date", ""),
                }
                for e in entries
            ]
            vcounts = [e.get("view_count", 0) for e in entries if e.get("view_count")]
            if vcounts:
                data["avg_views"] = int(sum(vcounts) / len(vcounts))
                data["peak_views"] = max(vcounts)
                data["min_views"] = min(vcounts)
            print(
                f"  Channel: {data['channel_name']} | "
                f"Subs: {fmt_num(data['subscriber_count'])} | "
                f"Videos sampled: {len(data['recent_videos'])}"
            )
        except Exception as e:
            print(f"  Channel error: {e}")
            data["error"] = str(e)
    else:
        opts = {
            "quiet": True,
            "no_warnings": True,
            "getcomments": True,
            "ignoreerrors": True,
            "extractor_args": {
                "youtube": {
                    "comment_sort": ["top"],
                    "max_comments": ["30", "0", "0", "0"],
                }
            },
        }
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
            if not info:
                data["error"] = "No data returned"
                return data
            data["type"] = "video"
            data["title"] = info.get("title", "")
            data["channel_name"] = info.get("channel") or info.get("uploader", "")
            data["subscriber_count"] = info.get("channel_follower_count")
            data["views"] = info.get("view_count")
            data["likes"] = info.get("like_count")
            data["comment_count"] = info.get("comment_count")
            data["upload_date"] = info.get("upload_date", "")
            data["duration"] = info.get("duration")
            data["description"] = (info.get("description") or "")[:800]
            data["tags"] = (info.get("tags") or [])[:10]
            data["categories"] = info.get("categories", [])
            raw_comments = info.get("comments") or []
            top_comments = sorted(
                [c for c in raw_comments if c.get("like_count", 0) > 0],
                key=lambda c: c.get("like_count", 0),
                reverse=True,
            )[:15]
            data["top_comments"] = [
                {
                    "text": (c.get("text") or "")[:280],
                    "likes": c.get("like_count", 0),
                    "author": c.get("author", ""),
                }
                for c in top_comments
            ]
            print(
                f"  Video: {data['title']} | "
                f"Views: {fmt_num(data['views'])} | "
                f"Comments: {fmt_num(data['comment_count'])}"
            )
        except Exception as e:
            print(f"  Video error: {e}")
            data["error"] = str(e)
    return data


# ============================================================
#  SCRAPER: SPOTIFY via Playwright
# ============================================================
def scrape_spotify(url, pw_page):
    data = {"platform": "Spotify", "url": url}
    print(f"[Spotify] {url}")
    try:
        pw_page.goto(url, timeout=55000, wait_until="networkidle")
        pw_page.wait_for_timeout(5000)
        pw_page.evaluate("window.scrollBy(0, document.body.scrollHeight / 2)")
        pw_page.wait_for_timeout(3000)
        soup = BeautifulSoup(pw_page.content(), "html.parser")
        full_text = soup.get_text(separator=" ", strip=True)

        if "/artist/" in url:
            data["type"] = "artist"
            h1 = soup.find("h1")
            if h1:
                data["artist_name"] = h1.get_text(strip=True)
            ml = re.search(r"([\d,\.]+)\s*monthly listeners?", full_text, re.IGNORECASE)
            if ml:
                data["monthly_listeners"] = ml.group(1)
            fl = re.search(r"([\d,\.]+)\s*followers?", full_text, re.IGNORECASE)
            if fl:
                data["followers"] = fl.group(1)
            rows = soup.select('[data-testid="tracklist-row"]') or soup.select(
                '[class*="TrackListRow"]'
            )
            data["top_tracks"] = [
                r.get_text(separator=" | ", strip=True)[:200] for r in rows[:10]
            ]
            alb = soup.select('[data-testid="artist-discography-section"] a')
            data["recent_releases"] = list(
                {a.get_text(strip=True) for a in alb if len(a.get_text(strip=True)) > 2}
            )[:10]

        elif "/album/" in url:
            data["type"] = "album"
            h1 = soup.find("h1")
            if h1:
                data["album_name"] = h1.get_text(strip=True)
            rows = soup.select('[data-testid="tracklist-row"]') or soup.select(
                '[class*="TrackListRow"]'
            )
            data["tracklist"] = [
                r.get_text(separator=" | ", strip=True)[:200] for r in rows[:25]
            ]
            yr = re.search(r"\b(20\d{2})\b", full_text)
            if yr:
                data["release_year"] = yr.group(1)

        elif "/track/" in url:
            data["type"] = "track"
            h1 = soup.find("h1")
            if h1:
                data["track_name"] = h1.get_text(strip=True)
        else:
            data["type"] = "page"

        data["page_summary"] = full_text[:3500]
        print(
            f"  {data.get('type','?')}: "
            f"{data.get('artist_name') or data.get('album_name') or data.get('track_name','N/A')} | "
            f"Listeners: {data.get('monthly_listeners','N/A')}"
        )
    except Exception as e:
        print(f"  Spotify error: {e}")
        data["error"] = str(e)
    return data


# ============================================================
#  SCRAPER: GENERAL ARTICLE / SOCIAL PAGE via Playwright
# ============================================================
def extract_html_content(soup, url):
    page_title = ""
    for sel in ["h1", "h1.article-title", "h1.post-title", "h1.entry-title"]:
        t = soup.select_one(sel)
        if t:
            page_title = t.get_text().strip()
            if page_title:
                break
    if not page_title:
        tt = soup.find("title")
        if tt:
            page_title = tt.get_text().strip()
    if not page_title:
        og = soup.find("meta", property="og:title")
        if og:
            page_title = og.get("content", "").strip()
    for suf in TITLE_SUFFIXES:
        page_title = page_title.replace(suf, "").strip()

    article_text = ""
    site_key = get_site_key(url)
    if site_key:
        for sel in SITE_SELECTORS[site_key]:
            c = soup.select_one(sel)
            if c:
                chunk = "\n\n".join(
                    [
                        p.get_text(strip=True)
                        for p in c.find_all("p")
                        if len(p.get_text(strip=True)) > 40
                    ]
                )
                if len(chunk) > 300:
                    article_text = chunk
                    break

    if len(article_text) < 300:
        for c in soup.select(
            "article, [class*=article-body], [class*=article-content], "
            "[class*=article__body], [class*=post-content], [class*=entry-content], "
            "[class*=story-body], [class*=story-content], [class*=content-body]"
        ):
            cn = " ".join(c.get("class", []))
            if any(
                x in cn
                for x in ["nav", "sidebar", "related", "widget", "comment", "footer", "header"]
            ):
                continue
            chunk = "\n\n".join(
                [
                    p.get_text(strip=True)
                    for p in c.find_all("p")
                    if len(p.get_text(strip=True)) > 40
                ]
            )
            if len(chunk) > len(article_text):
                article_text = chunk

    if len(article_text) < 300:
        all_p = soup.find_all("p")
        chunk = "\n\n".join(
            [p.get_text(strip=True) for p in all_p if len(p.get_text(strip=True)) > 40]
        )
        if len(chunk) > 300:
            article_text = chunk

    if len(article_text) < 300:
        body = soup.find("body")
        if body:
            for tag in body.find_all(
                ["script", "style", "nav", "header", "footer", "aside", "noscript"]
            ):
                tag.decompose()
            lines = [
                l.strip()
                for l in body.get_text(separator="\n").split("\n")
                if len(l.strip()) > 50
            ]
            article_text = "\n\n".join(lines)

    img_url = ""
    for meta in soup.find_all("meta"):
        prop = meta.get("property", "") or meta.get("name", "")
        if prop in ["og:image", "twitter:image", "twitter:image:src"]:
            c = meta.get("content", "")
            if c and "logo" not in c.lower() and len(c) > 10:
                img_url = c
                break
    if not img_url:
        base_url = "/".join(url.split("/")[:3])
        for sel in [
            "article img",
            "[class*=article] img",
            "[class*=hero] img",
            "picture img",
            ".featured-image img",
        ]:
            li = soup.select_one(sel)
            if li:
                src = (
                    li.get("src") or li.get("data-src") or li.get("data-lazy-src", "")
                )
                if (
                    src
                    and "data:image" not in src
                    and "placeholder" not in src.lower()
                    and "logo" not in src.lower()
                ):
                    img_url = src if src.startswith("http") else base_url + "/" + src.lstrip("/")
                    break

    return article_text, img_url, page_title


def scrape_article_or_social(url):
    print(f"[Article/Social] {url}")
    data = {"platform": "Article", "url": url, "type": "article"}
    best_text, best_img, best_title = "", "", ""

    for name, wait_until, block_media in [
        ("networkidle", "networkidle", False),
        ("domcontentloaded", "domcontentloaded", False),
        ("light-block", "domcontentloaded", True),
    ]:
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-blink-features=AutomationControlled",
                    ],