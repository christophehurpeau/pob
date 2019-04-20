/* eslint-disable complexity, max-lines */

'use strict';

const validTargetOption = [false, 'node', 'browser'];

module.exports = function(context, opts) {
  // `|| {}` to support node 4
  opts = opts || {};
  const targetOption = opts.target !== undefined ? opts.target : 'node';
  const versionOption =
    opts.target !== undefined ? String(opts.version) : 'current';

  if (versionOption === 'jest') throw new Error('Invalid version "jest"');

  if (targetOption && !validTargetOption.includes(targetOption)) {
    throw new Error(
      `Preset pob-env 'target' option must one of ${validTargetOption.join(
        ', '
      )}.`
    );
  }

  ['production', 'loose', 'optimizations', 'typescript'].forEach(
    (optionName) => {
      if (
        opts[optionName] !== undefined &&
        typeof opts[optionName] !== 'boolean'
      ) {
        throw new Error(
          `Preset pob-env '${optionName}' option must be a boolean.`
        );
      }
    }
  );

  if (opts.flow !== undefined) throw new Error('option flow is deprecated.');

  const production =
    opts.production !== undefined
      ? opts.production
      : process.env.NODE_ENV === 'production';
  const loose = opts.loose !== undefined ? opts.loose : false;
  const optimizations =
    opts.optimizations !== undefined ? opts.optimizations : true;
  const typescript = opts.typescript !== undefined ? opts.typescript : true;
  const modules = opts.modules !== undefined ? opts.modules : 'commonjs';

  const replacements =
    opts.replacements !== undefined
      ? opts.replacements
      : {
          BROWSER: targetOption === 'browser',
          NODEJS: targetOption === 'node',
          SERVER: targetOption === 'node',
        };

  const exportDefaultName =
    opts.exportDefaultName !== undefined
      ? opts.exportDefaultName
      : targetOption === 'node' || !production;

  const resolvePreset = opts.resolvePreset
    ? opts.resolvePreset
    : (preset) => preset;

  if (typeof exportDefaultName !== 'boolean') {
    throw new TypeError(
      "Preset pob-env 'exportDefaultName' option must be an boolean."
    );
  }

  if (typeof replacements !== 'object') {
    throw new TypeError(
      "Preset pob-env 'replacements' option must be an object or undefined (default)"
    );
  }

  if (modules !== false && modules !== 'commonjs') {
    throw new Error(
      "Preset pob-env 'modules' option must be 'false' to indicate no modules\n" +
        "or 'commonjs' (default)"
    );
  }

  if (production && targetOption === 'node' && versionOption === 'jest') {
    throw new Error(
      "Preset pob-env 'production' option cannot be false with jest"
    );
  }

  const replacementsKeys = Object.keys(replacements);
  ['PRODUCTION', 'POB_ENV', 'POB_TARGET', 'POB_TARGET_VERSION'].forEach(
    (key) => {
      if (replacementsKeys.includes(key)) {
        throw new Error(`Preset pob-env 'replacements.${key}' is reserved.`);
      }
    }
  );

  replacementsKeys.forEach((key) => {
    if (key.toUpperCase() !== key) {
      console.warn('warning: replacement key should be in uppercase.');
    }
    if (typeof replacements[key] !== 'boolean') {
      throw new TypeError(
        `Preset pob-env 'replacements.${key}' option must be a boolean.`
      );
    }
  });

  replacements.PRODUCTION = production;
  replacements.POB_ENV = production ? 'production' : 'development';
  replacements.POB_TARGET = targetOption;
  replacements.POB_TARGET_VERSION = versionOption;
  replacementsKeys.push(
    'PRODUCTION',
    'POB_ENV',
    'POB_TARGET',
    'POB_TARGET_VERSION'
  );

  let targetPreset;

  switch (targetOption) {
    case 'node':
      if (versionOption === 'current') {
        targetPreset = ['latest-node', { modules, loose, target: 'current' }];
      } else {
        // targetPreset = ['@babel/preset-env', { modules, loose, targets: { node: versionOption } }];
        targetPreset = [
          resolvePreset('babel-preset-latest-node'),
          { modules, loose, target: versionOption },
        ];
      }
      break;

    case 'browser':
      if (versionOption === 'modern') {
        targetPreset = [
          resolvePreset('babel-preset-modern-browsers'),
          { modules, loose },
        ];
        // targetPreset = ['@babel/preset-env', { modules, loose }];
      } else {
        targetPreset = [
          resolvePreset('@babel/preset-env'),
          { modules, loose, shippedProposals: true },
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
          // es2018:
          // @babel/plugin-proposal-object-rest-spread
          // @babel/plugin-proposal-unicode-property-regex
          // @babel/plugin-proposal-async-generator-functions

          // shipped proposals:
          // @babel/plugin-syntax-optional-catch-binding

          // not shipped proposals:
          require.resolve('babel-plugin-fix-class-properties-uninitialized'),
          [
            require.resolve('@babel/plugin-proposal-class-properties'),
            { loose },
          ],
          require.resolve('@babel/plugin-proposal-export-default-from'),
          require.resolve('@babel/plugin-proposal-export-namespace-from'),

          // async import
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ],
      },

      // typescript
      typescript && require.resolve('@babel/preset-typescript'),

      // plugins
      {
        plugins: [
          exportDefaultName && [
            require.resolve('babel-plugin-transform-name-export-default'),
            { compose: true },
          ],
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
          [require.resolve('babel-plugin-pob-babel'), { replacements }],
        ].filter(Boolean),
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
        plugins: [
          [
            require.resolve('babel-plugin-discard-module-references'),
            {
              targets: [
                // used to import typings
                'pob-babel',
              ],
            },
          ],
        ],
      },

      // transpile for specified target
      targetPreset,
    ]
      .reverse()
      .filter(Boolean),
  };
};
