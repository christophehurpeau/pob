import { createNodeResolver } from "eslint-plugin-import-x";

export default [
  {
    name: "@pob/eslint-config/node/typescript",
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({
          extensions: [".mjs", ".js", ".json", ".ts"],
          conditionNames: ["node", "import"],
        }),
      ],
    },
  },
];
