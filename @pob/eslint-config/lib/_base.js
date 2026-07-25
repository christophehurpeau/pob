import js from "@eslint/js";
import pobPlugin from "@pob/eslint-plugin";
import jsonConfigs from "./languages/json.js";
import regexpPluginConfigs from "./plugins/regexp.js";
import unicornPluginConfigs from "./plugins/unicorn.js";
import bestPracticesConfig from "./rules/best-practices.js";
import codeQualityConfig from "./rules/code-quality.js";
import devOnlyConfig from "./rules/dev-only.js";
import errorsConfig from "./rules/errors.js";
import styleConfig from "./rules/style.js";
import { apply } from "./utils/apply.js";

export default [
  {
    name: "@pob/eslint-config/base/linterOptions",
    linterOptions: {
      // todo noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },
  {
    name: "@pob/eslint-config/base/pob-plugin",
    plugins: {
      "@pob": pobPlugin,
    },
  },
  {
    name: "@pob/eslint-config/base/ignores",
    ignores: [
      ".yarn",
      "**/dist/",
      "**/build/",
      "**/coverage/",
      "**/.next/",
      "**/.tamagui/",
      "**/*.d.ts",
    ],
  },
  ...jsonConfigs,
  ...apply({
    extensions: "{js,mjs,cjs,ts,tsx}",
    mode: "add-extensions",
    configs: [
      { name: "js.configs.recommended", ...js.configs.recommended },
      pobPlugin.configs.base,
      ...unicornPluginConfigs,
      ...regexpPluginConfigs,
      bestPracticesConfig,
      codeQualityConfig,
      errorsConfig,
      styleConfig,
    ],
  }),
  devOnlyConfig,
];
