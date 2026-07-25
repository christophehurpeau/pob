import tseslint from "typescript-eslint";
import baseConfigs from "./_base.js";
import baseCommonjsConfig from "./base/commonjs.js";
import baseModuleConfig from "./base/module.js";
import nodePluginCommonjsConfigs from "./node/commonjs.js";
import nodePluginModuleConfigs from "./node/module.js";
import nodeTypescriptConfigs from "./node/typescript.js";
import allowImplicitReturnTypeConfig from "./overrides/allow-implicit-return-type.js";
import allowUnsafeAsWarnConfig from "./overrides/allow-unsafe-as-warn.js";
import allowUnsafeConfig from "./overrides/allow-unsafe.js";
import appConfig from "./overrides/app.js";
import scriptsOverrideConfig from "./overrides/scripts.js";
import {
  testOverrideConfigsWithTypescript,
  testOverrideConfigsWithoutTypescript,
} from "./overrides/test.js";
import importPluginBaseConfigs from "./plugins/import/import-base.js";
import importPluginCommonjsConfig from "./plugins/import/import-commonjs.js";
import importPluginModuleConfig from "./plugins/import/import-module.js";
import typescriptReplaceEslintConfig from "./plugins/typescript-eslint/typescript-eslint-replace-eslint.js";
import typescriptReplaceUnicornConfig from "./plugins/typescript-eslint/typescript-eslint-replace-unicorn.js";
import typescriptPluginRulesConfig from "./plugins/typescript-eslint/typescript-eslint-rules.js";
import typescriptRulesConfig from "./rules/typescript.js";
import { apply } from "./utils/apply.js";

export { apply } from "./utils/apply.js";

export const tsExtensions = "{ts,cts,mts,tsx}";

export const applyTs = (options) =>
  apply({
    extensions: tsExtensions,
    ...options,
  });

// @ts-expect-error -- missing files declaration
const tsFiles = tseslint.configs.strictTypeChecked[1].files;
if (!tsFiles) {
  throw new Error(
    'Unexpected "tseslint.configs.strictTypeChecked[1].files" value',
  );
}

export default () => {
  const extensions = "{js,cjs,mjs}";

  const testFiles = [
    `**/*.{test,test-e2e,spec}.${extensions}`,
    `**/__tests__/**/*.${extensions}`,
    `**/__mocks__/**/*.${extensions}`,
  ];

  const tsTestFiles = [
    `**/*.test.${tsExtensions}`,
    `**/*.test-e2e.${tsExtensions}`,
    `**/__tests__/**/*.${tsExtensions}`,
    `**/__mocks__/**/*.${tsExtensions}`,
  ];

  const typescriptConfigs = [
    ...applyTs({
      filesOverridesIf: [tsFiles],
      configs: [
        ...tseslint.configs.strictTypeChecked,
        typescriptReplaceUnicornConfig,
        typescriptReplaceEslintConfig,
        typescriptPluginRulesConfig,
        typescriptRulesConfig,
      ],
    }),
    ...apply({
      files: tsTestFiles,
      configs: testOverrideConfigsWithTypescript,
    }),
  ];

  /** @deprecated */
  const nodeCommonjs = [
    ...baseConfigs,
    ...apply({
      mode: "keep-files-if-exists",
      files: ["**/*.{js,cjs,mjs,mts,ts,tsx,cts}"],
      configs: [
        baseCommonjsConfig,
        ...importPluginBaseConfigs,
        importPluginCommonjsConfig,
        ...nodePluginCommonjsConfigs,
      ],
    }),

    ...apply({
      extensions,
      mode: "directory",
      files: ["**/scripts/"],
      configs: [scriptsOverrideConfig],
    }),

    ...apply({
      files: ["**/*.{mjs,mts}"],
      mode: "keep-files-if-exists",
      configs: [
        baseModuleConfig,
        importPluginModuleConfig,
        ...nodePluginModuleConfigs,
      ],
    }),

    ...apply({
      files: testFiles,
      configs: testOverrideConfigsWithoutTypescript,
    }),
  ];

  const baseModule = [
    ...baseConfigs,
    ...apply({
      mode: "keep-files-if-exists",
      files: ["**/*.{js,mjs,cjs,mts,ts,tsx,cts}"],
      configs: [
        baseModuleConfig,
        ...importPluginBaseConfigs,
        importPluginModuleConfig,
      ],
    }),

    ...apply({
      mode: "keep-files-if-exists",
      files: ["**/*.{cjs,cts}"],
      configs: [baseCommonjsConfig, importPluginCommonjsConfig],
    }),

    ...typescriptConfigs,
  ];

  const nodeModule = [
    ...baseModule,
    ...apply({
      mode: "keep-files-if-exists",
      files: ["**/*.{js,mjs,mts,ts,tsx}"],
      configs: [...nodePluginModuleConfigs],
    }),

    ...apply({
      extensions,
      mode: "directory",
      files: ["**/scripts/"],
      configs: [scriptsOverrideConfig],
    }),

    ...apply({
      mode: "keep-files-if-exists",
      files: ["**/*.{cjs,cts}"],
      configs: [...nodePluginCommonjsConfigs],
    }),

    ...nodeTypescriptConfigs,
  ];

  return {
    configs: {
      baseModule: [
        ...baseModule,
        ...apply({
          extensions,
          mode: "directory",
          files: ["**/scripts/"],
          configs: [...nodePluginModuleConfigs, scriptsOverrideConfig],
        }),
      ],
      /** @deprecated */
      nodeModule,
      /** @deprecated */
      nodeCommonjs,
      node: nodeModule,

      allowImplicitReturnType: applyTs({
        configs: [allowImplicitReturnTypeConfig],
      }),

      allowUnsafe: applyTs({
        configs: [allowUnsafeConfig],
      }),

      allowUnsafeAsWarn: applyTs({
        configs: [allowUnsafeAsWarnConfig],
      }),

      app: applyTs({
        configs: [appConfig],
      }),
    },
  };
};
