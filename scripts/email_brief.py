#!/usr/bin/env python3
"""Za Ndani evening brief via Resend.

Subscribers live in data/subscribers.json. Send layer is Resend
(RESEND_API_KEY). Do not print full addresses in logs.
"""
from __future__ import annotations

import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from email.utils import parseaddr
from html import escape

EAT = timezone(timedelta(hours=3))
SITE = "https://zandani.co.ke"
LOGO = f"{SITE}/logo.png"
POSTS = pathlib.Path("content/posts")
SUBS_FILE = pathlib.Path("data/subscribers.json")
RESEND = "https://api.resend.com"
FROM_DEFAULT = "Za Ndani <onboarding@resend.dev>"


def eat_now() -> datetime:
    return datetime.now(EAT)


def mask(email: str) -> str:
    if "@" not in email:
        return "***"
    name, domain = email.split("@", 1)
    keep = name[:1] if name else "*"
    return f"{keep}***@{domain}"


def split_fm(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    meta: dict[str, str] = {}
    for line in parts[1].splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        meta[k.strip()] = v.strip().strip('"').strip("'")
    return meta, parts[2]


def kenya_score(blob: str) -> int:
    t = blob.lower()
    score = 0
    for w in (
        "kenya", "kenyan", "nairobi", "mombasa", "kisumu", "ruto", "safaricom",
        "harambee", "iebc", "county", "gachagua", "westlands", "nakuru",
    ):
        if w in t:
            score += 4
    if any(w in t for w in ("hollywood", "netflix", "marvel", "oscar", "grammy", "emmy")):
        score -= 6
    return score


def load_today_posts(limit: int = 3) -> list[dict]:
    cutoff = eat_now() - timedelta(hours=30)
    rows: list[dict] = []
    if not POSTS.exists():
        return []
    for path in POSTS.glob("*.md"):
        text = path.read_text(encoding="utf-8", errors="replace")
        meta, body = split_fm(text)
        raw_date = meta.get("date") or meta.get("dateModified") or ""
        try:
            dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
        except ValueError:
            continue
        if dt.astimezone(EAT) < cutoff:
            continue
        title = meta.get("title") or path.stem
        slug = meta.get("slug") or path.stem
        excerpt = (meta.get("excerpt") or meta.get("description") or body.strip()[:180]).strip()
        excerpt = re.sub(r"\s+", " ", excerpt)[:180]
        cat = meta.get("category") or "News"
        image = meta.get("image") or LOGO
        hours_old = (eat_now() - dt.astimezone(EAT)).total_seconds() / 3600
        score = kenya_score(f"{title} {excerpt} {cat}") + max(0, 10 - int(hours_old))
        if cat.lower() in {"news", "politics"}:
            score += 3
        rows.append({
            "title": title,
            "slug": slug,
            "excerpt": excerpt,
            "category": cat,
            "image": image,
            "url": f"{SITE}/article/{slug}",
            "score": score,
            "date": dt,
        })
    rows.sort(key=lambda r: (-r["score"], -r["date"].timestamp()))
    return rows[:limit]


def story_card(post: dict, index: int) -> str:
    img = escape(post["image"])
    title = escape(post["title"])
    excerpt = escape(post["excerpt"])
    cat = escape(post["category"].upper())
    url = escape(post["url"])
    n = f"{index:02d}"
    return f"""
      <tr>
        <td style="padding:0 0 28px 0;">
          <a href="{url}" style="text-decoration:none;color:#f3ece2;">
            <img src="{img}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:220px;object-fit:cover;border:0;background:#111;">
          </a>
          <p style="margin:14px 0 6px;font-size:11px;letter-spacing:0.22em;font-weight:800;color:#e85d04;font-family:Arial,Helvetica,sans-serif;">{n} · {cat}</p>
          <h2 style="margin:0 0 8px;font-size:22px;line-height:1.25;font-family:Georgia,'Times New Roman',serif;font-weight:700;color:#f3ece2;">
            <a href="{url}" style="color:#f3ece2;text-decoration:none;">{title}</a>
          </h2>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#9a9388;font-family:Arial,Helvetica,sans-serif;">{excerpt}</p>
          <a href="{url}" style="display:inline-block;border:1px solid #e85d04;color:#e85d04;text-decoration:none;padding:8px 14px;font-size:11px;letter-spacing:0.16em;font-weight:800;font-family:Arial,Helvetica,sans-serif;">READ THE STORY</a>
        </td>
      </tr>"""


def unsub_url(email: str) -> str:
    return f"{SITE}/api/unsubscribe?email={urllib.parse.quote(email)}"


def brief_html(posts: list[dict], email: str = "") -> str:
    day = eat_now().strftime("%A, %-d %B %Y")
    cards = "\n".join(story_card(p, i + 1) for i, p in enumerate(posts)) or """
      <tr><td style="color:#9a9388;font-family:Arial,Helvetica,sans-serif;font-size:14px;padding-bottom:24px;">The desk is quiet tonight. We'll be back tomorrow.</td></tr>
    """
    unsub = ""
    if email:
        unsub = f'<a href="{escape(unsub_url(email))}" style="color:#6a655c;">Unsubscribe</a> · '
    lead = escape(posts[0]["title"]) if posts else "Tonight from Nairobi"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Za Ndani evening brief</title>
</head>
<body style="margin:0;padding:0;background:#050505;color:#f3ece2;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{lead} — three stories Kenya should not sleep on.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background:#050505;">
          <tr><td style="height:3px;background:#e85d04;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px 12px 18px;text-align:left;">
              <img src="{LOGO}" alt="Za Ndani" width="56" height="56" style="display:block;border:0;width:56px;height:56px;border-radius:4px;">
              <p style="margin:16px 0 4px;font-size:11px;letter-spacing:0.28em;font-weight:800;color:#e85d04;font-family:Arial,Helvetica,sans-serif;">EVENING BRIEF · EAT</p>
              <h1 style="margin:0;font-size:32px;line-height:1.05;font-family:Georgia,'Times New Roman',serif;color:#f3ece2;">Three stories Kenya should not sleep on.</h1>
              <p style="margin:12px 0 0;font-size:13px;color:#6a655c;font-family:Arial,Helvetica,sans-serif;">{escape(day)} · Nairobi</p>
            </td>
          </tr>
          {cards}
          <tr>
            <td style="padding:8px 12px 32px;border-top:1px solid #262626;">
              <p style="margin:18px 0 8px;font-size:13px;color:#9a9388;font-family:Arial,Helvetica,sans-serif;">
                Za Ndani — from within. Nairobi newsroom. One brief, 19:00 EAT.
              </p>
              <p style="margin:0;font-size:11px;color:#6a655c;font-family:Arial,Helvetica,sans-serif;">
                {unsub}<a href="{SITE}" style="color:#6a655c;">zandani.co.ke</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def welcome_html() -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#050505;color:#f3ece2;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="width:100%;max-width:480px;background:#111111;">
          <tr><td style="height:3px;background:#e85d04;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px 28px 36px;">
              <img src="{LOGO}" alt="Za Ndani" width="56" height="56" style="display:block;border:0;border-radius:4px;">
              <p style="margin:18px 0 6px;font-size:11px;letter-spacing:0.28em;font-weight:800;color:#e85d04;font-family:Arial,Helvetica,sans-serif;">YOU'RE ON THE LIST · EAT</p>
              <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;font-family:Georgia,'Times New Roman',serif;">The evening brief, every night at 7.</h1>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#9a9388;font-family:Arial,Helvetica,sans-serif;">
                Three Kenya-first stories. No Hollywood filler. Sent at 19:00 East Africa Time.
              </p>
              <a href="{SITE}" style="display:inline-block;background:#e85d04;color:#050505;text-decoration:none;padding:12px 18px;font-weight:800;font-size:12px;letter-spacing:0.14em;font-family:Arial,Helvetica,sans-serif;">OPEN ZA NDANI</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def api_key() -> str:
    key = (os.environ.get("RESEND_API_KEY") or "").strip()
    if not key:
        raise SystemExit("RESEND_API_KEY is missing")
    return key


def resend(method: str, path: str, payload: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        RESEND + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {api_key()}",
            "Content-Type": "application/json",
            # Resend requires a User-Agent; bare urllib defaults can trip CF 1010.
            "User-Agent": "zandani-evening-brief/1.0 (+https://zandani.co.ke)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Resend {method} {path} -> {e.code}: {body}") from e


def from_addr() -> str:
    return (os.environ.get("RESEND_FROM") or "").strip() or FROM_DEFAULT


def list_contacts() -> list[str]:
    if not SUBS_FILE.exists():
        print("no subscribers file")
        return []
    data = json.loads(SUBS_FILE.read_text(encoding="utf-8"))
    out: list[str] = []
    for row in data.get("subscribers") or []:
        if not isinstance(row, dict) or row.get("active") is False:
            continue
        em = parseaddr(str(row.get("email") or ""))[1].lower().strip()
        if "@" in em and "." in em.split("@")[-1]:
            out.append(em)
    return sorted(set(out))


def send_one(to: str, subject: str, html: str) -> None:
    resend("POST", "/emails", {
        "from": from_addr(),
        "to": [to],
        "subject": subject,
        "html": html,
        "headers": {
            "X-Entity-Ref-ID": f"zandani-{eat_now().strftime('%Y%m%d')}-{to}",
        },
    })


def cmd_welcome(email: str) -> int:
    email = parseaddr(email)[1].lower().strip()
    send_one(email, "You're on the Za Ndani evening brief", welcome_html())
    print(f"welcome sent to {mask(email)}")
    return 0


def cmd_digest() -> int:
    posts = load_today_posts(3)
    people = list_contacts()
    print(f"digest posts={len(posts)} subscribers={len(people)}")
    print(f"from={from_addr()}")
    for p in posts:
        print(f"  - {p['category']}: {p['title']}")
    if not people:
        print("No active subscribers yet")
        return 0
    subject = "Za Ndani evening brief: " + (posts[0]["title"] if posts else eat_now().strftime("%-d %B"))
    sent = 0
    failed = 0
    for em in people:
        try:
            send_one(em, subject, brief_html(posts, em))
            sent += 1
            time.sleep(0.55)
        except Exception as e:
            failed += 1
            print(f"fail {mask(em)}: {e}", file=sys.stderr)
    print(f"sent={sent} failed={failed}")
    return 0 if failed == 0 else 1


def main(argv: list[str]) -> int:
    if len(argv) >= 3 and argv[1] == "welcome":
        return cmd_welcome(argv[2])
    if len(argv) >= 2 and argv[1] == "digest":
        return cmd_digest()
    if len(argv) >= 2 and argv[1] == "preview":
        posts = load_today_posts(3)
        out = pathlib.Path("/tmp/zandani-brief.html")
        out.write_text(brief_html(posts, "preview@zandani.co.ke"), encoding="utf-8")
        print("wrote", out, [p["title"] for p in posts])
        return 0
    print("usage: email_brief.py digest | welcome EMAIL | preview")
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
