import { UsageError } from "./UsageError.ts";
import { execCommandWithInput } from "./execCommand.ts";
import type { Workspace } from "./packageUtils.ts";

export async function ensureGhCliAvailable(
  workspace: Workspace,
): Promise<void> {
  const { GH_TOKEN } = process.env;

  if (!GH_TOKEN) {
    throw new UsageError('"GH_TOKEN" environment variable required');
  }

  try {
    // Use existing execCommand helper pattern by spawning gh --version
    // We import execCommand lazily to avoid cycles when utils are used elsewhere
    const { execCommand } = await import("./execCommand.ts");
    await execCommand(workspace, ["gh", "--version"]);
  } catch {
    throw new UsageError(
      'The "gh" CLI is required. Please install GitHub CLI: https://cli.github.com/',
    );
  }
}

interface ParsedGithubUrl {
  username: string;
  reponame: string;
}

const githubRegex = /^https?:\/\/github.com\/([^#/]+)\/([^#/]+?)(?:\.git)?$/;
export const parseGithubRepoUrl = (workspace: Workspace): ParsedGithubUrl => {
  const repository = workspace.pkg.repository;

  const url: string | undefined =
    typeof repository === "string" ? repository : repository?.url;

  if (!url) {
    throw new Error(
      "No repository URL found in manifest. Please add one and try again. https://docs.npmjs.com/cli/v9/configuring-npm/package-json#repository",
    );
  }
  const match = githubRegex.exec(url);

  if (!match) {
    throw new Error(`Invalid GitHub repository URL: "${url}"`);
  }
  const [, username, reponame] = match;
  if (!username || !reponame) {
    throw new Error(`Invalid GitHub repository URL: "${url}"`);
  }
  return { username, reponame };
};

const extractHostnameFromGheApiUrl = (gheApiUrl: string): string | null => {
  try {
    const url = new URL(gheApiUrl);
    return url.hostname || null;
  } catch {
    // fallback: try to strip protocol and path
    const m = /^https?:\/\/([^/]+)/.exec(gheApiUrl);
    return m?.[1] || null;
  }
};

export const createGhRelease = async (
  workspace: Workspace,
  opts: {
    parsedRepoUrl: ParsedGithubUrl;
    tag: string;
    body: string;
    prerelease: boolean;
  },
): Promise<void> => {
  const { parsedRepoUrl, tag, body, prerelease } = opts;

  const { GH_TOKEN, GHE_API_URL } = process.env;

  if (!GH_TOKEN) {
    await ensureGhCliAvailable(workspace);
    return;
  }

  // Determine hostname for GHE if provided
  const args: string[] = [
    "release",
    "create",
    tag,
    "--repo",
    `${parsedRepoUrl.username}/${parsedRepoUrl.reponame}`,
  ];

  if (prerelease) {
    args.push("--prerelease");
  }

  if (GHE_API_URL) {
    const hostname = extractHostnameFromGheApiUrl(GHE_API_URL);
    if (hostname) {
      args.push("--hostname", hostname);
    }
  }

  try {
    await execCommandWithInput(
      workspace,
      ["gh", ...args, "--notes-file", "-"],
      body,
    );
  } catch (error) {
    // execCommandWithInput will include stdout/stderr in its error message when strict
    throw new Error(
      `gh release create failed: ${String(error instanceof Error ? error.message : error)}`,
    );
  }
};
