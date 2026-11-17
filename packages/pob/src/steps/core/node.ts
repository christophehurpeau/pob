import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { latestLTS, nodeAppTypes } from "../../utils/misc.ts";
import { getProjectKind } from "../settings.ts";
import {
  computeEnginesNode,
  getBuildEnvs,
  hasNodeTarget,
  typesNodeDependencyRange,
  typesNodeDevDependencyVersion,
} from "./nodeEngines.ts";

/** The onlyLatestLTS option each orchestrator gave to pob:core:node */
export const getOnlyLatestLTS = (ctx: PackageContext): boolean => {
  switch (getProjectKind(ctx)) {
    case "lib": {
      const envs = ctx.config.build?.envs;
      return envs
        ? envs
            .filter((env) => env.target === "node")
            .every((env) => env.version === latestLTS)
        : false;
    }
    case "app": {
      const appType = ctx.config.app?.type;
      return !!appType && nodeAppTypes.includes(appType);
    }
    case "monorepo": {
      const project = ctx.config.project;
      return (
        project.type === "app" ||
        // oxlint-disable-next-line typescript/no-deprecated -- still read from old configs
        project.supportsNode14 === false ||
        project.onlyLatestLTS === true
      );
    }
    default:
      throw new Error("Unknown project kind");
  }
};

const getEnginesNode = (
  ctx: PackageContext,
  currentEnginesNode: unknown,
): string =>
  computeEnginesNode(
    currentEnginesNode,
    getBuildEnvs(ctx.config.build),
    getOnlyLatestLTS(ctx),
  );

/**
 * engines.node and devDependencies["@types/node"]. Reads the final
 * devDependencies: it runs after every step that writes them, like
 * pob:core:node composed last.
 */
export const nodeStep = defineStep<PackageContext>({
  name: "node",
  reads: ["pkg.engines.node", "pkg.devDependencies.@types/node"],
  writes: ["pkg.engines.node", "pkg.devDependencies.@types/node"],
  run: (ctx) => {
    const { pkg } = ctx;
    const enginesNode = getEnginesNode(ctx, pkg.get("engines.node"));
    pkg.set("engines.node", enginesNode);

    if (!hasNodeTarget(getBuildEnvs(ctx.config.build))) {
      pkg.removeDevDependencies(["@types/node"]);
      return;
    }
    const currentDevVersion = pkg.get<string>([
      "devDependencies",
      "@types/node",
    ]);
    if (!currentDevVersion) return;
    const pinnedVersion = ctx.versions("@types/node");
    if (!pinnedVersion) throw new Error("Missing pobDependency: @types/node");
    const version = typesNodeDevDependencyVersion(
      currentDevVersion,
      enginesNode,
      pinnedVersion,
    );
    if (version !== currentDevVersion) {
      pkg.set(["devDependencies", "@types/node"], version);
    }
  },
});

/**
 * dependencies["@types/node"], apart from the node step: steps that read
 * pkg.dependencies (react detection) and write pkg.devDependencies would
 * otherwise be ordered both before and after it. No step adds @types/node and
 * no step writes engines.node, so the initial content gives the same result.
 */
export const nodeTypesDependencyStep = defineStep<PackageContext>({
  name: "node-types-dependency",
  writes: ["pkg.dependencies.@types/node"],
  run: (ctx) => {
    const initialPkg = ctx.initial.readJson<JsonObject>("package.json") ?? {};
    const current = (initialPkg.dependencies as JsonObject | undefined)?.[
      "@types/node"
    ];
    if (!current) return;
    if (!hasNodeTarget(getBuildEnvs(ctx.config.build))) {
      ctx.pkg.removeDependencies(["@types/node"]);
      return;
    }
    const range = typesNodeDependencyRange(
      getEnginesNode(ctx, (initialPkg.engines as JsonObject | undefined)?.node),
    );
    if (range) ctx.pkg.set(["dependencies", "@types/node"], range);
  },
});
