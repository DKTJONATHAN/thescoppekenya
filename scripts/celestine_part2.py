
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
        "Description must state the news fact only. No commentary.\n"
        'Return JSON: {"title":"...","description":"...","slug":"...","tags":["..."]}'
    )
    return parse_json_safely(gemini_call(prompt, "seo", json_mode=True))


def stage_write(brief, seo, style, internal_links):
    prompt = (
        f"You are {AUTHOR_NAME}, a straight-news reporter for Za Ndani (Kenya). "
        f"Today is {full_date_str} (East Africa Time).\n\n"
        "This is a NEWS website, not a commentary site. Write ONLY facts.\n\n"
        f"STYLE: {style['name']}\n"
        f"- Lead: {style['lead_style']}\n"
        f"- Tone: {style['tone']}\n"
        f"- Structure: {style['structure']}\n\n"
        f"WORKING TITLE: {seo.get('title','')}\n"
        f"BRIEF (facts only):\n{json.dumps(brief, ensure_ascii=False)}\n\n"
        f"{internal_links}\n\n"
        "WRITE THE ARTICLE IN PURE MARKDOWN:\n"
        "1) HARD NEWS LEAD (1-2 sentences): Who + what + where + when. "
        "Put the main actor and the action first. No opinion.\n"
        "2) BODY (4-7 short paragraphs): more facts in descending importance — "
        "what happened next, official statements with attribution, numbers, places, "
        "who confirmed what. Use past tense for completed events.\n"
        "3) Optional short closing sentence: only a scheduled next step or current status. "
        "No moral. No prediction. No commentary.\n\n"
        "HARD RULES:\n"
        "- 500 to 700 words.\n"
        "- Start with an H2 heading that is a factual news headline, then the lead paragraph.\n"
        "- Use 1 or 2 H3 subheadings that are factual labels (not opinion).\n"
        "- NO Analysis section. NO commentary. NO opinion. NO essay framing.\n"
        "- Do NOT explain why it matters. Do NOT tell the reader what to think.\n"
        "- Do NOT write meta lines about the update, the subject, or SEO.\n"
        "- NEVER use: 'is the central subject of the update', "
        "'is central to this update', 'what this means for Kenyans', "
        "'key takeaway', 'search-ready summary', or any keyword-stuffing loop.\n"
        "- Do not repeat the title inside the body as a stuffed sentence.\n"
        "- No HTML. No frontmatter. No byline.\n"
        "- No em-dashes or en-dashes. Use single hyphens only.\n"
        "- Do NOT mention competing media brands.\n"
        f"- Banned phrases: {', '.join(BANNED_PHRASES[:20])}...\n"
    )
    return gemini_call(prompt, "write")


def is_spam(text):
    if not text:
        return True
    low = text.lower()
    spam_markers = [
        "is central to this update for kenyan readers",
        "is the central subject of the update",
        "central subject of the update",
        "central to this update",
        "what this means for kenyans",
        "search-ready summary",
        "key takeaway",
        "in a significant development",
        "it remains to be seen",
        "only time will tell",
    ]
    if any(m in low for m in spam_markers):
        return True
    if re.search(r"##\s*analysis\b", text, re.I):
        return True
    words = re.findall(r"\w+", text)
    if len(words) < 300:
        return True
    return False
