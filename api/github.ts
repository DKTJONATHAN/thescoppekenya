// api/github.ts
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, path, content, message, sha } = req.body;
  
  const GITHUB_OWNER = "DKTJONATHAN";
  const GITHUB_REPO = "thescoppekenya";
  const GITHUB_BRANCH = "main";
  
  // Notice we use the exact secret name here, no VITE_ prefix needed
  const GITHUB_TOKEN = process.env.PERSONAL_GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "GitHub token is not configured on the server." });
  }

  try {
    const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    if (action === 'GET_SHA') {
      const response = await fetch(`${baseUrl}?ref=${GITHUB_BRANCH}`, { headers });
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ sha: data.sha });
      }
      return res.status(404).json({ sha: null });
    }

    if (action === 'PUSH') {
      const body: any = { message, content, branch: GITHUB_BRANCH };
      if (sha) body.sha = sha;

      const response = await fetch(baseUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to push to GitHub");
      }
      return res.status(200).json(await response.json());
    }

    if (action === 'DELETE') {
      const body = { message, sha, branch: GITHUB_BRANCH };
      const response = await fetch(baseUrl, {
        method: "DELETE",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to delete from GitHub");
      }
      return res.status(200).json(await response.json());
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (error: any) {
    console.error("GitHub API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}