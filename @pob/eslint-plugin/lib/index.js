import baseConfig from "./configs/base.js";
import nodeConfig from "./configs/node.js";
import reactConfig from "./configs/react.js";
import { loadRules } from "./loadRules.js";

export default {
  rules: {
    ...loadRules(),
  },
  configs: {
    base: baseConfig,
    react: reactConfig,
    node: nodeConfig,
  },
};
