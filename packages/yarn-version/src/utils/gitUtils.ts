import semver from "semver";
import { UsageError } from "./UsageError.ts";
import { execCommand, execCommandStreamStdout } from "./execCommand.ts";
import type { Workspace } from "./packageUtils.ts";

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

  return behind ? behind > 0 : false;
};

export const getDirtyFiles = async (workspace: Workspace): Promise<string> => {
  const { stdout: dirtyFiles } = await execCommand(workspace, [
    "git",
    "status",
    "--porcelain",
  ]);
  return dirtyFiles;
};

const toArray = <T>(input: T | T[]): T[] =>
  Array.isArray(input) ? input : [input];

export interface GitTagVersion {
  tag: string;
  version: string;
}

export const getGitLatestTagVersion = async (
  workspace: Workspace,
  {
    prefix,
    skipUnstable,
    since,
    from = "",
    to = "HEAD",
    path,
  }: {
    prefix?: string;
    skipUnstable?: boolean;
    since?: Date | string;
    from?: string;
    to?: string;
    path?: string[] | string;
  } = {},
): Promise<GitTagVersion | null> => {
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const tagRegex = /tag:\s*(.+?)[,)]/gi;
  for await (const chunk of execCommandStreamStdout(workspace, [
    "git",
    "log",
    "--no-color",
    "--date-order",
    "--format=%d",
    ...(since
      ? [`--since=${since instanceof Date ? since.toISOString() : since}`]
      : []),
    [from, to].filter(Boolean).join(".."),
    ...(path ? ["--", ...toArray(path)] : []),
  ])) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const matches = trimmed.matchAll(tagRegex);
    for (const match of matches) {
      const tag = match[1];
      if (!tag) continue;
      if (prefix && !tag.startsWith(prefix)) {
        continue;
      }
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

const GIT_COMMIT_SEPARATOR =
  "------------------------ >8 ------------------------";

export const getGitCommits = (
  workspace: Workspace,
  {
    path,
    from = "",
    to = "HEAD",
    format = "%B",
    reverse,
    merges,
    since,
  }: {
    format?: string;
    path?: string[] | string;
    from?: string;
    to?: string;
    reverse?: boolean;
    merges?: boolean;
    since?: Date | string;
  } = {},
) => {
  return execCommandStreamStdout(
    workspace,
    [
      "git",
      "log",
      `--format=${format}%n${GIT_COMMIT_SEPARATOR}`,
      ...(since
        ? [`--since=${since instanceof Date ? since.toISOString() : since}`]
        : []),
      ...(reverse ? ["--reverse"] : []),
      ...(merges ? ["--merges"] : []),
      ...(merges === false ? ["--no-merges"] : []),
      [from, to].filter(Boolean).join(".."),
      ...(path ? ["--", ...toArray(path)] : []),
    ],
    GIT_COMMIT_SEPARATOR,
  );
};
