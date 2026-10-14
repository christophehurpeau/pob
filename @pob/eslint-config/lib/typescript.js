import typescriptParser from "@typescript-eslint/parser";
import { createNodeResolver } from "eslint-plugin-import-x";

export const tsExtensions = "{ts,cts,mts,tsx}";

// eslint only parses TypeScript files for the import-x rules: type-aware rules
// run in oxlint, so eslint does not build the TypeScript program
/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    name: "@pob/eslint-config/typescript",
    files: [`**/*.${tsExtensions}`],
    languageOptions: {
      parser: typescriptParser,
      sourceType: "module",
    },
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({
          extensions: [".mjs", ".js", ".json", ".ts"],
          conditionNames: ["import"],
        }),
      ],
      "import-x/extensions": [".js", ".mjs", ".ts", ".d.ts"],
    },
  },
];
