#!/usr/bin/env python3
"""Keep and light-fix posts from the last 24 hours; remove all older posts.

- Uses frontmatter `date` (falls back to filename YYYY-MM-DD prefix).
- Fixed posts stay in content/posts/ with spam leads stripped.
- Older posts are deleted from content/posts/ (not moved).
"""
from __future__ import annotations

import datetime as dt
import pathlib
import re
import sys

POSTS = pathlib.Path("content/posts")
HOURS = 24

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.S)
SPAM_LEAD = re.compile(
    r"[^.\n]*is central to this update for Kenyan readers[.\s]*",
    re.I,
)
SPAM_SUBJ = re.compile(
    r"[^.\n]*is the central subject of the update[.\s]*",
    re.I,
)


def parse_date(fm: str, filename: str) -> dt.datetime | None:
    m = re.search(r'^date:\s*["\']?([^"\'\n]+)', fm, re.M)
    if m:
        raw = m.group(1).strip()
        for fmt in (
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
        ):
            try:
                return dt.datetime.strptime(raw[:19].replace("Z", ""), fmt.replace("Z", ""))
            except ValueError:
                continue
            try:
                return dt.datetime.fromisoformat(raw.replace("Z", "+00:00")).replace(tzinfo=None)
            except ValueError:
                pass
    m2 = re.match(r"(\d{4}-\d{2}-\d{2})", filename)
    if m2:
        try:
            return dt.datetime.strptime(m2.group(1), "%Y-%m-%d")
        except ValueError:
            return None
    return None


def light_fix(body: str) -> str:
    body = SPAM_LEAD.sub("", body)
    body = SPAM_SUBJ.sub("", body)
    # Drop duplicate consecutive paragraphs
    parts = re.split(r"\n\s*\n+", body.strip())
    out, seen = [], set()
    for p in parts:
        p = p.strip()
        if not p:
            continue
        key = re.sub(r"\s+", " ", p.lower())[:200]
        if key in seen:
            continue
        if "is central to this update" in key or "is the central subject of the update" in key:
            continue
        seen.add(key)
        out.append(p)
    return "\n\n".join(out).strip() + "\n"


def main() -> int:
    if not POSTS.exists():
        print("no posts dir")
        return 0

    now = dt.datetime.utcnow()
    cutoff = now - dt.timedelta(hours=HOURS)
    print(f"UTC now={now.isoformat()} cutoff={cutoff.isoformat()} (last {HOURS}h)")

    kept = deleted = fixed = 0
    no_date = []

    for path in sorted(POSTS.glob("*.md")):
        raw = path.read_text(encoding="utf-8", errors="ignore")
        m = FM_RE.match(raw)
        if not m:
            print(f"DELETE (no frontmatter): {path.name}")
            path.unlink()
            deleted += 1
            continue
        fm, body = m.group(1), m.group(2)
        when = parse_date(fm, path.name)
        if when is None:
            no_date.append(path.name)
            print(f"DELETE (no parseable date): {path.name}")
            path.unlink()
            deleted += 1
            continue

        if when >= cutoff:
            new_body = light_fix(body)
            new_raw = f"---\n{fm}\n---\n\n{new_body}"
            if new_raw != raw:
                path.write_text(new_raw, encoding="utf-8")
                fixed += 1
                print(f"FIXED (recent): {path.name} date={when.date()}")
            else:
                print(f"KEEP (recent): {path.name} date={when.date()}")
            kept += 1
        else:
            path.unlink()
            deleted += 1
            print(f"DELETE (old): {path.name} date={when.date()}")

    print(f"\nSummary: kept={kept} fixed={fixed} deleted={deleted} undated_deleted={len(no_date)}")
    if kept == 0:
        print("NOTE: No posts fell inside the last 24 hours. content/posts is empty (clean slate).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
