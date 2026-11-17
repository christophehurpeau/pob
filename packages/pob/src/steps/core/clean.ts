import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";

/** IDE settings belong to the root of a monorepo, not to its packages. */
export const cleanStep = defineStep<PackageContext>({
  name: "clean",
  when: (ctx) => !ctx.facts.isRoot,
  writes: ["files:.idea"],
  run: (ctx) => {
    ctx.output.removed(".idea");
  },
});
