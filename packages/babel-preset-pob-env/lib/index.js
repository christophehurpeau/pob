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

  if (typeof replacements !== 'object') {
    throw new Error(
      "Preset latest-node 'replacements' option must be an object or undefined (default)"
    );
  }

  if (modules !== false && modules !== 'commonjs') {
    throw new Error(
      "Preset latest-node 'modules' option must be 'false' to indicate no modules\n" +
        "or 'commonjs' (default)"
    );
  }

  if (production && targetOption === 'node' && versionOption === 'jest') {
    throw new Error("Preset latest-node 'production' option cannot be false with jest");
  }

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
      // add stage-1 to stage-3 features
      require.resolve('babel-preset-pob-stages'),
      // pob preset: import `src`, export default function name, replacements
      [
        require.resolve('babel-preset-pob'),
        {
          production,
          loose,
          exportDefaultName: !production,
          replacements,
        },
      ],
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
