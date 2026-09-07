#!/usr/bin/env python3
"""Offline checks for Kenya-first skip / voice. Run: python scripts/test_voice_guard.py"""
from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice_guard import kenya_score, model_skipped, should_skip_story, strip_banned, is_spam, news_prompt


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

    body = (
        "# KURA shuts Westlands Exit overnight\n\n"
        "Kenya Urban Roads Authority closed Westlands Exit after a tanker spill on Sunday night.\n\n"
        "### What we know\n\n"
        "- Closure began at 11pm EAT.\n"
        "- Diversion via Waiyaki Way and Riverside Drive.\n"
        "- Two lanes are due to reopen Monday morning.\n\n"
        "Traffic backed up past Chiromo. Matatus used the old Waiyaki service lane.\n\n"
        "Police said the tanker driver was unhurt. KURA crews were still on site at midnight.\n\n"
        "County officers in Westlands asked office blocks to stagger reporting time.\n\n"
        "### Why it matters\n\n"
        "This is the third night closure on that interchange in a month. Parklands office workers already lose forty minutes. "
        "If KURA keeps treating the exit as a weekend workshop, morning fares will climb before month end. "
        "The story is not the spill. It is a road that cannot take a repair without stalling half of Nairobi. "
        "Commuters from Kangemi already budget an extra hour. School vans from Parklands leave at dawn to beat the jam. "
        "Traders at Westlands roundabout lose the breakfast rush when the exit is dark. "
        "KURA has not published a repair calendar. Drivers find out from WhatsApp groups at 10pm. "
        "A city that cannot say when a junction will open is a city that treats time as cheap. "
        "Westlands is not a side road. It is how half of Nairobi goes to work."
    )
    fails += check(not is_spam(body), "commentary piece is not spam")
    prompt = news_prompt(
        "Celestine Nzioka",
        "Monday, September 07, 2026",
        {"name": "Desk Take", "lead_style": "x", "tone": "y", "structure": "z", "commentary_heading": "The take"},
        "Westlands Exit shut",
        "source",
    )
    fails += check("Report, then comment" in prompt, "prompt mixes reporting and commentary")
    fails += check("NO commentary essays" not in prompt, "prompt no longer bans commentary")
    if fails:
        print(f"{fails} check(s) failed")
        return 1
    print("all voice_guard checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
