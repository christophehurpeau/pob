import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { getProjectKind } from "../settings.ts";
import { planUntrackBuild } from "./gitIndex.ts";
import { getProjectLibSettings } from "./settings.ts";

const isLib = (ctx: PackageContext): boolean => getProjectKind(ctx) === "lib";

/** what pob:lib wrote itself */
export const libStep = defineStep<PackageContext>({
  name: "lib",
  when: isLib,
  writes: [
    "pkg.scripts.preversion",
    "pkg.scripts.release",
    "pkg.scripts.version",
    "files:coverage",
    "files:coverage/**",
    "files:generated-docs",
    "files:generated-docs/**",
    "files:dist",
    "files:dist/**",
  ],
  run(ctx) {
    const { pkg, output } = ctx;
    const settings = getProjectLibSettings(ctx);

    if (ctx.facts.inMonorepo) {
      const name = ctx.initial.readJson("package.json")?.name;
      pkg.removeScripts([
        name !== "pob-dependencies" && "preversion",
        "release",
        "version",
      ]);
    }

    output.removed("coverage", { transient: true });
    if (settings.documentation) {
      output.removed("generated-docs", { transient: true });
    }
    if (!settings.withBabel && !settings.withTypescript) {
      output.removed("dist", { transient: true });
    }

    if (!settings.buildInGit && settings.buildDirectory) {
      planUntrackBuild(ctx, settings.buildDirectory);
    }
  },
});

/**
 * The transpiler sets sideEffects to true when it is absent, pob:lib forces it
 * to false: a library is always tree-shakable.
 */
export const libSideEffectsStep = defineStep<PackageContext>({
  name: "lib:side-effects",
  when: isLib,
  writes: ["pkg.sideEffects"],
  overrides: ["transpiler"],
  run(ctx) {
    if (ctx.pkg.has("sideEffects")) ctx.pkg.set("sideEffects", false);
  },
});
