import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { isAlouetteApp } from "../../utils/misc.ts";
import { getAppSettings, getLibSettings, getProjectKind } from "../settings.ts";
import {
  renderExtensionsJson,
  renderSettingsJson,
  renderTasksJson,
  tsrsTsdkTsgo,
} from "./vscodeTemplates.ts";

const tsdkPath = ".vscode/tsrs-tsdk/tsgo";

/** The options the orchestrators gave to pob:core:vscode, at the root */
interface VscodeOptions {
  typescript: boolean;
  tailwind: boolean;
}

const getVscodeOptions = (ctx: PackageContext): VscodeOptions => {
  switch (getProjectKind(ctx)) {
    case "lib":
      return {
        typescript: getLibSettings(ctx.config).withTypescript,
        tailwind: false,
      };
    case "app": {
      const settings = getAppSettings(ctx.config);
      return {
        typescript: settings.typescript,
        tailwind: !!settings.app.alouette,
      };
    }
    case "monorepo":
      return {
        typescript: !!ctx.config.monorepo?.typescript,
        tailwind: ctx.workspacePackages.some((workspacePackage) =>
          isAlouetteApp(
            workspacePackage.config,
            workspacePackage.initial.readJson<JsonObject>("package.json") ?? {},
          ),
        ),
      };
    default:
      throw new Error("Unknown project kind");
  }
};

const readTasks = (ctx: PackageContext): unknown[] => {
  const content = ctx.initial.read(".vscode/tasks.json");
  if (content === undefined) return [];
  return (
    (JSON5.parse<JsonObject>(content).tasks as unknown[] | undefined) ?? []
  );
};

/**
 * The engine writes files without a mode: the extension runs this script
 * directly, so it must be executable.
 */
const planTsdkChmod = (ctx: PackageContext): void => {
  if (
    ctx.initial.read(tsdkPath) === tsrsTsdkTsgo &&
    ctx.initial.isExecutable(tsdkPath)
  ) {
    return;
  }
  ctx.effects.add({
    id: "vscode-tsdk-chmod",
    reason: `${tsdkPath} must be executable`,
    command: `chmod +x ${tsdkPath}`,
    run: ({ cwd }) => {
      fs.chmodSync(path.join(cwd, tsdkPath), 0o755);
    },
  });
};

/** .vscode at the root; the yarn sdks effect may rewrite it with pnp. */
export const vscodeStep = defineStep<PackageContext>({
  name: "vscode",
  writes: ["files:.vscode", "files:.vscode/**"],
  run: (ctx) => {
    if (!ctx.facts.isRoot) {
      ctx.output.removed(".vscode");
      return;
    }
    const { typescript, tailwind } = getVscodeOptions(ctx);
    const { packageManager, yarnNodeLinker } = ctx.facts;
    const yarn = packageManager === "yarn";
    const pnp = yarnNodeLinker === "pnp";
    // the tsdk script runs tsrs from node_modules, which pnp does not have
    const tsrs = typescript && !pnp;

    if (tsrs) {
      ctx.output.owned(tsdkPath, tsrsTsdkTsgo);
      planTsdkChmod(ctx);
    } else {
      ctx.output.removed(tsdkPath);
    }

    ctx.output.owned(
      ".vscode/extensions.json",
      renderExtensionsJson({ yarn, pnp, typescript, tailwind }),
      { format: "oxfmt" },
    );
    ctx.output.owned(
      ".vscode/settings.json",
      renderSettingsJson({
        yarn,
        pnp,
        bun: packageManager === "bun",
        pnpm: packageManager === "pnpm",
        typescript,
        tsrs,
        tailwind,
      }),
      { format: "oxfmt" },
    );
    ctx.output.owned(".vscode/tasks.json", renderTasksJson(readTasks(ctx)), {
      format: "oxfmt",
    });
  },
});
