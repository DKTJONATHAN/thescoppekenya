#!/usr/bin/env python3
"""Offline checks for Kenya-first skip / voice. Run: python scripts/test_voice_guard.py"""
from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice_guard import kenya_score, model_skipped, should_skip_story, strip_banned


def check(cond, msg):
    if not cond:
        print("FAIL:", msg)
        return 1
    print("ok:", msg)
    return 0


def main() -> int:
    fails = 0
    fails += check(
        should_skip_story("Rob Reiner receives posthumous Emmy nomination", "Entertainment"),
        "skip Hollywood Emmy",
    )
    fails += check(
        should_skip_story("Marvel announces new Avengers film", "Entertainment"),
        "skip Marvel",
    )
    fails += check(
        not should_skip_story("Bahati drops new album in Nairobi", "Entertainment"),
        "keep Bahati + Nairobi",
    )
    fails += check(
        not should_skip_story("Bahati reveals new song", "Gossip"),
        "keep Bahati even without the word Kenya",
    )
    fails += check(
        not should_skip_story("Westlands Expressway closed overnight after crash", "News"),
        "keep Westlands news",
    )
    fails += check(
        should_skip_story("White House brief on tariffs", "News"),
        "skip White House news",
    )
    fails += check(
        not should_skip_story("Harambee Stars beat Uganda in Kampala", "Sports"),
        "keep Harambee Stars",
    )
    fails += check(
        should_skip_story("Premier League: Arsenal thrash Chelsea", "Sports"),
        "skip Premier League",
    )
    fails += check(
        not should_skip_story("Safaricom M-Pesa users hit by outage", "Technology"),
        "keep Safaricom tech",
    )
    fails += check(
        kenya_score("Bahati") > kenya_score("Taylor Swift Grammy"),
        "Bahati scores above Taylor Swift Grammy",
    )
    fails += check(model_skipped("SKIP"), "model SKIP detected")
    fails += check(not model_skipped("# Westlands crash kills two"), "real article is not SKIP")
    cleaned = strip_banned("This ignited a nuanced conversation about Nairobi.")
    fails += check("ignited a nuanced conversation" not in cleaned.lower(), "strip banned phrase")
    if fails:
        print(f"{fails} check(s) failed")
        return 1
    print("all voice_guard checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
