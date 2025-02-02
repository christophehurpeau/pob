import semver from "semver";
import { UsageError } from "./UsageError";
import { execCommand, execCommandStreamStdout } from "./execCommand";
import type { Workspace } from "./packageUtils";

export const getGitCurrentBranch = async (
  workspace: Workspace,
): Promise<string> => {
  const { stdout } = await execCommand(workspace, [
    "git",
    "rev-parse",
    "--abbrev-ref",
    "HEAD",
  ]);
  const currentBranch = stdout.trim();

  if (currentBranch === "HEAD") {
    throw new UsageError("HEAD is detached. Please checkout a branch.");
  }

  return currentBranch;
};

export const createGitCommit = async (
  workspace: Workspace,
  commitMessage: string,
): Promise<void> => {
  await execCommand(workspace, ["git", "add", "-A"]);

  await execCommand(workspace, [
    "git",
    "commit",
    "--no-verify",
    "-m",
    commitMessage,
  ]);
};

export const createGitTag = async (
  workspace: Workspace,
  newTag: string,
): Promise<void> => {
  await execCommand(workspace, ["git", "tag", newTag, "-m", newTag]);
};

export const pushCommitsAndTags = async (
  workspace: Workspace,
  gitRemote: string,
  currentBranch: string,
): Promise<void> => {
  await execCommand(workspace, [
    "git",
    "push",
    "--follow-tags",
    "--no-verify",
    "--atomic",
    gitRemote,
    currentBranch,
  ]);
};

export const isBehindRemote = async (
  workspace: Workspace,
  gitRemote: string,
  currentBranch: string,
): Promise<boolean> => {
  await execCommand(workspace, ["git", "remote", "update", gitRemote]);
  const { stdout } = await execCommand(workspace, [
    "git",
    "rev-list",
    "--left-right",
    "--count",
    `${gitRemote}/${currentBranch}..${currentBranch}`,
  ]);

  const [behind] = stdout.split("\t").map((val) => parseInt(val, 10));

  return behind > 0;
};

export const getDirtyFiles = async (workspace: Workspace): Promise<string> => {
  const { stdout: dirtyFiles } = await execCommand(workspace, [
    "git",
    "status",
    "--porcelain",
  ]);
  return dirtyFiles;
};

// TODO fix this method as it is not safe : it sorts by creator date and does not look for real commits order.
// Also we could avoid this method and just look for previous commits (for the changelog) until we find a valid tag.
// eslint-disable-next-line complexity
export const getGitLatestTagVersion = async (
  workspace: Workspace,
  currentBranch: string,
  {
    prefix,
    skipUnstable,
  }: {
    prefix?: string;
    skipUnstable?: boolean;
  } = {},
): Promise<{ tag: string; version: string } | null> => {
  for await (const tag of execCommandStreamStdout(workspace, [
    "git",
    "tag",
    "--merged",
    currentBranch,
    // - means reverse order
    "--sort=-creatordate",
    ...(prefix ? ["--list", `${prefix}*`] : []),
  ])) {
    if (tag) {
      const version = prefix ? tag.slice(prefix.length) : tag;
      if (!semver.valid(version)) {
        continue;
      }
      if (skipUnstable && semver.prerelease(version)) {
        continue;
      }
      return { tag, version };
    }
  }

  return null;
};
