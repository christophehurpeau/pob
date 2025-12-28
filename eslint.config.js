import pobConfig, { apply, tsExtensions } from "@pob/eslint-config";
import pluginJest from "eslint-plugin-jest";

const { configs } = pobConfig();

export default [
  ...configs.node,
  {
    ignores: [
      "packages/pob-babel/test/**/*",
      "@pob/version/__fixtures__/monorepo-invalid-package-json/packages/pkg-with-invalid-json/package.json",
      "**/__fixtures__/**",
    ],
  },
  ...apply({
    files: ["@pob/version/"],
    mode: "directory",
    extensions: tsExtensions,
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
    files: ["**/*.test.{js,ts}", "vitest.config.js"],
    configs: [
      pluginJest.configs["flat/recommended"],
      {
        settings: {
          "import-x/core-modules": ["vitest"],
        },
      },
    ],
  }),
];
