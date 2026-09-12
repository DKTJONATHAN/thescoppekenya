/**
 * POST /api/push-subscribe
 * Body: { endpoint, keys: { p256dh, auth }, userAgent? }
 * Stores browser push subscriptions in data/push_subscriptions.json via GitHub.
 */
const GITHUB_OWNER = "DKTJONATHAN";
const GITHUB_REPO = "zandani";
const GITHUB_BRANCH = "main";
const SUBS_PATH = "data/push_subscriptions.json";
const SITE = "https://zandani.co.ke";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": SITE,
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
    "User-Agent": "zandani-push-subscribe",
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

async function readSubs(env) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${SUBS_PATH}?ref=${GITHUB_BRANCH}`;
  try {
    const data = await githubJson(url, { headers: ghHeaders(env) });
    const decoded = atob(String(data.content || "").replace(/\n/g, ""));
    const parsed = JSON.parse(decoded);
    const list = Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [];
    return { sha: data.sha, subscriptions: list };
  } catch (e) {
    if (e.status === 404) return { sha: null, subscriptions: [] };
    throw e;
  }
}

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function writeSubs(env, subscriptions, sha, message) {
  const payload = {
    message,
    branch: GITHUB_BRANCH,
    content: toBase64(
      JSON.stringify({ updated: new Date().toISOString(), subscriptions }, null, 2) + "\n"
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

function validSub(body) {
  const endpoint = String(body?.endpoint || "").trim();
  const p256dh = String(body?.keys?.p256dh || "").trim();
  const auth = String(body?.keys?.auth || "").trim();
  if (!endpoint.startsWith("https://") || endpoint.length > 2048) return null;
  if (!p256dh || !auth || p256dh.length > 512 || auth.length > 256) return null;
  return {
    endpoint,
    keys: { p256dh, auth },
    userAgent: String(body?.userAgent || "").slice(0, 240) || undefined,
    createdAt: new Date().toISOString(),
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const sub = validSub(body);
    if (!sub) return json({ error: "Invalid subscription" }, 400);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await readSubs(env);
      const idx = current.subscriptions.findIndex((s) => s.endpoint === sub.endpoint);
      let next;
      if (idx >= 0) {
        next = current.subscriptions.slice();
        next[idx] = { ...current.subscriptions[idx], ...sub, updatedAt: new Date().toISOString() };
      } else {
        // Cap store size — keep newest 5000
        next = current.subscriptions.concat([sub]).slice(-5000);
      }
      try {
        await writeSubs(
          env,
          next,
          current.sha,
          idx >= 0 ? "push: refresh subscription" : "push: new subscription"
        );
        return json({ ok: true });
      } catch (e) {
        if (e.status === 409 || e.status === 422) continue;
        throw e;
      }
    }
    return json({ error: "Conflict — try again" }, 409);
  } catch (error) {
    console.error("push-subscribe", error);
    const status = error.status === 503 ? 503 : 500;
    return json(
      {
        error:
          status === 503
            ? "Push not configured (PERSONAL_GITHUB_TOKEN)."
            : "Could not save subscription.",
      },
      status
    );
  }
}

/** DELETE — remove a subscription by endpoint */
export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const endpoint = String(body?.endpoint || "").trim();
    if (!endpoint) return json({ error: "endpoint required" }, 400);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await readSubs(env);
      const next = current.subscriptions.filter((s) => s.endpoint !== endpoint);
      if (next.length === current.subscriptions.length) {
        return json({ ok: true, removed: false });
      }
      try {
        await writeSubs(env, next, current.sha, "push: remove subscription");
        return json({ ok: true, removed: true });
      } catch (e) {
        if (e.status === 409 || e.status === 422) continue;
        throw e;
      }
    }
    return json({ error: "Conflict" }, 409);
  } catch (error) {
    console.error("push-unsubscribe", error);
    return json({ error: "Could not remove subscription." }, 500);
  }
}
