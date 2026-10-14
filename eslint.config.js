import pobConfig, { apply, tsExtensions } from "@pob/eslint-config";
import pobTypescriptConfigReact from "@pob/eslint-config-typescript-react";

const { configs } = pobConfig;

export default [
  ...configs.node,
  ...configs.monorepo,
  {
    settings: {
      "check-package-dependencies": {
        library: ["*", "!vite-app"],
      },
    },
  },
  {
    ignores: [
      "@pob/version/__fixtures__/monorepo-invalid-package-json/packages/pkg-with-invalid-json/package.json",
      "**/__fixtures__/**",
    ],
  },
  ...apply({
    files: ["@pob/eslint-config-typescript-react/test-lint/**/"],
    mode: "directory",
    // react.json is extended by test-lint/.oxlintrc.json
    configs: [...pobTypescriptConfigReact.configs.node],
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
    settings: {
      "import-x/core-modules": ["vitest"],
    },
  },
  {
    // "typescript" and "@typescript/native" are installed through npm aliases,
    // which check-package-dependencies doesn't support yet: it passes the raw
    // "npm:pkg@version" value to semver, which throws "Invalid comparator".
    files: ["package.json"],
    rules: {
      "check-package-dependencies/consistent-workspace-dependencies": "off",
    },
  },
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
];
