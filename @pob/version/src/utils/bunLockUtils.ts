import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Rewrite the `version` of each entry of the `workspaces` section of a bun.lock (JSONC).
 *
 * bun replaces `workspace:` ranges with the version recorded there when packing/publishing,
 * not the one from the workspace package.json, and `bun install` never refreshes it.
 *
 * Only the text of the version values is changed, so the formatting is preserved.
 */
export const syncBunLockWorkspaceVersions = (
  lockContent: string,
  getVersion: (workspacePath: string) => string | undefined,
): string => {
  const lines = lockContent.split("\n");
  let inWorkspaces = false;
  let currentPath: string | null = null;

  return lines
    .map((line) => {
      if (!inWorkspaces) {
        if (/^ {2}"workspaces": \{\s*$/.test(line)) inWorkspaces = true;
        return line;
      }
      if (/^ {2}\}/.test(line)) {
        inWorkspaces = false;
        return line;
      }
      const pathMatch = /^ {4}("(?:[^"\\]|\\.)*"): \{\s*$/.exec(line);
      if (pathMatch) {
        currentPath = JSON.parse(pathMatch[1]!) as string;
        return line;
      }
      if (currentPath === null) return line;
      const versionMatch = /^( {6}"version": )"(?:[^"\\]|\\.)*"(,?\s*)$/.exec(
        line,
      );
      if (!versionMatch) return line;
      const newVersion = getVersion(currentPath);
      if (newVersion === undefined) return line;
      const [, prefix = "", suffix = ""] = versionMatch;
      return prefix + JSON.stringify(newVersion) + suffix;
    })
    .join("\n");
};

export const syncBunLockFile = async (rootCwd: string): Promise<void> => {
  const lockPath = path.join(rootCwd, "bun.lock");
  let content: string;
  try {
    content = await readFile(lockPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return; // legacy bun.lockb: binary, not handled
    throw error;
  }

  const workspacePaths = new Set<string>();
  syncBunLockWorkspaceVersions(content, (workspacePath) => {
    workspacePaths.add(workspacePath);
    return undefined;
  });

  const versions = new Map<string, string>();
  await Promise.all(
    [...workspacePaths].map(async (workspacePath) => {
      const pkg = JSON.parse(
        await readFile(
          path.join(rootCwd, workspacePath, "package.json"),
          "utf8",
        ),
      ) as { version?: string };
      if (pkg.version !== undefined) versions.set(workspacePath, pkg.version);
    }),
  );

  const newContent = syncBunLockWorkspaceVersions(content, (workspacePath) =>
    versions.get(workspacePath),
  );
  if (newContent !== content) await writeFile(lockPath, newContent);
};
