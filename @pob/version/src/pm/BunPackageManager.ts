import { execCommand } from "../utils/execCommand.ts";
import type { PackageManager } from "./PackageManager.ts";

export const BunPackageManager: PackageManager = {
  async install(rootWorkspace) {
    await execCommand(rootWorkspace, ["bun", "install"], "inherit");
  },

  async runScript(workspace, scriptName) {
    await execCommand(workspace, ["bun", "run", scriptName], "inherit");
  },
};
