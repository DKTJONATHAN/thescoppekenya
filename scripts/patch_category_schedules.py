#!/usr/bin/env python3
"""Patch schedule crons in category workflows to EAT-aligned slots.

Does not touch hourly news/entertainment dispatchers.
"""
from __future__ import annotations

import pathlib
import re

ROOT = pathlib.Path(".github/workflows")

# path relative name -> full replacement for the schedule block inside `on:`
PATCHES = {
    "za Entertainment.yml": """on:
  schedule:
    # Reduced native schedule — hourly dispatch is za-entertainment-hourly.yml
    # Keep one midday safety slot 14:35 EAT (11:35 UTC)
    - cron: '35 11 * * *'
  workflow_dispatch: {}
""",
    "za business.yml": """on:
  schedule:
    # Business 08:10 EAT
    - cron: '10 5 * * *'
  workflow_dispatch: {}
""",
    "za sports.yml": """on:
  schedule:
    # Sports 13:19 EAT
    - cron: '19 10 * * *'
  workflow_dispatch: {}
""",
    "za lifestyle.yml": """on:
  schedule:
    # Lifestyle 10:14 EAT
    - cron: '14 7 * * *'
  workflow_dispatch: {}
""",
    "za technology.yml": """on:
  schedule:
    # Technology 14:20 EAT
    - cron: '20 11 * * *'
  workflow_dispatch: {}
""",
    "za agriculture.yml": """on:
  schedule:
    # Agriculture 07:09 EAT
    - cron: '9 4 * * *'
  workflow_dispatch: {}
""",
    "za opinions.yml": """on:
  schedule:
    # Opinions 12:17 EAT
    - cron: '17 9 * * *'
  workflow_dispatch: {}
""",
    "za ghafla.yml": """on:
  schedule:
    # Gossip 09:12 EAT
    - cron: '12 6 * * *'
  workflow_dispatch: {}
""",
    "za mpasho.yml": """on:
  schedule:
    # Showbiz 11:15 EAT
    - cron: '15 8 * * *'
  workflow_dispatch: {}
""",
    "za africa.yml": """on:
  schedule:
    # Pan-Africa 06:08 EAT
    - cron: '8 3 * * *'
  workflow_dispatch: {}
""",
    "za diano.yml": """on:
  schedule:
    # George Diano 15:11 EAT
    - cron: '11 12 * * *'
  workflow_dispatch: {}
""",
}

ON_RE = re.compile(
    r"^on:\n(?:  .*(?:\n|$))*?(?=\n(?:concurrency|permissions|env|jobs):)",
    re.M,
)


def strip_bom(text: str) -> str:
    if text.startswith("\ufeff"):
        return text[1:]
    return text


def main() -> int:
    changed = 0
    for name, new_on in PATCHES.items():
        path = ROOT / name
        if not path.exists():
            print(f"skip missing {name}")
            continue
        raw = strip_bom(path.read_text(encoding="utf-8", errors="ignore"))
        m = ON_RE.search(raw)
        if not m:
            print(f"no on: block matched in {name}")
            continue
        updated = raw[: m.start()] + new_on.rstrip() + "\n" + raw[m.end() :]
        if updated != raw:
            path.write_text(updated, encoding="utf-8")
            print(f"patched {name}")
            changed += 1
        else:
            print(f"unchanged {name}")
    print(f"done, changed={changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
