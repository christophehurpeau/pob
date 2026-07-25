import checkPackages from "check-package-dependencies/eslint-plugin";
import pobConfig, { apply, tsExtensions } from "@pob/eslint-config";
import pobTypescriptConfigReact from "@pob/eslint-config-typescript-react";

const { configs } = pobConfig();

export default [
  ...configs.node,
  ...configs.monorepo,
  {
    ignores: [
      "@pob/version/__fixtures__/monorepo-invalid-package-json/packages/pkg-with-invalid-json/package.json",
      "**/__fixtures__/**",
    ],
  },
  ...apply({
    files: ["@pob/eslint-config-typescript-react/test-lint/**/"],
    mode: "directory",
    configs: pobTypescriptConfigReact(import.meta.url).configs.node,
    extensions: tsExtensions,
  }).map((config) => ({
    ...config,
    files: config.files
      ? config.files.map((file) =>
          file.replace(
            /^\*\*\//,
            "@pob/eslint-config-typescript-react/test-lint/**/",
          ),
        )
      : ["@pob/eslint-config-typescript-react/test-lint/**/*.{ts,tsx}"],
  })),
  {
    files: ["**/test-lint/**/*.{js,cjs,mjs}"],
    rules: {
      "import-x/no-extraneous-dependencies": "off",
    },
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
  {
    files: ["*.config.{ts,mts,cts}"],
    languageOptions: {
      parserOptions: {
        project: "tsconfig.root-configs.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import-x/core-modules": ["vitest"],
    },
  },
  // must be lowest
  checkPackages.configs["recommended-library"],
  {
    files: ["@pob/root/package.json"],
    rules: {
      "check-package-dependencies/satisfies-versions-from-dependencies": [
        "error",
        {
          dependencies: {
            "lint-staged": { dependencies: ["picomatch"] },
          },
        },
      ],
    },
  },
  {
    files: ["packages/pob/package.json"],
    rules: {
      "check-package-dependencies/satisfies-versions-from-dependencies": [
        "error",
        {
          dependencies: {
            "yeoman-environment": { dependencies: ["mem-fs-editor"] },
          },
        },
      ],
    },
  },
  {
    files: ["packages/pob-dependencies/package.json"],
    rules: {
      "check-package-dependencies/require-identical-versions": [
        "error",
        {
          devDependencies: { vitest: ["@vitest/coverage-v8"] },
        },
      ],
    },
  },
  {
    // packages depending on plugins that have not yet updated to eslint 10,
    // but there are no errors. @pob/eslint-config is not listed as all its
    // dependencies already allow eslint 10.
    files: [
      "@pob/eslint-config-typescript-react/package.json",
      "@pob/eslint-plugin/package.json",
    ],
    rules: {
      "check-package-dependencies/require-direct-peer-dependencies": [
        "error",
        { onlyWarnsFor: { "*": ["eslint"] } },
      ],
    },
  },
  {
    files: ["@pob/eslint-config-typescript-react/package.json"],
    rules: {
      "check-package-dependencies/require-direct-peer-dependencies": [
        "error",
        { onlyWarnsFor: { "*": ["eslint"] } },
      ],
    },
  },
];
