import basePobConfig, { tsExtensions } from "@pob/eslint-config";
import pobPlugin from "@pob/eslint-plugin";
import { createNodeResolver } from "eslint-plugin-import-x";
import importPluginOverrideConfig from "./plugins/import.js";
import jsxA11yConfigs from "./plugins/jsx-a11y.js";
import reactHooksConfigs from "./plugins/react-hooks.js";
import reactConfigs from "./plugins/react.js";

export { apply, applyTs } from "@pob/eslint-config";

export default () => {
  const { configs } = basePobConfig();

  const createConfig = (base) => [
    ...base,
    importPluginOverrideConfig,

    ...[
      pobPlugin.configs.react,
      {
        settings: {
          "import-x/resolver-next": [
            createNodeResolver({
              extensions: [
                ".mjs",
                ".js",
                ".json",
                ".ts",
                ".tsx",
                ".d.ts",
                ".d.tsx",
              ],
            }),
          ],
        },
        rules: {
          "import-x/extensions": [
            "error",
            "always",
            {
              ignorePackages: true,
              pattern: {
                js: "always",
                cjs: "always",
                mjs: "always",
                cts: "always",
                mts: "always",
                ts: "never",
                tsx: "never",
              },
            },
          ],
          // "react/jsx-filename-extension": ["error", { extensions: ["tsx"] }],
        },
      },
      ...reactConfigs,
      ...reactHooksConfigs,
      ...jsxA11yConfigs,
    ].map((config) => ({
      ...config,
      files: [`**/*.${tsExtensions}`],
    })),
  ];
  return {
    configs: {
      base: createConfig(configs.baseModule),
      node: createConfig(configs.node),

      allowUnsafe: configs.allowUnsafe,
      allowUnsafeAsWarn: configs.allowUnsafeAsWarn,
      allowImplicitReturnType: configs.allowImplicitReturnType,
      app: configs.app,

      "react-native": [
        {
          settings: {
            "import-x/resolver-next": [
              createNodeResolver({
                extensions: [
                  ".js", // needed to resolve js files from node_modules
                  ".cjs",
                  ".mjs",
                  ".ts",
                  ".tsx",
                  ".ios.ts",
                  ".ios.tsx",
                  ".android.ts",
                  ".android.tsx",
                ],
                conditionNames: ["import", "react-native"],
              }),
            ],
          },
          rules: {
            "import-x/extensions": [
              "error",
              "always",
              {
                ignorePackages: true,
                pattern: {
                  js: "always",
                  cjs: "always",
                  mjs: "always",
                  cts: "always",
                  mts: "always",
                  ts: "never",
                  tsx: "never",
                },
              },
            ],
          },
        },
      ],

      "react-native-web": [
        {
          settings: {
            "import-x/resolver-next": [
              createNodeResolver({
                extensions: [
                  ".js", // needed to resolve js files from node_modules
                  ".cjs",
                  ".mjs",
                  ".ts",
                  ".tsx",
                  ".web.ts",
                  ".web.tsx",
                ],
                conditionNames: ["import", "browser"],
              }),
            ],
          },
          rules: {
            "import-x/extensions": [
              "error",
              "always",
              {
                ignorePackages: true,
                pattern: {
                  js: "always",
                  cjs: "always",
                  mjs: "always",
                  cts: "always",
                  mts: "never",
                  ts: "never",
                  tsx: "never",
                },
              },
            ],
            "import-x/no-unresolved": [
              "error",
              {
                ignore: [
                  // allow react-native as it is replaced by react-native-web and typed by @types/react-native. react-native lib does not need to be installed in that case
                  "react-native",
                ],
              },
            ],
          },
        },
      ],
    },
  };
};
