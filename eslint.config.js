import pobTypescriptConfig, {
  apply,
  extensions,
} from "@pob/eslint-config-typescript";

const { configs, compat } = pobTypescriptConfig(import.meta.url);

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
    configs: compat.env({ jest: true }),
  }),
];
