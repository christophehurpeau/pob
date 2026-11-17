import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { isExpoApp } from "../../utils/misc.ts";
import { getProjectKind } from "../settings.ts";

const presets = "github>christophehurpeau/renovate-presets";

interface RenovateExtendsOptions {
  app: boolean;
  pkgName: string | undefined;
  withExpo: boolean;
}

/**
 * The expo preset comes last so that it overrides the rules of the default
 * preset matching the same packages.
 */
export const getRenovateExtends = ({
  app,
  pkgName,
  withExpo,
}: RenovateExtendsOptions): string[] =>
  [
    app ? "config:js-app" : "config:js-lib",
    !app && pkgName === "pob-monorepo" ? undefined : presets,
    withExpo ? `${presets}:expo` : undefined,
  ].filter((value): value is string => value !== undefined);

/** From the pob config of the package and, at a monorepo root, its packages. */
const hasExpoApp = (ctx: PackageContext): boolean =>
  isExpoApp(ctx.config) ||
  (getProjectKind(ctx) === "monorepo" &&
    ctx.workspacePackages.some((workspacePackage) =>
      isExpoApp(workspacePackage.config),
    ));

/** renovate.json at the root: only extends (and $schema of apps) are managed. */
export const renovateStep = defineStep<PackageContext>({
  name: "renovate",
  reads: ["pkg.name"],
  writes: ["renovate.$schema", "renovate.extends", "files:renovate.json"],
  run: (ctx) => {
    if (ctx.facts.inMonorepo) {
      ctx.output.removed("renovate.json");
      return;
    }
    const renovateConfig = ctx.config.renovate;
    if (!renovateConfig) {
      throw new Error("missing pob config: renovate.enable");
    }
    if (!renovateConfig.enable) {
      ctx.output.removed("renovate.json");
      return;
    }

    const app = ctx.config.project.type === "app";
    const renovate = ctx.model("renovate", "renovate.json");
    if (app) {
      renovate.set(
        "$schema",
        "https://docs.renovatebot.com/renovate-schema.json",
      );
    }
    renovate.set(
      "extends",
      getRenovateExtends({
        app,
        pkgName: ctx.pkg.get<string>("name"),
        withExpo: hasExpoApp(ctx),
      }),
    );
    ctx.output.merged(
      "renovate.json",
      renovate,
      (model) => JSON.stringify(model.snapshot(), null, 2),
      { format: "oxfmt" },
    );
  },
});
