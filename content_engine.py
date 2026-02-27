import os
import re
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# ==========================================
# CONFIGURATION & API KEYS
# ==========================================
# Make sure to set these in your environment variables or GitHub Actions Secrets
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "your_unsplash_key_here")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "your_gemini_key_here")

# Define regions based on standard country prefixes
REGIONS = {
    "West Africa": ["Nigeria", "Ghana", "Senegal", "Liberia", "Mali", "Cote d'Ivoire", "Ivory Coast", "Sierra Leone", "Gambia", "Togo", "Benin", "Burkina Faso", "Niger", "Guinea"],
    "East Africa": ["Kenya", "Uganda", "Tanzania", "Rwanda", "Burundi", "Ethiopia", "Somalia", "Djibouti", "Eritrea", "Sudan", "South Sudan", "Seychelles"],
    "South Africa": ["South Africa", "Zimbabwe", "Botswana", "Namibia", "Zambia", "Malawi", "Angola", "Mozambique", "Lesotho", "Eswatini", "Madagascar"]
}

# Map regions to your frontend categories
CATEGORY_MAP = {
    "West Africa": "Entertainment",
    "East Africa": "Entertainment",
    "South Africa": "Entertainment"
}

def get_region_from_title(title):
    if ":" in title:
        country_prefix = title.split(":")[0].strip()
        for region, countries in REGIONS.items():
            if country_prefix in countries:
                return region
    return "Other"

def fetch_unsplash_image(keyword):
    """Fetches a high quality image from Unsplash based on the AI keyword."""
    print(f"Searching Unsplash for: {keyword}")
    url = f"https://api.unsplash.com/search/photos?query={keyword}&per_page=1&orientation=landscape"
    headers = {
        "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data["results"]:
                # Grab the regular sized image URL
                return data["results"][0]["urls"]["regular"]
    except Exception as e:
        print(f"Unsplash API error: {e}")
        
    return "/placeholder.svg"

def process_content_with_ai(article_text, region):
    """Uses Gemini to rewrite the article and extract an Unsplash keyword."""
    print("Sending article to AI for rewrite and keyword extraction...")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""
    You are an entertainment journalist writing for a Kenyan gossip and entertainment site (The Scoop Kenya / Za Ndani).
    Read the following {region} entertainment news article.
    
    Tasks:
    1. Rewrite the article to be engaging, original, and suited for a young African audience.
    2. Write a catchy, click-worthy title.
    3. Identify the main celebrity, artist, or subject in the text and provide a 1 to 2 word search keyword for an image database (e.g., 'Wizkid', 'Concert crowd', 'Nairobi').
    
    Return the response strictly as a JSON object with exactly these keys: 'title', 'keyword', 'rewritten_body'.
    
    Article Text:
    {article_text[:4000]}
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            ai_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(ai_text)
    except Exception as e:
        print(f"AI Processing error: {e}")
        
    return None

def save_as_markdown(data, region):
    """Saves the rewritten article as a standard Markdown file with frontmatter."""
    # Ensure the content/posts directory exists
    output_dir = os.path.join(os.getcwd(), "content", "posts")
    os.makedirs(output_dir, exist_ok=True)
    
    # Create a safe slug from the title
    clean_title = re.sub(r'[^a-zA-Z0-9\s]', '', data['title']).lower()
    slug = clean_title.replace(' ', '-')
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    file_path = os.path.join(output_dir, f"{slug}.md")
    
    # Build the frontmatter exactly how your parseFrontmatter function expects it
    markdown_content = f"""---
title: "{data['title']}"
slug: "{slug}"
excerpt: "{data['rewritten_body'][:150]}..."
image: "{data['image_url']}"
category: "{CATEGORY_MAP.get(region, 'Entertainment')}"
author: "The Scoop Kenya"
date: "{date_str}"
tags: [{region.replace(' ', '')}, Entertainment, Trending]
featured: false
---

{data['rewritten_body']}
"""

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    
    print(f"Saved new post: {file_path}")

def scrape_and_generate():
    base_url = "https://allafrica.com"
    arts_url = f"{base_url}/arts/"
    headers = {"User-Agent": "Mozilla/5.0"}

    print(f"Fetching main page: {arts_url}")
    try:
        response = requests.get(arts_url, headers=headers)
        soup = BeautifulSoup(response.content, "html.parser")
    except Exception as e:
        print(f"Failed to load AllAfrica: {e}")
        return

    story_links = soup.select(".stories .story a")
    processed_urls = set()

    # Limit to processing 5 articles per run to save API costs and time
    articles_processed = 0
    max_articles = 5

    for link in story_links:
        if articles_processed >= max_articles:
            break
            
        href = link.get("href")
        if not href or not href.startswith("/stories/"):
            continue
            
        full_article_url = f"{base_url}{href}"
        if full_article_url in processed_urls:
            continue
            
        processed_urls.add(full_article_url)
        print(f"\nProcessing: {full_article_url}")

        try:
            article_res = requests.get(full_article_url, headers=headers)
            article_soup = BeautifulSoup(article_res.content, "html.parser")

            title_meta = article_soup.find("meta", property="og:title")
            raw_title = title_meta.get("content", "").strip() if title_meta else ""
            region = get_region_from_title(raw_title)

            if region == "Other":
                print("Not an East, West, or South African story. Skipping.")
                continue

            story_div = article_soup.find("div", class_="story-body")
            if not story_div:
                continue
                
            paragraphs = story_div.find_all("p")
            article_body = "\n\n".join([p.text.strip() for p in paragraphs if p.text.strip()])

            if len(article_body) < 300:
                print("Article too short. Skipping.")
                continue

            # Step 1: Send to AI for rewriting and keyword extraction
            ai_result = process_content_with_ai(article_body, region)
            if not ai_result:
                continue

            # Step 2: Fetch image from Unsplash using the AI keyword
            image_url = fetch_unsplash_image(ai_result.get("keyword", "African celebrity"))

            # Step 3: Save directly to the frontend's markdown folder
            post_data = {
                "title": ai_result["title"],
                "rewritten_body": ai_result["rewritten_body"],
                "image_url": image_url
            }
            
            save_as_markdown(post_data, region)
            articles_processed += 1

        except Exception as e:
            print(f"Failed to process {full_article_url}. Error: {e}")

if __name__ == "__main__":
    scrape_and_generate()