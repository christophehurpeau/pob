import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { composesHusky, getInitialPackageName } from "./settings.ts";
import { lintStagedConfigTemplate } from "./templates.ts";

/** port of pob:common:husky: commitlint and lint-staged config at the root */
export const huskyStep = defineStep<PackageContext>({
  name: "husky",
  when: composesHusky,
  reads: ["pkg.type"],
  writes: [
    "pkg.devDependencies",
    "pkg.commitlint",
    "files:lint-staged.config.js",
    "files:lint-staged.config.mjs",
  ],
  run: (ctx) => {
    const { pkg, output } = ctx;
    const name = getInitialPackageName(ctx);

    if (!ctx.facts.isRoot) {
      pkg.removeDevDependencies([name !== "pob" && "@pob/root"]);
      pkg.delete("commitlint");
      return;
    }

    // pob-monorepo maintains its own lint-staged config and @pob/root
    if (name !== "pob-monorepo") {
      pkg.addDevDependencies(["@pob/root"]);
      output.owned(
        pkg.get("type") === "module"
          ? "lint-staged.config.js"
          : "lint-staged.config.mjs",
        lintStagedConfigTemplate,
      );
    }

    pkg.set("commitlint", { extends: ["@pob/root/commitlint-config"] });
  },
});
