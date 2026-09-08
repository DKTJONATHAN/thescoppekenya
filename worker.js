const GSC_HTML = "google-site-verification: google4a7d26b466f41330.html\n";
const GSC_TXT = "968a6d115d3240a3acbc3448c398978d\n";

const GITHUB_OWNER = "DKTJONATHAN";
const GITHUB_REPO = "zandani";
const GITHUB_BRANCH = "main";
const SUBS_PATH = "data/subscribers.json";
const RESEND = "https://api.resend.com";
const SITE = "https://zandani.co.ke";
const FROM_DEFAULT = "Za Ndani <onboarding@resend.dev>";

function validEmail(raw) {
  const email = String(raw || "").trim().toLowerCase();
  if (email.length > 254) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": SITE,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    ...extra,
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({ "Content-Type": "application/json" }),
  });
}

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function ghHeaders(env) {
  const token = env.PERSONAL_GITHUB_TOKEN;
  if (!token) {
    const err = new Error("PERSONAL_GITHUB_TOKEN is not configured");
    err.status = 503;
    throw err;
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "zandani-subscribe",
  };
}

async function githubJson(url, init) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || `GitHub ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function readSubscribers(env) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${SUBS_PATH}?ref=${GITHUB_BRANCH}`;
  try {
    const data = await githubJson(url, { headers: ghHeaders(env) });
    const decoded = atob(String(data.content || "").replace(/\n/g, ""));
    const parsed = JSON.parse(decoded);
    const list = Array.isArray(parsed.subscribers) ? parsed.subscribers : [];
    return { sha: data.sha, subscribers: list };
  } catch (e) {
    if (e.status === 404) return { sha: null, subscribers: [] };
    throw e;
  }
}

async function writeSubscribers(env, subscribers, sha, message) {
  const payload = {
    message,
    branch: GITHUB_BRANCH,
    content: toBase64(
      JSON.stringify({ updated: new Date().toISOString(), subscribers }, null, 2) + "\n"
    ),
  };
  if (sha) payload.sha = sha;
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${SUBS_PATH}`;
  return githubJson(url, {
    method: "PUT",
    headers: ghHeaders(env),
    body: JSON.stringify(payload),
  });
}

function welcomeHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>You're on the Za Ndani evening brief</title>
</head>
<body style="margin:0;padding:0;background:#050505;color:#f3ece2;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    You're on the list. Three Kenya-first stories every evening at 19:00 EAT.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="width:100%;max-width:520px;background:#111111;">
          <tr><td style="height:3px;background:#e85d04;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <img src="${SITE}/logo.png" alt="Za Ndani" width="56" height="56" style="display:block;border:0;width:56px;height:56px;border-radius:4px;">
              <p style="margin:18px 0 6px;font-size:11px;letter-spacing:0.28em;font-weight:800;color:#e85d04;font-family:Arial,Helvetica,sans-serif;">YOU'RE ON THE LIST · EAT</p>
              <h1 style="margin:0 0 12px;font-size:30px;line-height:1.12;font-family:Georgia,'Times New Roman',serif;color:#f3ece2;font-weight:700;">The evening brief, every night at 7.</h1>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#9a9388;font-family:Arial,Helvetica,sans-serif;">
                Three Kenya-first stories. News, sport and the gossip desks. No Hollywood filler, no American morning.
              </p>
              <a href="${SITE}" style="display:inline-block;background:#e85d04;color:#050505;text-decoration:none;padding:13px 20px;font-weight:800;font-size:12px;letter-spacing:0.14em;font-family:Arial,Helvetica,sans-serif;">OPEN ZA NDANI</a>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:11px;color:#6a655c;font-family:Arial,Helvetica,sans-serif;">
                Za Ndani · Nairobi newsroom · <a href="${SITE}" style="color:#6a655c;">zandani.co.ke</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendWelcome(env, email) {
  const key = env.RESEND_API_KEY;
  if (!key) return { skipped: true };
  const from = env.RESEND_FROM || FROM_DEFAULT;
  const res = await fetch(`${RESEND}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "You're on the Za Ndani evening brief",
      html: welcomeHtml(),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || `Resend ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

async function handleSubscribe(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Enter a valid email." }, 400);
    }

    const email = validEmail(body?.email);
    if (!email) return json({ error: "Enter a valid email." }, 400);

    let saved = false;
    let already = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await readSubscribers(env);
      const existing = current.subscribers.find(
        (row) => String(row.email || "").toLowerCase() === email
      );
      if (existing && existing.active !== false) {
        already = true;
        saved = true;
        break;
      }
      const next = existing
        ? current.subscribers.map((row) =>
            String(row.email || "").toLowerCase() === email
              ? {
                  ...row,
                  active: true,
                  subscribed_at: row.subscribed_at || new Date().toISOString(),
                }
              : row
          )
        : current.subscribers.concat([
            { email, subscribed_at: new Date().toISOString(), active: true },
          ]);
      try {
        await writeSubscribers(
          env,
          next,
          current.sha,
          existing ? "newsletter: reactivate subscriber" : "newsletter: new subscriber"
        );
        saved = true;
        break;
      } catch (e) {
        if (e.status === 409 || e.status === 422) continue;
        throw e;
      }
    }

    if (!saved) {
      return json({ error: "Could not save just then. Try once more." }, 409);
    }

    if (!already) {
      try {
        await sendWelcome(env, email);
      } catch (mailErr) {
        console.error("welcome mail", mailErr);
      }
    }

    return json({
      ok: true,
      already,
      message: already
        ? "Already subscribed."
        : "Subscribed. Watch your inbox tonight at 19:00 EAT.",
    });
  } catch (error) {
    console.error("subscribe", error);
    const status = error.status === 503 ? 503 : 500;
    return json(
      {
        error:
          status === 503
            ? "Newsletter is not live yet. Add PERSONAL_GITHUB_TOKEN as a Worker secret."
            : "Could not subscribe. Try again.",
      },
      status
    );
  }
}

async function deactivate(env, email) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${SUBS_PATH}?ref=${GITHUB_BRANCH}`;
  const getRes = await fetch(url, { headers: ghHeaders(env) });
  if (getRes.status === 404) return;
  const data = await getRes.json();
  if (!getRes.ok) throw new Error(data.message || "GitHub read failed");
  const parsed = JSON.parse(atob(String(data.content || "").replace(/\n/g, "")));
  const list = Array.isArray(parsed.subscribers) ? parsed.subscribers : [];
  let changed = false;
  const next = list.map((row) => {
    if (String(row.email || "").toLowerCase() !== email) return row;
    if (row.active === false) return row;
    changed = true;
    return { ...row, active: false, unsubscribed_at: new Date().toISOString() };
  });
  if (!changed) return;
  const payload = {
    message: "newsletter: unsubscribe",
    branch: GITHUB_BRANCH,
    sha: data.sha,
    content: toBase64(
      JSON.stringify({ updated: new Date().toISOString(), subscribers: next }, null, 2) + "\n"
    ),
  };
  const put = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${SUBS_PATH}`,
    { method: "PUT", headers: ghHeaders(env), body: JSON.stringify(payload) }
  );
  if (!put.ok) {
    const body = await put.json().catch(() => ({}));
    throw new Error(body.message || "GitHub write failed");
  }
}

function thanksPage() {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribed · Za Ndani</title>
<body style="margin:0;background:#050505;color:#f3ece2;font-family:Georgia,serif;">
  <table role="presentation" width="100%"><tr><td align="center" style="padding:64px 20px;">
    <div style="height:3px;background:#e85d04;max-width:420px;margin:0 auto 28px;"></div>
    <img src="${SITE}/logo.png" alt="Za Ndani" width="48" height="48" style="display:block;margin:0 auto 20px;border:0;">
    <h1 style="margin:0 0 12px;font-size:28px;">You're off the evening brief.</h1>
    <p style="color:#9a9388;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
      We will not mail this address again. <a href="${SITE}" style="color:#e85d04;">Back to Za Ndani</a>
    </p>
  </td></tr></table>
</body>
</html>`;
}

async function handleUnsubscribe(request, env) {
  const url = new URL(request.url);
  let email = validEmail(url.searchParams.get("email"));
  if (!email && request.method === "POST") {
    try {
      const body = await request.json();
      email = validEmail(body?.email);
    } catch {
      /* ignore */
    }
  }
  if (!email) return json({ error: "Missing email" }, 400);

  try {
    await deactivate(env, email);
  } catch (e) {
    console.error("unsubscribe", e);
  }

  if (request.method === "GET") {
    return new Response(thanksPage(), {
      status: 200,
      headers: corsHeaders({ "Content-Type": "text/html; charset=utf-8" }),
    });
  }
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/google4a7d26b466f41330.html" || path === "/google4a7d26b466f41330") {
      return new Response(GSC_HTML, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-robots-tag": "noindex",
        },
      });
    }

    if (path === "/968a6d115d3240a3acbc3448c398978d.txt") {
      return new Response(GSC_TXT, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-robots-tag": "noindex",
        },
      });
    }

    if (path === "/api/subscribe") {
      return handleSubscribe(request, env);
    }

    if (path === "/api/unsubscribe") {
      return handleUnsubscribe(request, env);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
