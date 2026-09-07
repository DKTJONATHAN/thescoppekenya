"""Post-write gate: polish SEO, inject What we know on hard news only, drop Hollywood."""
from __future__ import annotations

import pathlib
import subprocess
import sys
import time

from voice_guard import is_spam, polish_body, should_skip_story

POSTS = pathlib.Path("content/posts")
MAX_AGE_SEC = 40 * 60


def split_fm(text: str):
    if not text.startswith("---"):
        return "", text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return "", text
    return parts[1], parts[2]


def category_of(fm: str) -> str:
    for line in fm.splitlines():
        if line.lower().startswith("category:"):
            return line.split(":", 1)[1].strip().strip('"').strip("'")
    return "News"


def title_of(fm: str) -> str:
    for line in fm.splitlines():
        if line.lower().startswith("title:"):
            return line.split(":", 1)[1].strip().strip('"').strip("'")
    return ""


def main() -> int:
    now = time.time()
    if not POSTS.exists():
        print("No posts dir")
        return 0
    polish = pathlib.Path("scripts/polish_new_posts.py")
    if polish.exists():
        subprocess.run([sys.executable, str(polish)], check=False)

    dropped = 0
    touched = 0
    for path in POSTS.glob("*.md"):
        if now - path.stat().st_mtime > MAX_AGE_SEC:
            continue
        text = path.read_text(encoding="utf-8")
        fm, body = split_fm(text)
        cat = category_of(fm)
        title = title_of(fm)
        blob = title + "\n" + body
        if should_skip_story(blob, cat) and cat.lower() not in {"opinions", "opinion"}:
            print(f"DROP not Kenya-first: {path.name}")
            path.unlink()
            dropped += 1
            continue
        cleaned = polish_body(body, cat, title)
        if is_spam(cleaned, min_words=180) and cat.lower() not in {"opinions"}:
            print(f"DROP spam/thin: {path.name}")
            path.unlink()
            dropped += 1
            continue
        if cleaned != body:
            path.write_text("---" + fm + "---\n" + cleaned.lstrip("\n"), encoding="utf-8")
            touched += 1
    print(f"finish_desk: touched={touched} dropped={dropped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
