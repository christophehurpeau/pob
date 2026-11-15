/**
 * Port of lib/generators/common/babel/CommonBabelGenerator.js: pob-babel is
 * no longer supported, the generator only refuses babel envs. Its cleanup is
 * in the babel legacy part.
 */
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import {
  getTranspilerOptions,
  resolveTranspilerBuild,
  usesTranspiler,
} from "./settings.ts";

export const babelStep = defineStep<PackageContext>({
  name: "babel",
  when: usesTranspiler,
  run: (ctx) => {
    const { useBabel } = resolveTranspilerBuild(ctx, getTranspilerOptions(ctx));
    if (useBabel) {
      throw new Error(
        "pob-babel is deprecated. Use @pob/rollup-esbuild or @pob/rollup-typescript instead.",
      );
    }
    const dependencies = ctx.initial.readJson<JsonObject>("package.json")
      ?.dependencies as JsonObject | undefined;
    if (dependencies?.["pob-babel"]) {
      throw new Error("pob-babel is deprecated.");
    }
  },
});
