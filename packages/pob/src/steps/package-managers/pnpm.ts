import { execFileSync } from "node:child_process";
import { FAILSAFE_SCHEMA, load } from "js-yaml";
import { satisfies } from "semver";
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { minimumReleaseAgeExcludePatterns } from "../../utils/misc.ts";
import { parseYamlConfig, serializeYamlConfig } from "./shared.ts";

export const pnpmVersionRange = "^12.0.0";

export const parsePnpmWorkspace = parseYamlConfig();

/** build scripts of the dependencies pob adds itself */
const trustedBuilds = ["esbuild"];

/**
 * pnpm 12 writes its version in a first document of pnpm-lock.yaml when
 * devEngines.packageManager is not ignored. Removes it when it has nothing
 * else (no config dependencies).
 */
export const removePackageManagerLockfileDocument = (
  lockfile: string,
): string => {
  if (!lockfile.startsWith("---\n")) return lockfile;
  const end = lockfile.indexOf("\n---\n", 4);
  if (end === -1) return lockfile;
  const envDocument = load(lockfile.slice(4, end), {
    schema: FAILSAFE_SCHEMA,
  }) as { importers?: Record<string, JsonObject> } | null;
  const importer = envDocument?.importers?.["."] ?? {};
  const hasOtherEntries = Object.keys(importer).some(
    (key) =>
      key !== "packageManagerDependencies" && key !== "configDependencies",
  );
  if (
    hasOtherEntries ||
    Object.keys((importer.configDependencies as JsonObject | undefined) ?? {})
      .length > 0
  ) {
    return lockfile;
  }
  return lockfile.slice(end + "\n---\n".length);
};

const getRunningPnpmVersion = (cwd: string): string | undefined => {
  try {
    return execFileSync("pnpm", ["--version"], {
      cwd,
      encoding: "utf8",
    }).trim();
  } catch {
    return undefined;
  }
};

/**
 * The running pnpm can be older than the version pob requires, for example in
 * the renovate workflow after a pnpm major update.
 */
export const getPnpmArgs = (cwd: string): string[] => {
  const runningVersion = getRunningPnpmVersion(cwd);
  return runningVersion && satisfies(runningVersion, pnpmVersionRange)
    ? []
    : ["with", pnpmVersionRange];
};

export const isPnpmEnabled = (ctx: PackageContext): boolean =>
  ctx.facts.isRoot && ctx.facts.packageManager === "pnpm";

/** booleans are read as strings: other values are placeholders of pnpm */
const parseAllowBuilds = (value: unknown): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries((value as JsonObject | undefined) ?? {}).map(
      ([key, allowed]) => {
        if (allowed === "true") return [key, true];
        if (allowed === "false") return [key, false];
        return [key, allowed];
      },
    ),
  );

const writePnpmWorkspace = (ctx: PackageContext): void => {
  const { pkg, output } = ctx;
  const workspace = ctx.model(
    "pnpmWorkspace",
    "pnpm-workspace.yaml",
    parsePnpmWorkspace,
  );

  const allowBuilds = parseAllowBuilds(workspace.get("allowBuilds"));
  // set even before a package needs them: the root is generated before its
  // packages, and an ignored build makes pnpm fail
  for (const name of trustedBuilds) {
    if (typeof allowBuilds[name] !== "boolean") allowBuilds[name] = true;
  }
  workspace.set("allowBuilds", allowBuilds);
  const pendingAllowBuilds = Object.keys(allowBuilds).filter(
    (name) => typeof allowBuilds[name] !== "boolean",
  );
  if (pendingAllowBuilds.length > 0) {
    ctx.warn(
      `pnpm-workspace.yaml: set allowBuilds to true or false for ${pendingAllowBuilds.join(", ")}`,
    );
  }

  const workspaces = pkg.get("workspaces");
  if (workspaces) workspace.set("packages", workspaces);
  else workspace.delete("packages");
  workspace.set("savePrefix", ctx.config.project.type === "app" ? "" : "^");
  workspace.set("minimumReleaseAge", 1440 * 2.5);
  // keeps the entries added by renovate for security updates, or by hand
  workspace.set("minimumReleaseAgeExclude", [
    ...new Set([
      ...minimumReleaseAgeExcludePatterns,
      ...(workspace.get<string[]>("minimumReleaseAgeExclude") ?? []),
    ]),
  ]);
  workspace.set("dedupePeerDependents", true);
  workspace.set("nodeLinker", "hoisted");

  output.merged("pnpm-workspace.yaml", workspace, serializeYamlConfig, {
    format: "oxfmt",
  });
};

/** pob:core:pnpm: pnpm-workspace.yaml, devEngines.packageManager */
export const pnpmStep = defineStep<PackageContext>({
  name: "pnpm",
  // MonorepoWorkspaces sets workspaces: the yeoman generator read it before
  reads: ["pkg.workspaces"],
  writes: [
    "pkg.packageManager",
    "pkg.devEngines.packageManager",
    "pnpmWorkspace",
    "files:pnpm-lock.yaml",
    "files:pnpm-workspace.yaml",
    "files:package-lock.json",
    "files:yarn.lock",
  ],
  run(ctx) {
    const { pkg, output } = ctx;

    if (!isPnpmEnabled(ctx)) {
      if (pkg.get<string>("packageManager")?.startsWith("pnpm@")) {
        pkg.delete("packageManager");
      }
      if (pkg.get("devEngines.packageManager.name") === "pnpm") {
        pkg.delete("devEngines.packageManager");
      }
      output.removed("pnpm-lock.yaml");
      output.removed("pnpm-workspace.yaml");
      return;
    }

    // devEngines.packageManager is read by pnpm/action-setup. onFail is
    // "ignore": otherwise pnpm writes its version in pnpm-lock.yaml and it has
    // to be updated by hand. The version is checked by engines.pnpm.
    pkg.delete("packageManager");
    pkg.set("devEngines.packageManager", {
      name: "pnpm",
      version: pnpmVersionRange,
      onFail: "ignore",
    });

    const lockfile = ctx.initial.read("pnpm-lock.yaml");
    if (lockfile !== undefined) {
      const newLockfile = removePackageManagerLockfileDocument(lockfile);
      if (newLockfile !== lockfile) output.owned("pnpm-lock.yaml", newLockfile);
    }

    writePnpmWorkspace(ctx);

    output.removed("package-lock.json");
    output.removed("yarn.lock");
  },
});
