import pobConfig, { apply, tsExtensions } from "@pob/eslint-config";

const { configs } = pobConfig();

export default [
  {
    ignores: ["**/.zed/**"],
  },
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
      {
        settings: {
          "import-x/core-modules": ["vitest"],
        },
      },
    ],
  }),
];
