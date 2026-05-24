import { execCommand } from "../utils/execCommand.ts";
import type {
  PackageManager,
  PackageManagerPublishOptions,
} from "./PackageManager.ts";

export const PnpmPackageManager: PackageManager = {
  async runScript(workspace, scriptName) {
    await execCommand(workspace, ["pnpm", "run", scriptName], "inherit");
  },

  async publish(workspace, options?: PackageManagerPublishOptions) {
    if (options?.provenance) {
      await execCommand(
        workspace,
        ["pnpm", "publish", "--provenance"],
        "inherit",
      );
    } else {
      await execCommand(workspace, ["pnpm", "publish"], "inherit");
    }
  },
};
