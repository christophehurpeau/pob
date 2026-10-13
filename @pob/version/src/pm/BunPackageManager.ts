import { syncBunLockFile } from "../utils/bunLockUtils.ts";
import { execCommand } from "../utils/execCommand.ts";
import type { Workspace } from "../utils/packageUtils.ts";
import type {
  PackageManager,
  PackageManagerPublishOptions,
} from "./PackageManager.ts";

export const BunPackageManager: PackageManager = {
  async installOnPackageContentChange(rootWorkspace: Workspace) {
    // bun does not refresh the workspace versions recorded in bun.lock, and
    // `bun pm pack` / `bun publish` use them to replace `workspace:` ranges.
    // Without this, a dependent is published with the previous version of its workspace dependency.
    await syncBunLockFile(rootWorkspace.cwd);
    // update the dependency ranges of the lockfile
    await execCommand(
      rootWorkspace,
      ["bun", "install", "--lockfile-only"],
      "inherit",
    );
  },

  async runScript(workspace, scriptName) {
    await execCommand(workspace, ["bun", "run", scriptName], "inherit");
  },

  async publish(workspace, options?: PackageManagerPublishOptions) {
    if (options?.provenance) {
      // Use bun pack for provenance support
      // See: https://github.com/oven-sh/bun/issues/15601
      const packResult = await execCommand(workspace, ["bun", "pm", "pack"]);
      // Extract .tgz filename from output (find line ending with .tgz)
      const lines = packResult.stdout.trim().split("\n");
      const tgzPath =
        lines.find((line) => line.endsWith(".tgz")) ?? lines.at(-1);
      if (!tgzPath) {
        throw new Error("Failed to extract .tgz path from bun pack output");
      }
      await execCommand(workspace, ["npm", "publish", "--provenance", tgzPath]);
    } else {
      await execCommand(workspace, ["bun", "publish"], "inherit");
    }
  },
};
