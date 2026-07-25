import pobPlugin from "@pob/eslint-plugin";
import { createNodeResolver } from "eslint-plugin-import-x";
import nodePlugin from "eslint-plugin-n";
import { overrideRules } from "./_base.js";

export default [
  nodePlugin.configs["flat/recommended-script"],
  pobPlugin.configs.node,
  {
    name: "@pob/eslint-config/node/commonjs",
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({
          conditionNames: ["require", "default", "node"],
        }),
      ],
    },
    rules: {
      ...overrideRules,
      // "unicorn/prefer-module": "off",
      "n/no-new-require": "error",
      "n/no-path-concat": "error",
    },
  },
];
