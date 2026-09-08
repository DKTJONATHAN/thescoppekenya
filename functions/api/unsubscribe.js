const GITHUB_OWNER = "DKTJONATHAN";
const GITHUB_REPO = "zandani";
const GITHUB_BRANCH = "main";
const SUBS_PATH = "data/subscribers.json";
const SITE = "https://zandani.co.ke";

function validEmail(raw) {
  const email = String(raw || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": SITE,
    "Cache-Control": "no-store",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
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
    "User-Agent": "zandani-unsubscribe",
  };
}

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
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

async function handle(context) {
  const { request, env } = context;
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
      headers: {
        ...corsHeaders(),
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }
  return json({ ok: true });
}

export async function onRequestGet(context) {
  return handle(context);
}

export async function onRequestPost(context) {
  return handle(context);
}
