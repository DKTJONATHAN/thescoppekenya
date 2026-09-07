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
MAX_CANDIDATES = 20
MAX_SCRAPE_TRIES = 8
FRESH_HOURS = 18

MODELS_TO_TRY = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
]

BANNED_PHRASES = [
    "sasa basi", "melting the pot", "spill the tea", "dive in", "delve into",
    "moreover", "furthermore", "in conclusion", "it's worth noting",
    "a testament to", "navigating the landscape", "in today's digital age",
    "tapestry", "game-changer", "stay tuned", "unpack", "breaking news",
    "is central to this update for kenyan readers",
    "is the central subject of the update",
    "central subject of the update",
    "central to this update",
    "what this means for kenyans",
    "what this means for kenya",
    "key takeaway",
    "search-ready summary",
    "in a significant development",
    "sparking debate",
    "raising questions",
    "underscores the need",
    "only time will tell",
    "the bigger picture",
    "it remains to be seen",
    "this development comes as",
    "a wake-up call",
    "food for thought",
]

BRANDS_TO_SCRUB = [
    "Kenyans.co.ke", "kenyans.co.ke", "BBC", "CNN", "Reuters", "Al Jazeera",
    "Daily Nation", "Nation.Africa", "Standard Media", "The Standard",
    "Citizen Digital", "Tuko", "Pulse Live", "Capital FM", "K24", "NTV Kenya", "KTN News",
]

STYLE_PRESETS = [
    {"name": "Hard News Lead", "format": "Inverted pyramid news report",
     "lead_style": "Single-sentence hard lead: who did what, where, when.",
     "tone": "Neutral wire-service style. No opinion.", "angle": "The facts of what happened",
     "structure": "Lead, then facts in descending importance, attributed quotes, remaining context",
     "sentence_mix": "Short and medium. Declarative.", "closing": "Last known status or next scheduled step (fact only)"},
    {"name": "Event Report", "format": "Straight event report",
     "lead_style": "Open with the event and the principal actor.",
     "tone": "Factual, clipped, newspaper desk", "angle": "Sequence of what occurred",
     "structure": "Lead, what happened next, who confirmed it, any numbers or locations",
     "sentence_mix": "Mostly short", "closing": "Where the matter stands now"},
    {"name": "Statement Report", "format": "Statement-driven news report",
     "lead_style": "Lead with the official action or statement and the speaker.",
     "tone": "Neutral, attribution-heavy", "angle": "What was said or ordered",
     "structure": "Lead, quote or order, background facts, response if any",
     "sentence_mix": "Short and medium", "closing": "What happens next if already scheduled"},
]
