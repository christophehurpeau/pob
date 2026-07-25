import { createNodeResolver } from "eslint-plugin-import-x";

export default {
  name: "@pob/eslint-config/node",
  settings: {
    "import-x/resolver-next": [
      createNodeResolver({
        extensions: [".mjs", ".js", ".json", ".ts"],
        conditionNames: ["node", "import"],
      }),
    ],
  },
  rules: {
    // ensure deprecated eslint rules are disabled
    "callback-return": "off",
    "global-require": "off",
    "handle-callback-err": "off",
    "no-mixed-requires": "off",
    "no-new-require": "off",
    "no-path-concat": "off",
    "no-process-env": "off",
    "no-process-exit": "off",
    "no-restricted-modules": "off",
    "no-sync": "off",
  },
};
