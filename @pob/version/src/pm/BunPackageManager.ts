import { execCommand } from "../utils/execCommand.ts";
import type {
  PackageManager,
  PackageManagerPublishOptions,
} from "./PackageManager.ts";

export const BunPackageManager: PackageManager = {
  async runScript(workspace, scriptName) {
    await execCommand(workspace, ["bun", "run", scriptName], "inherit");
  },

  async publish(workspace, options?: PackageManagerPublishOptions) {
    if (options?.provenance) {
      // Use bun pack for provenance support
      // See: https://github.com/oven-sh/bun/issues/15601
      const packResult = await execCommand(workspace, ["bun", "pack"]);
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
