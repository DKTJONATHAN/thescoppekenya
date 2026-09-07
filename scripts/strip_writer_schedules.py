#!/usr/bin/env python3
"""Remove schedule: blocks from content-writer workflows. Keep workflow_dispatch."""
from __future__ import annotations

import pathlib
import re

ROOT = pathlib.Path(".github/workflows")

TARGETS = [
    "za-news.yml",
    "za-ghafla.yml",
    "za-mpasho.yml",
    "za Entertainment.yml",
    "za africa.yml",
    "za agriculture.yml",
    "za business.yml",
    "za lifestyle.yml",
    "za opinions.yml",
    "za sports.yml",
    "za technology.yml",
    "za diano.yml",
    "za jaj.yml",
]

# Match on: ... through concurrency / permissions / jobs (non-greedy schedule block)
ON_BLOCK = re.compile(
    r"^on:\s*\n(?:(?:[ \t]+.*\n)|(?:\n))*?(?=^(?:concurrency|permissions|env|jobs):)",
    re.M,
)

REPLACEMENT = """on:
  # Timing owned by writer-dispatcher.yml (Africa/Nairobi)
  workflow_dispatch: {}

"""


def main() -> int:
    changed = []
    for name in TARGETS:
        path = ROOT / name
        if not path.exists():
            print(f"missing {name}")
            continue
        text = path.read_text(encoding="utf-8")
        if text.startswith("\ufeff"):
            text = text[1:]
        if "schedule:" not in text.split("jobs:")[0]:
            print(f"already clean {name}")
            continue
        new, n = ON_BLOCK.subn(REPLACEMENT, text, count=1)
        if n == 0:
            # fallback: crude line-based strip of schedule keys under on:
            lines = text.splitlines(keepends=True)
            out = []
            i = 0
            while i < len(lines):
                line = lines[i]
                if re.match(r"^on:\s*$", line):
                    out.append(line)
                    i += 1
                    # skip schedule section and its children; keep workflow_dispatch
                    while i < len(lines):
                        l = lines[i]
                        if re.match(r"^(concurrency|permissions|env|jobs):", l):
                            break
                        if re.match(r"^\s+schedule:\s*$", l):
                            i += 1
                            while i < len(lines) and (
                                re.match(r"^\s+-\s", lines[i])
                                or re.match(r"^\s+#", lines[i])
                                or re.match(r"^\s+cron:", lines[i])
                                or lines[i].strip() == ""
                            ):
                                i += 1
                            continue
                        out.append(l)
                        i += 1
                    # ensure workflow_dispatch present
                    block = "".join(out[out.index(line) :])
                    if "workflow_dispatch" not in block:
                        out.append("  workflow_dispatch: {}\n")
                    continue
                out.append(line)
                i += 1
            new = "".join(out)
            # inject comment after on:
            new = re.sub(
                r"^on:\s*\n",
                "on:\n  # Timing owned by writer-dispatcher.yml (Africa/Nairobi)\n",
                new,
                count=1,
                flags=re.M,
            )
        if new != text:
            path.write_text(new, encoding="utf-8")
            changed.append(name)
            print(f"stripped {name}")
        else:
            print(f"unchanged {name}")
    print(f"done changed={len(changed)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
