const GITHUB_OWNER = "DKTJONATHAN";
const GITHUB_REPO = "zandani";
const GITHUB_BRANCH = "main";
const SUBS_PATH = "data/subscribers.json";
const SITE = "https://zandani.co.ke";

function validEmail(raw) {
  const email = String(raw || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function ghHeaders() {
  const token = process.env.PERSONAL_GITHUB_TOKEN;
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

async function deactivate(email) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${SUBS_PATH}?ref=${GITHUB_BRANCH}`;
  const getRes = await fetch(url, { headers: ghHeaders() });
  if (getRes.status === 404) return;
  const data = await getRes.json();
  if (!getRes.ok) throw new Error(data.message || "GitHub read failed");
  const parsed = JSON.parse(Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8"));
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
    content: Buffer.from(
      JSON.stringify({ updated: new Date().toISOString(), subscribers: next }, null, 2) + "\n",
      "utf8"
    ).toString("base64"),
  };
  const put = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${SUBS_PATH}`,
    { method: "PUT", headers: ghHeaders(), body: JSON.stringify(payload) }
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", SITE);
  res.setHeader("Cache-Control", "no-store");
  const email = validEmail(req.query?.email || req.body?.email);
  if (!email) return res.status(400).json({ error: "Missing email" });
  try {
    await deactivate(email);
  } catch (e) {
    console.error("unsubscribe", e);
  }
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(thanksPage());
  }
  return res.status(200).json({ ok: true });
}
