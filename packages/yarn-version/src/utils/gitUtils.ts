import { UsageError } from "./UsageError";
import { execCommand } from "./execCommand";
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
