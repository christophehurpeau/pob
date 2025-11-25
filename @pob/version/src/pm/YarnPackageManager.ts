import { execCommand } from "../utils/execCommand.ts";
import type { Workspace } from "../utils/packageUtils.ts";
import type { PackageManager } from "./PackageManager.ts";

export const YarnPackageManager: PackageManager = {
  async installOnPackageContentChange(rootWorkspace: Workspace) {
    await execCommand(rootWorkspace, ["yarn", "install"], "inherit");
  },

  async runScript(workspace: Workspace, scriptName: string) {
    await execCommand(workspace, ["yarn", "run", scriptName], "inherit");
  },

  async publish(workspace: Workspace) {
    await execCommand(workspace, ["yarn", "npm", "publish"], "inherit");
  },

  async publishWorkspaces(rootWorkspace: Workspace) {
    await execCommand(
      rootWorkspace,
      [
        "yarn",
        "workspaces",
        "foreach",
        "--all",
        "--parallel",
        "--no-private",
        "npm",
        "publish",
      ],
      "inherit",
    );
  },
};
