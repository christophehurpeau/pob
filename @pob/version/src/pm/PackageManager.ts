import { existsSync } from "node:fs";
import type { Workspace } from "../utils/packageUtils.ts";
import { BunPackageManager } from "./BunPackageManager.ts";
import { YarnPackageManager } from "./YarnPackageManager.ts";

export interface PackageManagerPublishOptions {
  provenance?: boolean;
}

export interface PackageManager {
  installOnPackageContentChange?: (rootWorkspace: Workspace) => Promise<void>;
  runScript: (workspace: Workspace, scriptName: string) => Promise<void>;
  publish: (
    workspace: Workspace,
    options?: PackageManagerPublishOptions,
  ) => Promise<void>;
  publishWorkspaces?: (
    rootWorkspace: Workspace,
    options?: PackageManagerPublishOptions,
  ) => Promise<void>;
}

export const autoDetectPackageManager = (
  rootWorkspace: Workspace,
): PackageManager => {
  const hasYarnLock = existsSync(`${rootWorkspace.cwd}/yarn.lock`);
  const hasBunLockLegacy = existsSync(`${rootWorkspace.cwd}/bun.lockb`);
  const hasBunLock = existsSync(`${rootWorkspace.cwd}/bun.lock`);
  const hasNpmPackageLock = existsSync(
    `${rootWorkspace.cwd}/package-lock.json`,
  );

  if (
    [hasYarnLock, hasBunLockLegacy, hasBunLock, hasNpmPackageLock].filter(
      Boolean,
    ).length > 1
  ) {
    throw new Error(
      `Multiple lock files detected in workspace at ${rootWorkspace.cwd}. Please ensure only one lock file is present, or pass --package-manager option to bypass auto-detection.`,
    );
  }

  if (hasYarnLock) {
    return YarnPackageManager;
  }

  if (hasBunLockLegacy || hasBunLock) {
    return BunPackageManager;
  }

  if (hasNpmPackageLock) {
    throw new Error(
      "NPM is not currently supported as a package manager. Please migrate to Yarn or Bun, or open an issue to request support.",
    );
  }

  throw new Error(
    `No lock file detected in workspace at ${rootWorkspace.cwd}. Please ensure a supported lock file is present, or pass --package-manager option to bypass auto-detection.`,
  );
};

export const getPackageManager = (
  rootWorkspace: Workspace,
  specifiedPackageManager?: "bun" | "yarn",
): PackageManager => {
  if (specifiedPackageManager === "bun") {
    return BunPackageManager;
  }

  if (specifiedPackageManager === "yarn") {
    return YarnPackageManager;
  }
  throw new Error(
    "Invalid package manager specified. Supported values are 'bun' and 'yarn'.",
  );
};
