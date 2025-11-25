import { execCommand } from "../utils/execCommand.ts";
import type { Workspace } from "../utils/packageUtils.ts";
import type { PackageManager } from "./PackageManager.ts";

export const YarnPackageManager: PackageManager = {
  async install(rootWorkspace: Workspace) {
    await execCommand(rootWorkspace, ["yarn", "install"], "inherit");
  },

  async runScript(workspace: Workspace, scriptName: string) {
    await execCommand(workspace, ["yarn", "run", scriptName], "inherit");
  },
};
