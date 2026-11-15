import type { BuildConfig, PobConfig } from "../engine/config.ts";
import type { PackageContext } from "../engine/context.ts";
import type { JsonObject } from "../engine/model.ts";
import { defineStep } from "../engine/step.ts";
import { detectAlouette } from "../utils/misc.ts";
import { detectStorybookReactNative, getProjectKind } from "./settings.ts";
import {
  getTranspilerOptions,
  resolveTranspilerBuild,
  usesTranspiler,
} from "./transpiler/settings.ts";

/** published with the sources: the files of the package are computed by pob */
export const POB_SCHEMA_FILE = "src/pob.schema.json";

/** relative to the package: pob is installed at the root of the repository */
const getSchemaPath = (ctx: PackageContext): string => {
  const depth = ctx.facts.inMonorepo
    ? ctx.facts.inMonorepo.relative.split("/").filter(Boolean).length
    : 0;
  return `${depth === 0 ? "./" : "../".repeat(depth)}node_modules/pob/${POB_SCHEMA_FILE}`;
};

/**
 * package.json#pob as the transpiler leaves it: the yeoman generators
 * rewrote it (envs of the latest LTS, typescript for rollup bundlers...)
 */
const getBuildConfig = (ctx: PackageContext): BuildConfig | undefined => {
  if (!usesTranspiler(ctx) || !ctx.config.build) return ctx.config.build;
  return resolveTranspilerBuild(ctx, getTranspilerOptions(ctx)).build;
};

/** Defaults the yeoman prompts stored in the config without asking. */
const getAppConfig = (ctx: PackageContext): PobConfig["app"] => {
  const app = ctx.config.app;
  if (app?.type !== "expo") return app;
  const pkg = ctx.initial.readJson<JsonObject>("package.json") ?? {};
  return {
    ...app,
    storybook: app.storybook ?? detectStorybookReactNative([pkg]),
    alouette: app.alouette ?? detectAlouette(pkg),
  };
};

/** The content of pob.json: the resolved config, normalized. */
export const buildPobJson = (ctx: PackageContext): PobConfig => {
  const { config } = ctx;
  const kind = getProjectKind(ctx);
  const build = getBuildConfig(ctx);
  const lib =
    config.lib && ctx.facts.inMonorepo
      ? { ...config.lib, documentation: false }
      : config.lib;
  const pobJson: PobConfig = {
    $schema: getSchemaPath(ctx),
    project: config.project,
    ...(lib && kind === "lib" ? { lib } : {}),
    ...(config.app && kind === "app" ? { app: getAppConfig(ctx) } : {}),
    ...(config.monorepo && kind === "monorepo"
      ? { monorepo: config.monorepo }
      : {}),
    ...(config.renovate && !ctx.facts.inMonorepo
      ? { renovate: config.renovate }
      : {}),
    // an empty build config tells apps that pob was configured without bundler
    ...(build ? { build } : {}),
  };
  return pobJson;
};

/**
 * Writes the config to pob.json, and removes the files that held it in older
 * versions: .yo-rc.json, .pob.json and package.json#pob.
 */
export const configStep = defineStep<PackageContext>({
  name: "config",
  writes: ["pkg.pob", "files:pob.json", "files:.yo-rc.json", "files:.pob.json"],
  run: (ctx) => {
    ctx.output.owned(
      "pob.json",
      `${JSON.stringify(buildPobJson(ctx), null, 2)}\n`,
      { format: "oxfmt" },
    );
    const yoRc = ctx.initial.readJson<JsonObject>(".yo-rc.json");
    if (yoRc) {
      // pob-monorepo and pob-lerna: namespaces of very old versions
      const otherGenerators = Object.fromEntries(
        Object.entries(yoRc).filter(([key]) => !key.startsWith("pob")),
      );
      if (Object.keys(otherGenerators).length === 0) {
        ctx.output.removed(".yo-rc.json");
      } else {
        ctx.output.owned(
          ".yo-rc.json",
          `${JSON.stringify(otherGenerators, null, 2)}\n`,
        );
      }
    }
    ctx.output.removed(".pob.json");
    ctx.pkg.delete("pob");
  },
});
