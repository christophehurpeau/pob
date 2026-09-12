import { execFileSync } from "node:child_process";

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
