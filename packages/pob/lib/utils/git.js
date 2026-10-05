import { execFileSync } from "node:child_process";

/**
 * Repository name for a package name: without its scope, nor the "-monorepo"
 * suffix of monorepo roots.
 */
export const getRepoName = (pkgName) =>
  pkgName.replace(/^@[^/]+\//, "").replace(/-monorepo$/, "");

// characters allowed by GitHub in account and repository names
const validGitNameRegex = /^[\w.-]+$/;

/**
 * Parses a git remote url, or the "repository" field of a package.json.
 * Returns undefined when the url cannot come from a real remote.
 */
export const parseRepositoryUrl = (repository) => {
  const url = typeof repository === "string" ? repository : repository?.url;
  if (!url || typeof url !== "string") return undefined;

  const match = url.match(
    /^(?:git\+)?(?:git@|ssh:\/\/git@|https?:\/\/)([^./:]+)(?:\.[a-z]+)?[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/,
  );
  if (!match) return undefined;

  const [, gitHost, gitAccount, repoName] = match;
  if (
    !validGitNameRegex.test(gitAccount) ||
    !validGitNameRegex.test(repoName)
  ) {
    return undefined;
  }

  return { gitHost, gitAccount, repoName };
};

export const isTrackedInGit = (cwd, path) => {
  try {
    return (
      execFileSync("git", ["ls-files", "--", path], {
        cwd,
        encoding: "utf8",
      }).trim() !== ""
    );
  } catch {
    return false;
  }
};

/**
 * Removes a path from the git index, keeping it on disk. Used to migrate
 * repositories where the build output was committed.
 */
export const removeFromGitIndex = (cwd, path) => {
  if (!isTrackedInGit(cwd, path)) return false;

  execFileSync("git", ["rm", "-r", "--cached", "--quiet", "--", path], { cwd });
  console.log(`removed ${path} from git, it is no longer committed`);

  return true;
};
