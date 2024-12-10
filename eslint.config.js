import pobTypescriptConfig, {
  apply,
  extensions,
} from "@pob/eslint-config-typescript";
import pluginJest from "eslint-plugin-jest";

const { configs } = pobTypescriptConfig();

export default [
  ...configs.node,
  {
    ignores: ["packages/pob-babel/test/**/*"],
  },
  ...apply({
    files: ["packages/yarn-version/"],
    mode: "directory",
    extensions,
    configs: [...configs.allowUnsafe, ...configs.app],
  }),
  ...apply({
    files: ["packages/pob/"],
    mode: "directory",
    configs: [
      {
        rules: {
          complexity: "off",
          "no-nested-ternary": "off",
        },
      },
    ],
  }),
  ...apply({
    files: ["**/*.test.js"],
    configs: [
      pluginJest.configs["flat/recommended"],
      {
        languageOptions: {
          globals: pluginJest.environments.globals.globals,
        },
      },
    ],
  }),
];
