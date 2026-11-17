import type { LegacyPart } from "../legacy/part.ts";

/** from pob:core:yarn */
export const yarnLegacyPart: LegacyPart = {
  name: "yarn",
  writes: [
    "pkg.devDependencies.@yarnpkg/pnpify",
    "files:.yarn/build-state.yml",
  ],
  run: (ctx) => {
    ctx.pkg.removeDevDependencies(["@yarnpkg/pnpify"]);
    ctx.output.removed(".yarn/build-state.yml");
  },
};
