// eslint-disable-next-line import/no-unresolved -- esm-only package which is not supported by import plugin.
import { Octokit } from "@octokit/rest";
import { UsageError } from "./UsageError";
import type { Workspace } from "./packageUtils";

export async function createGitHubClient(): Promise<Octokit> {
  const { GH_TOKEN, GHE_API_URL, GHE_VERSION } = process.env;

  if (!GH_TOKEN) {
    throw new UsageError(
      '"GH_TOKEN" environment variable required when "createRelease" is set to "github"',
    );
  }

  if (GHE_VERSION) {
    Octokit.plugin(
      await import(`@octokit/plugin-enterprise-rest/ghe-${GHE_VERSION}`),
    );
  }

  const options = {
    auth: `token ${GH_TOKEN}`,
  };

  if (GHE_API_URL) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    options.baseUrl = GHE_API_URL;
  }

  return new Octokit(options);
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
  return { username, reponame };
};

export const createGitRelease = async (
  githubClient: Octokit,
  parsedRepoUrl: ParsedGithubUrl,
  tag: string,
  body: string,
  prerelease: boolean,
  // eslint-disable-next-line @typescript-eslint/max-params
): Promise<void> => {
  await githubClient.repos.createRelease({
    owner: parsedRepoUrl.username,
    repo: parsedRepoUrl.reponame,
    // eslint-disable-next-line camelcase
    tag_name: tag,
    name: tag,
    body,
    draft: false,
    prerelease,
  });
};
