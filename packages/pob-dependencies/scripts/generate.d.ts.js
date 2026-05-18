import fs from "node:fs";
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { format } from "oxfmt";
import { pkgPath } from "./helper.cjs";

const pkg = JSON.parse(fs.readFileSync(pkgPath));

const { code: formatted } = await format(
  "index.d.ts",
  `
  interface Dependencies {
    ${Object.keys(pkg.devDependencies)
      .map((dep) => `"${dep}": "${pkg.devDependencies[dep]}"`)
      .join(";\n  ")};
  }

  declare const dependencies: Dependencies;
  export = dependencies;
  `,
  { printWidth: 80 },
);

fs.writeFileSync(new URL("../lib/index.d.ts", import.meta.url), formatted);
