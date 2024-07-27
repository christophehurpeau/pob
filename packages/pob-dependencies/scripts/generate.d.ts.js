import fs from "node:fs";
import prettier from "prettier";
import { pkgPath } from "./helper.cjs";

const pkg = JSON.parse(fs.readFileSync(pkgPath));

fs.writeFileSync(
  new URL("../lib/index.d.ts", import.meta.url),
  await prettier.format(
    `
  interface Dependencies {
    ${Object.keys(pkg.devDependencies)
      .map((dep) => `"${dep}": "${pkg.devDependencies[dep]}"`)
      .join(";\n  ")};
  }

  declare const dependencies: Dependencies;
  export = dependencies;
  `,
    {
      filepath: "index.d.ts",
      trailingComma: "all",
      arrowParens: "always",
    },
  ),
);
