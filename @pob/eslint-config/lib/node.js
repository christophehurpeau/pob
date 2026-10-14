import { createNodeResolver } from "eslint-plugin-import-x";
import nodePlugin from "eslint-plugin-n";
import { tsExtensions } from "./typescript.js";

/**
 * @param {readonly string[]} moduleFiles
 * @param {readonly string[]} commonjsFiles
 * @returns {import("eslint").Linter.Config[]}
 */
export const createNodeConfigs = (moduleFiles, commonjsFiles) => [
  {
    name: "@pob/eslint-config/node/module",
    files: [...moduleFiles],
    plugins: { n: nodePlugin },
    // node globals, for no-undef
    languageOptions:
      nodePlugin.configs["flat/recommended-module"].languageOptions,
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({
          conditionNames: ["node", "import"],
        }),
      ],
    },
    rules: {
      // oxlint rejects its fix inserting the shebang
      // https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/hashbang.md
      "n/hashbang": "error",
    },
  },
  {
    name: "@pob/eslint-config/node/commonjs",
    files: [...commonjsFiles],
    plugins: { n: nodePlugin },
    languageOptions:
      nodePlugin.configs["flat/recommended-script"].languageOptions,
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({
          conditionNames: ["require", "default", "node"],
        }),
      ],
    },
    rules: {
      "n/hashbang": "error",
    },
  },
  {
    name: "@pob/eslint-config/node/typescript",
    files: [`**/*.${tsExtensions}`],
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({
          extensions: [".mjs", ".js", ".json", ".ts"],
          conditionNames: ["node", "import"],
        }),
      ],
    },
  },
];
