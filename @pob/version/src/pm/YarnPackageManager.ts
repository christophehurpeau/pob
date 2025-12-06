import { execCommand } from "../utils/execCommand.ts";
import type { Workspace } from "../utils/packageUtils.ts";
import type {
  PackageManager,
  PackageManagerPublishOptions,
} from "./PackageManager.ts";

export const YarnPackageManager: PackageManager = {
  async installOnPackageContentChange(rootWorkspace: Workspace) {
    await execCommand(rootWorkspace, ["yarn", "install"], "inherit");
  },

  async runScript(workspace: Workspace, scriptName: string) {
    await execCommand(workspace, ["yarn", "run", scriptName], "inherit");
  },

  async publish(workspace: Workspace, options?: PackageManagerPublishOptions) {
    const publishArgs = ["yarn", "npm", "publish"];
    if (options?.provenance) {
      publishArgs.push("--provenance");
    }
    await execCommand(workspace, publishArgs, "inherit");
  },

  async publishWorkspaces(
    rootWorkspace: Workspace,
    options?: PackageManagerPublishOptions,
  ) {
    const publishArgs = [
      "yarn",
      "workspaces",
      "foreach",
      "--all",
      "--parallel",
      "--no-private",
      "npm",
      "publish",
    ];
    if (options?.provenance) {
      publishArgs.push("--provenance");
    }
    await execCommand(rootWorkspace, publishArgs, "inherit");
  },
};
