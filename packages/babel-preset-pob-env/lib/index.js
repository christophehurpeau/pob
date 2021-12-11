/* eslint-disable max-lines */
/* eslint-disable complexity */

'use strict';

const validTargetOption = [false, 'node', 'browser'];

module.exports = function (context, opts = {}) {
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

  ['flow', 'production', 'modules'].forEach((optionName) => {
    if (opts[optionName] !== undefined) {
      throw new Error(`option "${optionName}" is deprecated.`);
    }
  });

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

  const replacements =
    opts.replacements !== undefined
      ? opts.replacements
      : {
          __TARGET__: targetOption,
          __TARGET_VERSION__: versionOption,
          BROWSER: targetOption === 'browser',
          NODEJS: targetOption === 'node',
          SERVER: targetOption === 'node',
        };

  if (typeof replacements !== 'object') {
    throw new TypeError(
      "Preset pob-env 'replacements' option must be an object or undefined (default)",
    );
  }

  const replacementsKeys = Object.keys(replacements);
  replacementsKeys.forEach((key) => {
    if (key.toUpperCase() !== key) {
      console.warn('warning: replacement key should be in uppercase.');
    }
    const type = typeof replacements[key];
    if (type !== 'boolean' && type !== 'string') {
      throw new TypeError(
        `Preset pob-env 'replacements.${key}' option must be a boolean or string.`,
      );
    }
  });

  const loose = opts.loose !== undefined ? opts.loose : false;
  const optimizations =
    opts.optimizations !== undefined ? opts.optimizations : true;
  const typescript = opts.typescript !== undefined ? opts.typescript : true;
  const modules = opts.modules !== undefined ? opts.modules : false;

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
      // fix for typescript
      typescript && {
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

      // plugins
      {
        plugins: [
          [
            require.resolve('babel-plugin-minify-replace'),
            {
              replacements: replacementsKeys.map((key) => ({
                identifierName: key,
                replacement: {
                  type: `${typeof replacements[key]}Literal`,
                  value: replacements[key],
                },
              })),
            },
          ],
        ],
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

      // discard unused imports (like production-only or node-only imports)
      {
        plugins: [[require.resolve('babel-plugin-discard-module-references')]],
      },

      // transpile for specified target
      targetPreset,
    ]
      .reverse()
      .filter(Boolean),
  };
};
