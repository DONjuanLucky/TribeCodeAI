import { PrdStructure } from "../types";

export interface GitHubConfig {
  token: string;
  repoName: string;
  owner: string;
}

export const exportToGitHub = async (
  config: GitHubConfig,
  prd: PrdStructure,
  code: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  const { token, repoName, owner } = config;

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  try {
    // 1. Check if repo exists, if not create it
    let repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    
    if (repoResponse.status === 404) {
      const createResponse = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: repoName,
          description: `Built with TribeCode AI: ${prd.tagline}`,
          private: false,
          auto_init: true,
        }),
      });

      if (!createResponse.ok) {
        const err = await createResponse.json();
        throw new Error(err.message || "Failed to create repository");
      }
      // Wait a moment for GitHub to initialize the repo
      await new Promise(r => setTimeout(r, 2000));
    } else if (!repoResponse.ok) {
      throw new Error("Failed to verify repository existence");
    }

    // 2. Helper to create/update files
    const updateFile = async (path: string, content: string, message: string) => {
      const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
      
      // Get SHA if file exists
      const getRes = await fetch(url, { headers });
      let sha: string | undefined;
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }

      const putRes = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message,
          content: btoa(unescape(encodeURIComponent(content))),
          sha,
        }),
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(`Failed to push ${path}: ${err.message}`);
      }
    };

    // 3. Prepare PRD Markdown
    const prdMarkdown = `
# ${prd.projectName}
> ${prd.tagline}

## Summary
${prd.summary}

## Features
${prd.features.map(f => `- ${f}`).join('\n')}

## Tech Stack
${prd.techStack.map(t => `- ${t}`).join('\n')}

## Build Metadata
- Version: ${prd.version}
- Changelog: ${prd.changeLog}

---
Built with [TribeCode AI](https://github.com/your-repo-link) 🏕️
`;

    // 4. Push Files
    await updateFile("README.md", prdMarkdown, "Update PRD documentation");
    await updateFile("index.html", code, "Update prototype code");

    return { 
      success: true, 
      url: `https://github.com/${owner}/${repoName}` 
    };
  } catch (error: any) {
    console.error("GitHub Export Error:", error);
    return { success: false, error: error.message };
  }
};
