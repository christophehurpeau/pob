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

  ['production', 'loose', 'flow', 'optimizations'].forEach(optionName => {
    if (opts[optionName] !== undefined && typeof opts[optionName] !== 'boolean') {
      throw new Error(`Preset pob-env '${optionName}' option must be a boolean.`);
    }
  });

  const production =
    opts.production !== undefined ? opts.production : process.env.NODE_ENV === 'production';
  const loose = opts.loose !== undefined ? opts.loose : false;
  const flow = opts.flow !== undefined ? opts.flow : false;
  const optimizations = opts.optimizations !== undefined ? opts.optimizations : true;
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
          targetPreset = ['env', { modules, targets: { node: 4 } }];
        } else {
          targetPreset = ['latest-node', { modules, target: 'current' }];
        }
      } else if (versionOption === '4' || versionOption === 'lts') {
        targetPreset = ['env', { modules, targets: { node: 4 } }];
      } else {
        targetPreset = ['latest-node', { modules, target: versionOption }];
      }
      break;

    case 'browser':
      if (versionOption === 'modern') {
        targetPreset = ['modern-browsers', { modules, loose }];
      } else {
        targetPreset = ['env', { modules, loose }];
      }
      break;

    case false:
      targetPreset = null;
      break;
  }

  return {
    // preset order is last to first, so we reverse it for clarity.
    presets: [
      // flow
      flow && require.resolve('babel-preset-flow'),
      // add esnext features
      [require.resolve('babel-plugin-transform-object-rest-spread'), { useBuiltIns: true }],
      require.resolve('babel-plugin-transform-decorators-legacy'),
      require.resolve('babel-plugin-transform-class-properties'),
      require.resolve('babel-plugin-transform-export-extensions'),
      // plugins
      {
        plugins: [
          // rename 'module/src/' to 'module' (helps IDE autocomplete)
          [
            require.resolve('babel-plugin-import-export-rename'),
            { '^([a-z\\-]+|[./]+)/src(.*)$': '$1$2' },
          ],
          exportDefaultName && [
            require.resolve('babel-plugin-transform-name-export-default'),
            { compose: true },
          ],
          [
            require.resolve('babel-plugin-minify-replace'),
            {
              replacements: replacementsKeys.map(key => ({
                identifierName: key,
                replacement: { type: 'booleanLiteral', value: replacements[key] },
              })),
            },
          ],
        ].filter(Boolean),
      },
      // optimizations: remove dead-code
      optimizations && require.resolve('babel-preset-optimizations'),
      // flow runtime
      !production &&
        flow && {
          plugins: [
            [
              require.resolve('babel-plugin-flow-runtime'),
              {
                assert: true,
                annotate: false,
              },
            ],
          ],
        },
      // discard unused imports (like production-only or node-only imports)
      { plugins: [require.resolve('babel-plugin-discard-module-references')] },
      // transpile for specified target
      targetPreset,
    ]
      .reverse()
      .filter(Boolean),
  };
};
