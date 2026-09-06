#!/usr/bin/env python3
"""Retune every embedded writer pipeline to short, human reporting."""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(".github/workflows")

REPLACEMENTS = [
    ("550 to 750 words", "280 to 420 words"),
    ("550-750 words", "280-420 words"),
    ("600 to 900 words", "280 to 420 words"),
    ("700 to 900 words", "280 to 420 words"),
    ("800 to 1000 words", "320 to 450 words"),
    ("at least 550 words", "about 350 words"),
    ("at least 600 words", "about 350 words"),
    ("3-6 short paragraphs", "2-4 short paragraphs"),
    ("3 to 6 short paragraphs", "2 to 4 short paragraphs"),
    ("Use 2 or 3 H3 subheadings", "Use at most one H3 if needed. Prefer no subheadings"),
    ("Use 2 or 3 H3", "Use at most one H3"),
    ("highly opinionated tone", "calm reporting tone"),
    ("pointing out the bad side of the story or the angles that the mainstream media ignores", "sticking to verified facts"),
    ("Emulate a highly opinionated tone", "Write like a news desk reporter"),
    ("sharp, cynical football pundit", "straightforward sports reporter"),
    ("cynical and authoritative", "calm and precise"),
    ("Be hard-hitting and expose the angle mainstream media ignores", "Report what happened. Keep opinion to one short closing line"),
    ("witty, sharp, and feels like an insider dropping the real gist", "plain, specific, and close to how a human reporter talks"),
    ("Reporting tone with a gossipy, insider Kenyan flavor", "Clean reporting tone"),
    ("Plugged-in Kenyan entertainment reporter. Witty, celebrity-focused", "Entertainment reporter. Factual, specific, no hype"),
    ("Professional, fast-paced, insightful analysis", "Professional, fast, factual match reporting"),
    ("insightful analysis", "clear facts"),
    ("dynamic, engaging entertainment article", "short entertainment news report"),
]

ANALYSIS_OLD = [
    '"3) ANALYSIS section under an H2 heading exactly \'Analysis\': openly labelled commentary only here.\\n\\n"',
    '"3) ANALYSIS section under an H2 heading \'Analysis\': openly labelled commentary/opinion only here.\\n\\n"',
    "3) ANALYSIS section under an H2 heading exactly 'Analysis': openly labelled commentary only here.",
    "3) ANALYSIS section under an H2 heading 'Analysis': openly labelled commentary/opinion only here.",
]

ANALYSIS_NEW = (
    "3) OPTIONAL NOTE: one short sentence at the end, no heading. "
    "This is the only place for a light observation. If you have nothing useful to add, stop after the facts."
)

VOICE_BLOCK = (
    "VOICE: Write like a working newsroom reporter, not a columnist and not an AI explainer. "
    "Short sentences. Concrete names, numbers, places, dates. No hype. No throat-clearing. "
    "Do not pad the piece to look long. Commentary must be one sentence or none.\n"
)


def strip_bom(text: str) -> str:
    return text[1:] if text.startswith("\ufeff") else text


def retune(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    for old in ANALYSIS_OLD:
        text = text.replace(old, f'"{ANALYSIS_NEW}\\n\\n"' if old.startswith('"') else ANALYSIS_NEW)
    text = re.sub(
        r"if len\(words\) < 350:",
        "if len(words) < 180:",
        text,
    )
    text = re.sub(
        r"Too thin: \{len\(words\)\} words",
        "Too thin: {len(words)} words",
        text,
    )
    if "VOICE: Write like a working newsroom reporter" not in text and "WRITE THE ARTICLE" in text:
        text = text.replace(
            "WRITE THE ARTICLE IN PURE MARKDOWN",
            "VOICE: Write like a working newsroom reporter, not a columnist. Short, human, factual. Commentary is one sentence max or none.\\nWRITE THE ARTICLE IN PURE MARKDOWN",
            1,
        )
    if "TASK: Write" in text and "VOICE: Write like a working newsroom reporter" not in text:
        text = text.replace(
            "TASK: Write",
            "VOICE: short human reporting, almost no commentary. TASK: Write",
            1,
        )
    return text


def process_file(path: pathlib.Path) -> bool:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    text = strip_bom(raw)
    name = path.name.lower()
    if not (
        "google.genai" in text
        or "genai.Client" in text
        or name.startswith("za")
        or name in {"automation.yml", "satirical-narrator.yml", "podcast-generator.yml", "eeat builder.yml", "manyuo.yml"}
    ):
        if text != raw:
            path.write_text(text, encoding="utf-8")
            return True
        return False
    new = retune(text)
    if new != raw:
        path.write_text(new, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed = []
    targets = list(ROOT.glob("*.yml")) + list(ROOT.glob("*.yaml"))
    for path in sorted(targets):
        try:
            if process_file(path):
                changed.append(path.name)
                print(f"retuned {path.name}")
            else:
                print(f"unchanged {path.name}")
        except Exception as e:
            print(f"error {path.name}: {e}")
    print("changed:", ", ".join(changed) if changed else "(none)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
