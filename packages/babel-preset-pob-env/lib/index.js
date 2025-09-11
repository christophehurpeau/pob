/* eslint-disable complexity */

import { createRequire } from "node:module";
import fixClassPropertiesUninitialized from "babel-plugin-fix-class-properties-uninitialized";
import replacePlugin from "./pob-babel-replace-plugin.js";

const validTargetOption = [false, "node", "browser"];

export default function (context, opts = {}) {
  const require = createRequire(import.meta.url);

  ["loose", "optimizations", "typescript"].forEach((optionName) => {
    if (
      opts[optionName] !== undefined &&
      typeof opts[optionName] !== "boolean"
    ) {
      throw new Error(
        `Preset pob-env '${optionName}' option must be a boolean.`,
      );
    }
  });

  ["flow", "production", "replacements"].forEach((optionName) => {
    if (opts[optionName] !== undefined) {
      throw new Error(`option "${optionName}" is deprecated.`);
    }
  });

  const targetOption = opts.target !== undefined ? opts.target : "node";
  const versionOption =
    opts.target !== undefined ? String(opts.version) : "current";

  if (versionOption === "jest") throw new Error('Invalid version "jest"');

  if (targetOption && !validTargetOption.includes(targetOption)) {
    throw new Error(
      `Preset pob-env 'target' option must one of ${validTargetOption.join(
        ", ",
      )}.`,
    );
  }

  const loose = opts.loose !== undefined ? opts.loose : false;
  const optimizations =
    opts.optimizations !== undefined ? opts.optimizations : true;
  const typescript = opts.typescript !== undefined ? opts.typescript : true;
  const modules = opts.modules !== undefined ? opts.modules : false;

  const resolvePreset = opts.resolvePreset || ((preset) => preset);

  if (opts.exportDefaultName !== undefined) {
    throw new TypeError("Preset pob-env 'exportDefaultName' was removed.");
  }

  if (modules !== false && modules !== "commonjs") {
    throw new Error(
      "Preset pob-env 'modules' option must be 'false' to indicate no modules\n" +
        "or 'commonjs' (default)",
    );
  }

  let targetPreset;
  let targetPlugins;

  switch (targetOption) {
    case "node":
      // No need for preset
      // targetPreset = [
      //   '@babel/preset-env',
      //   { modules, loose, targets: { node: versionOption } },
      // ];
      if (modules === "commonjs") {
        targetPlugins = [
          [
            require("@babel/plugin-transform-modules-commonjs"),
            { loose, importInterop: "node" },
          ],
        ];
      }
      break;

    case "browser":
      if (versionOption === "modern") {
        targetPreset = [
          resolvePreset("@babel/preset-env"),
          {
            modules,
            loose,
            shippedProposals: true,
            bugfixes: true,
            // does not work for monorepos
            // browserslistEnv: 'modern',
            targets: "defaults and >1% and supports es6-module",
          },
        ];
      } else {
        targetPreset = [
          resolvePreset("@babel/preset-env"),
          {
            modules,
            loose,
            shippedProposals: true,
            bugfixes: true,
            targets: [
              "defaults",
              "> 0.2%",
              "not ie < 12",
              "not safari < 10",
              "not ios_saf < 10",
            ],
          },
        ];
      }
      break;

    case false:
      targetPreset = null;
      break;

    default:
      throw new Error("Invalid target");
  }

  return {
    // preset order is last to first, so we reverse it for clarity.
    presets: [
      // fix for typescript
      typescript && {
        plugins: [
          // class properties with fix
          fixClassPropertiesUninitialized,
        ],
      },

      // typescript
      typescript && [
        require.resolve("@babel/preset-typescript"),
        {
          // disabled because fixed by babel-plugin-fix-class-properties-uninitialized
          allowDeclareFields: false,
          optimizeConstEnums: true,
        },
      ],

      // proposals
      targetPlugins && {
        plugins: targetPlugins,
      },

      // plugins
      {
        plugins: [
          [
            replacePlugin,
            {
              target: targetOption,
              targetVersion: versionOption,
            },
          ],
        ],
      },

      // optimizations: remove dead-code
      optimizations && [
        require.resolve("babel-preset-optimizations"),
        {
          keepFnName: true,
          keepClassName: true,
          simplify: false,
          undefinedToVoid: false,
        },
      ],

      // discard unused imports (like production-only or node-only imports)
      {
        plugins: [[require.resolve("babel-plugin-discard-module-references")]],
      },

      // transpile for specified target
      targetPreset,
    ]
      .toReversed()
      .filter(Boolean),
  };
}
