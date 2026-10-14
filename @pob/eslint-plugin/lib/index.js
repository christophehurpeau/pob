import { loadRules } from "./loadRules.js";

// rules run by oxlint as a JS plugin, see @pob/eslint-config/oxlint/*.json
export default {
  meta: {
    name: "@pob/eslint-plugin",
    namespace: "@pob",
  },
  rules: {
    ...loadRules(),
  },
};
