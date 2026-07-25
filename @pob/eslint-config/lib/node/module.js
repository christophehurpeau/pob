import pobPlugin from "@pob/eslint-plugin";
import { createNodeResolver } from "eslint-plugin-import-x";
import nodePlugin from "eslint-plugin-n";
import { overrideRules } from "./_base.js";

export default [
  nodePlugin.configs["flat/recommended-module"],
  pobPlugin.configs.node,
  {
    name: "@pob/eslint-config/node/module",
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({
          conditionNames: ["node", "import"],
        }),
      ],
    },
    rules: {
      ...overrideRules,
      "unicorn/prefer-module": "error",
      "unicorn/import-index": "off",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/import/extensions.md
      "import-x/extensions": [
        "error",
        "ignorePackages",
        {
          mjs: "always",
          cjs: "always",
          js: "always",
        },
      ],
    },
  },
];
