import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { isMonorepoRoot } from "./settings.ts";

/** outputs of the root test coverage and documentation, rebuilt on demand */
export const monorepoCleanStep = defineStep<PackageContext>({
  name: "monorepo-clean",
  when: isMonorepoRoot,
  writes: ["files:coverage", "files:generated-docs"],
  run: (ctx) => {
    ctx.output.removed("coverage", { transient: true });
    ctx.output.removed("generated-docs", { transient: true });
  },
});
