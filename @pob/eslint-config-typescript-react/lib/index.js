import basePobConfig, { tsExtensions } from "@pob/eslint-config";
import { createNodeResolver } from "eslint-plugin-import-x";
import importPluginOverrideConfig from "./plugins/import.js";

// react, react-hooks and jsx-a11y rules are checked by oxlint, see
// oxlint/react.json: eslint only resolves the imports of TSX files

export { apply, applyTs } from "@pob/eslint-config";

const { configs } = basePobConfig;

/**
 * @param {import("eslint").Linter.Config[]} base
 * @returns {import("eslint").Linter.Config[]}
 */
const createConfig = (base) => [
  ...base,
  {
    ...importPluginOverrideConfig,
    files: [`**/*.${tsExtensions}`],
    settings: {
      ...importPluginOverrideConfig.settings,
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
  },
];

export default {
  configs: {
    base: createConfig(configs.baseModule),
    node: createConfig(configs.node),

    monorepo: configs.monorepo,

    "react-native": [
      {
        name: "@pob/eslint-config-typescript-react/react-native",
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
      },
    ],

    "react-native-web": [
      {
        name: "@pob/eslint-config-typescript-react/react-native-web",
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
