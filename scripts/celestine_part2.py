from voice_guard import news_prompt, should_skip_story, inject_know_if_missing, polish_body, model_skipped


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
    title = (seo or {}).get("title") or (brief or {}).get("summary") or ""
    body = str(brief)
    if should_skip_story(title + " " + body, "News"):
        return None
    prompt = news_prompt(
        AUTHOR_NAME, full_date_str, style, title, body,
        role="correspondent", desk="News",
    )
    if internal_links:
        prompt += f"\nInternal links to consider: {internal_links}\n"
    out = gemini_call(prompt, "write")
    if model_skipped(out):
        return None
    return polish_body(out or "")
