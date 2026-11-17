import { execFileSync } from "node:child_process";
import type { PackageContext } from "../../engine/context.ts";

const isTrackedInGit = (cwd: string, path: string): boolean => {
  try {
    return (
      execFileSync("git", ["ls-files", "--", path], {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() !== ""
    );
  } catch {
    return false;
  }
};

/**
 * Plans the removal of the build directory from the git index, keeping it on
 * disk, for repositories where the build output used to be committed.
 *
 * Whether the directory is tracked is a read-only git query made while
 * planning (like the origin url of the engine): planning the effect on every
 * run would make `--check` fail on every converged repository.
 */
export const planUntrackBuild = (
  ctx: PackageContext,
  buildDirectory: string,
): void => {
  if (!isTrackedInGit(ctx.dir, buildDirectory)) return;
  ctx.effects.add({
    id: "git-untrack-build",
    reason: `${buildDirectory} is no longer committed`,
    command: `git rm -r --cached --quiet -- ${buildDirectory}`,
    run: ({ cwd }) => {
      execFileSync(
        "git",
        ["rm", "-r", "--cached", "--quiet", "--", buildDirectory],
        { cwd },
      );
      console.log(
        `removed ${buildDirectory} from git, it is no longer committed`,
      );
    },
  });
};
