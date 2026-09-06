#!/usr/bin/env python3
"""Replace retired Gemini model IDs across writer scripts and workflows."""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

NEW_LIST = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
]
NEW_INLINE = "[" + ", ".join(f'\"{m}\"' for m in NEW_LIST) + "]"

REPLACEMENTS = [
    ("gemini-1.5-pro", "gemini-3.1-pro-preview"),
    ("gemini-1.5-flash", "gemini-3.5-flash-lite"),
    ("gemini-2.0-flash-lite", "gemini-3.5-flash-lite"),
    ("gemini-2.0-flash", "gemini-3.6-flash"),
    ("gemini-2.5-pro", "gemini-2.5-pro"),
    ("gemini-2.5-flash", "gemini-2.5-flash"),
    ("gemini-3-pro-preview", "gemini-3.1-pro-preview"),
    ("gemini-3.1-flash-lite-preview", "gemini-3.5-flash-lite"),
    ("google/gemini-3-flash-preview", "google/gemini-3.8-flash"),
]

TARGETS = [
    ROOT / "scripts",
    ROOT / ".github",
    ROOT / ".github" / "workflows",
    ROOT,
]

EXTS = {".py", ".yml", ".yaml", ".ps1", ".ts", ".js", ".md"}
SKIP_NAMES = {"bump_gemini_models.py"}

LIST_RE = re.compile(
    r"((?:MODELS_TO_TRY|MODELS|models)\s*=\s*)\[[^\]]*\]",
    re.MULTILINE,
)


def should_process(path: pathlib.Path) -> bool:
    if path.name in SKIP_NAMES:
        return False
    if path.suffix.lower() not in EXTS:
        return False
    if "node_modules" in path.parts or ".git" in path.parts:
        return False
    return True


def rewrite(text: str) -> str:
    original = text
    text = LIST_RE.sub(lambda m: m.group(1) + NEW_INLINE, text)
    for old, new in REPLACEMENTS:
        if old != new:
            text = text.replace(old, new)
    return text if text != original else original


def main() -> int:
    seen = set()
    changed = []
    for folder in TARGETS:
        if not folder.exists():
            continue
        paths = [folder] if folder.is_file() else list(folder.rglob("*"))
        if folder == ROOT:
            paths = [p for p in folder.iterdir() if p.is_file()]
        for path in paths:
            if not path.is_file() or not should_process(path):
                continue
            key = str(path.resolve())
            if key in seen:
                continue
            seen.add(key)
            raw = path.read_text(encoding="utf-8", errors="ignore")
            if "gemini" not in raw.lower():
                continue
            new = rewrite(raw)
            if new != raw:
                path.write_text(new, encoding="utf-8")
                changed.append(str(path.relative_to(ROOT)))
                print(f"updated {path.relative_to(ROOT)}")
    print("changed:", ", ".join(changed) if changed else "(none)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
