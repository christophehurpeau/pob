/* eslint-disable complexity */

'use strict';

const validTargetOption = [false, 'node', 'browser'];

module.exports = function (context, opts) {
  // `|| {}` to support node 4
  opts = opts || {};
  const targetOption = opts.target !== undefined ? opts.target : 'node';
  const versionOption =
    opts.target !== undefined ? String(opts.version) : 'current';

  if (versionOption === 'jest') throw new Error('Invalid version "jest"');

  if (targetOption && !validTargetOption.includes(targetOption)) {
    throw new Error(
      `Preset pob-env 'target' option must one of ${validTargetOption.join(
        ', ',
      )}.`,
    );
  }

  ['loose', 'optimizations', 'typescript'].forEach((optionName) => {
    if (
      opts[optionName] !== undefined &&
      typeof opts[optionName] !== 'boolean'
    ) {
      throw new Error(
        `Preset pob-env '${optionName}' option must be a boolean.`,
      );
    }
  });

  ['flow', 'production', 'replacements'].forEach((optionName) => {
    if (opts[optionName] !== undefined) {
      throw new Error(`option "${optionName}" is deprecated.`);
    }
  });

  const loose = opts.loose !== undefined ? opts.loose : false;
  const optimizations =
    opts.optimizations !== undefined ? opts.optimizations : true;
  const typescript = opts.typescript !== undefined ? opts.typescript : true;
  const modules = opts.modules !== undefined ? opts.modules : 'commonjs';

  const resolvePreset = opts.resolvePreset
    ? opts.resolvePreset
    : (preset) => preset;

  if (opts.exportDefaultName !== undefined) {
    throw new TypeError("Preset pob-env 'exportDefaultName' was removed.");
  }

  if (modules !== false && modules !== 'commonjs') {
    throw new Error(
      "Preset pob-env 'modules' option must be 'false' to indicate no modules\n" +
        "or 'commonjs' (default)",
    );
  }

  let targetPreset;
  let targetPlugins;

  switch (targetOption) {
    case 'node':
      // No need for preset
      // targetPreset = [
      //   '@babel/preset-env',
      //   { modules, loose, targets: { node: versionOption } },
      // ];
      if (modules === 'commonjs') {
        targetPlugins = [
          [
            require('@babel/plugin-transform-modules-commonjs'),
            { loose, importInterop: 'node' },
          ],
        ];
      }
      break;

    case 'browser':
      if (versionOption === 'modern') {
        targetPreset = [
          resolvePreset('babel-preset-modern-browsers'),
          { modules, loose, shippedProposals: true },
        ];
        targetPlugins = [
          // var foo = object.foo ?? "default";
          require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),

          // const baz = obj?.foo?.bar?.baz;
          require.resolve('@babel/plugin-proposal-optional-chaining'),
        ];
        // targetPreset = ['@babel/preset-env', { modules, loose }];
      } else {
        targetPreset = [
          resolvePreset('@babel/preset-env'),
          { modules, loose, shippedProposals: true, bugfixes: true },
        ];
      }
      break;

    case false:
      targetPreset = null;
      break;
  }

  return {
    // preset order is last to first, so we reverse it for clarity.
    presets: [
      // add esnext features
      {
        plugins: [
          // class properties with fix
          require.resolve('babel-plugin-fix-class-properties-uninitialized'),
        ],
      },

      // typescript
      typescript && [
        require.resolve('@babel/preset-typescript'),
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

      // optimizations: remove dead-code
      optimizations && [
        require.resolve('babel-preset-optimizations'),
        {
          keepFnName: true,
          keepClassName: true,
          simplify: false,
          undefinedToVoid: false,
        },
      ],

      // transpile for specified target
      targetPreset,
    ]
      .reverse()
      .filter(Boolean),
  };
};
