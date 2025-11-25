import { execCommand } from "../utils/execCommand.ts";
import type { PackageManager } from "./PackageManager.ts";

export const BunPackageManager: PackageManager = {
  async runScript(workspace, scriptName) {
    await execCommand(workspace, ["bun", "run", scriptName], "inherit");
  },

  async publish(workspace) {
    await execCommand(workspace, ["bun", "publish"], "inherit");
  },
};
