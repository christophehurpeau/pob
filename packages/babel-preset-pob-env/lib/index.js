/* eslint-disable complexity */

'use strict';

const validTargetOption = [false, 'node', 'browser'];

module.exports = function(context, opts) {
  // `|| {}` to support node 4
  opts = opts || {};
  const targetOption = opts.target !== undefined ? opts.target : 'node';
  const versionOption = opts.target !== undefined ? String(opts.version) : 'current';

  if (versionOption === 'jest') throw new Error('Invalid version "jest"');

  // use indexOf to support node 4
  if (targetOption && validTargetOption.indexOf(targetOption) === -1) {
    throw new Error(`Preset pob-env 'target' option must one of ${validTargetOption.join(', ')}.`);
  }

  ['production', 'loose', 'optimizations', 'typescript'].forEach(optionName => {
    if (opts[optionName] !== undefined && typeof opts[optionName] !== 'boolean') {
      throw new Error(`Preset pob-env '${optionName}' option must be a boolean.`);
    }
  });

  if (opts.flow !== undefined) throw new Error('option flow is deprecated.');

  const production =
    opts.production !== undefined ? opts.production : process.env.NODE_ENV === 'production';
  const loose = opts.loose !== undefined ? opts.loose : false;
  const optimizations = opts.optimizations !== undefined ? opts.optimizations : true;
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

  if (typeof exportDefaultName !== 'boolean') {
    throw new Error("Preset pob-env 'exportDefaultName' option must be an boolean.");
  }

  if (typeof replacements !== 'object') {
    throw new Error(
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
    throw new Error("Preset pob-env 'production' option cannot be false with jest");
  }

  const replacementsKeys = Object.keys(replacements);
  // use indexOf to support node 4
  if (replacementsKeys.indexOf('PRODUCTION') !== -1) {
    throw new Error(
      "Preset pob-env 'replacements.production' is reserved. Use option 'production' if you want to change it."
    );
  }
  replacementsKeys.forEach(key => {
    if (key.toUpperCase() !== key) console.warn('warning: replacement key should be in uppercase.');
    if (typeof replacements[key] !== 'boolean') {
      throw new Error(`Preset pob-env 'replacements.${key}' option must be a boolean.`);
    }
  });

  replacements.PRODUCTION = production;
  replacementsKeys.push('PRODUCTION');

  let targetPreset;

  switch (targetOption) {
    case 'node':
      if (versionOption === 'current') {
        if (process.versions.node.startsWith('4.')) {
          targetPreset = [
            '@babel/preset-env',
            { modules, loose, shippedProposals: true, targets: { node: 4 } },
          ];
        } else {
          targetPreset = ['latest-node', { modules, loose, target: 'current' }];
        }
      } else if (versionOption === '4' || versionOption === 'lts') {
        targetPreset = [
          '@babel/preset-env',
          { modules, loose, shippedProposals: true, targets: { node: 4 } },
        ];
      } else {
        // targetPreset = ['@babel/preset-env', { modules, loose, targets: { node: versionOption } }];
        targetPreset = ['latest-node', { modules, loose, target: versionOption }];
      }
      break;

    case 'browser':
      if (versionOption === 'modern') {
        targetPreset = ['modern-browsers', { modules, loose }];
        // targetPreset = ['@babel/preset-env', { modules, loose }];
      } else {
        targetPreset = ['@babel/preset-env', { modules, loose, shippedProposals: true }];
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
          [require.resolve('@babel/plugin-proposal-class-properties'), { loose }],
          require.resolve('@babel/plugin-proposal-export-default-from'),
          require.resolve('@babel/plugin-proposal-export-namespace-from'),
          [require.resolve('@babel/plugin-proposal-object-rest-spread'), { useBuiltIns: true }],
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
              replacements: replacementsKeys
                .map(key => ({
                  identifierName: key,
                  replacement: { type: 'booleanLiteral', value: replacements[key] },
                }))
                .concat([
                  {
                    identifierName: 'process.env.NODE_ENV',
                    replacement: {
                      type: 'stringLiteral',
                      value: process.env.NODE_ENV || 'development',
                    },
                  },
                  {
                    identifierName: 'process.env.POB_TARGET',
                    replacement: { type: 'stringLiteral', value: targetOption },
                  },
                  {
                    identifierName: 'process.env.POB_TARGET_VERSION',
                    replacement: { type: 'stringLiteral', value: versionOption },
                  },
                ]),
            },
          ],
        ].filter(Boolean),
      },

      // optimizations: remove dead-code
      optimizations && require.resolve('babel-preset-optimizations'),

      // discard unused imports (like production-only or node-only imports)
      { plugins: [require.resolve('babel-plugin-discard-module-references')] },

      // transpile for specified target
      targetPreset,
    ]
      .reverse()
      .filter(Boolean),
  };
};
