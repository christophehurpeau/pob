import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { isLegacyGeneratedDocs } from "../../utils/misc.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { listRootEntries } from "./packages.ts";

const legacyYarnVersionScript =
  "YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn && git add yarn.lock";

/**
 * The version lerna managed: "independent" when each package has its own, in
 * which case the root has none.
 */
const getLernaVersion = (ctx: PackageContext): string => {
  const lernaConfig =
    ctx.initial.readJson<JsonObject>("lerna.json") ??
    ctx.pkg.get<JsonObject>("lerna") ??
    {};
  const npmClient = !!lernaConfig.version && lernaConfig.npmClient !== "yarn";
  if (npmClient) return "independent";
  return (lernaConfig.version as string | undefined) || "independent";
};

const removeLerna = (ctx: PackageContext): void => {
  const { pkg, output } = ctx;
  if (pkg.get("version") === "0.0.0") {
    const lernaVersion = getLernaVersion(ctx);
    if (lernaVersion === "independent") pkg.delete("version");
    else pkg.set("version", lernaVersion);
  }
  pkg.delete("lerna");
  pkg.removeDependencies(["lerna", "@pob/lerna-light"]);
  pkg.removeDevDependencies(["lerna", "@pob/lerna-light"]);
  output.removed("lerna.json");
  output.removed("lerna-debug.log");
};

const removeLegacyScripts = (ctx: PackageContext): void => {
  const { pkg } = ctx;
  if (pkg.get("scripts.version") === legacyYarnVersionScript) {
    pkg.removeScripts(["version"]);
  }
  pkg.removeScripts([
    "lint:prettier",
    "lint:prettier:fix",
    "postbuild",
    "prepublishOnly",
    "flow",
    "typescript-check",
  ]);
};

const removeLegacyTypescript = (ctx: PackageContext): void => {
  const { pkg, output } = ctx;
  pkg.removeDevDependencies(["flow-bin"]);
  output.removed("flow-typed");
  output.removed(".flowconfig");
  output.removed("tsconfig.root-configs.json");
  output.removed("tsconfig.test.json");
  output.removed("tsconfig.check.json");
  output.removed("tsconfig.build.json");
};

/** babel builds of old pob versions, and docs before generated-docs */
const removeLegacyBuildOutputs = (ctx: PackageContext): void => {
  for (const name of listRootEntries(ctx)) {
    if (name.startsWith("lib-")) ctx.output.removed(name);
  }
  if (isLegacyGeneratedDocs(ctx.initial.exists)) ctx.output.removed("docs");
};

/** from pob:monorepo, pob:monorepo:workspaces, :lerna and :typescript */
export const monorepoLegacyPart: LegacyPart = {
  name: "monorepo",
  writes: [
    "pkg.lerna",
    "pkg.version",
    "pkg.dependencies",
    "pkg.devDependencies",
    "pkg.scripts.version",
    "pkg.scripts.lint:prettier",
    "pkg.scripts.lint:prettier:fix",
    "pkg.scripts.postbuild",
    "pkg.scripts.prepublishOnly",
    "pkg.scripts.flow",
    "pkg.scripts.typescript-check",
    "files:lerna.json",
    "files:lerna-debug.log",
    "files:flow-typed",
    "files:.flowconfig",
    "files:tsconfig.root-configs.json",
    "files:tsconfig.test.json",
    "files:tsconfig.check.json",
    "files:tsconfig.build.json",
    "files:lib-*",
    "files:docs",
  ],
  run: (ctx) => {
    if (!ctx.facts.isMonorepoRoot) return;
    removeLerna(ctx);
    removeLegacyScripts(ctx);
    removeLegacyTypescript(ctx);
    removeLegacyBuildOutputs(ctx);
  },
};
