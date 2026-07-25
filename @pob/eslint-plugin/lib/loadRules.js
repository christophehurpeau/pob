import fs from "node:fs";
import path from "node:path";
import forbidNonNativeFetchImportRule from "./rules/forbid-non-native-fetch-import.js";
import forbidNonNativeNodeImportsRule from "./rules/forbid-non-native-node-imports.js";
import reactFunctionComponentReturnReactNodeRule from "./rules/react-function-component-return-react-node.js";
import reactNamedImportRule from "./rules/react-named-import.js";

const pkg = JSON.parse(
  // eslint-disable-next-line unicorn/prefer-json-parse-buffer
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const repoUrl = "https://github.com/christophehurpeau/eslint-config-pob";
const packagePath = "@pob/eslint-plugin";

const getDocumentationUrl = (filename) => {
  const ruleName = path.basename(filename, ".js");
  return `${repoUrl}/blob/v${pkg.version}/${packagePath}/docs/rules/${ruleName}.md`;
};

function loadRule(ruleName, rule) {
  return {
    meta: {
      schema: [],
      ...rule.meta,
      docs: {
        ...rule.meta.docs,
        url: getDocumentationUrl(ruleName),
      },
    },
    create: rule.create,
  };
}

export function loadRules() {
  return {
    "forbid-non-native-fetch-import": loadRule(
      "forbid-non-native-fetch-import",
      forbidNonNativeFetchImportRule,
    ),
    "forbid-non-native-node-imports": loadRule(
      "forbid-non-native-node-imports",
      forbidNonNativeNodeImportsRule,
    ),
    "react-function-component-return-react-node": loadRule(
      "react-function-component-return-react-node",
      reactFunctionComponentReturnReactNodeRule,
    ),
    "react-named-import": loadRule("react-named-import", reactNamedImportRule),
  };
}
