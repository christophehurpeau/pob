/* eslint-disable global-require */

module.exports = function createOpts(
  env,
  react,
  { presets: otherPresets, plugins: otherPlugins } = {},
) {
  const devEnv = env.endsWith('-dev');
  const production = !devEnv && env !== 'jest';

  if (devEnv) env = env.slice(0, -4);

  if (env === 'doc') {
    return {
      presets: [
        'jsdoc',
        react && 'babel-preset-pob-react',
        require.resolve('babel-preset-pob-stages'),
        [
          require.resolve('babel-preset-pob'),
          {
            production: false,
          },
        ],
      ].filter(Boolean),
      plugins: [
        'add-jsdoc-annotations',
        require.resolve('babel-plugin-transform-flow-strip-types'),
      ],
    };
  }

  let transpilationPreset;
  let browser;

  switch (env) {
    case 'es5':
      throw new Error('use olderNode instead.');

    case 'jest':
    case 'node8':
      transpilationPreset = ['latest-node', { target: 8 }];
      browser = false;
      break;

    case 'node7':
      console.warn('env "node7" is deprecated, use "node8" instead');
      transpilationPreset = ['latest-node', { target: 7.6 }];
      browser = false;
      break;

    case 'node6':
      transpilationPreset = ['latest-node', { target: 6.5 }];
      browser = false;
      break;

    case 'older-node':
      transpilationPreset = ['env', { targets: { node: 4 } }];
      browser = false;
      break;

    case 'module-node8':
      transpilationPreset = ['latest-node', { target: 8, modules: false }];
      browser = false;
      break;

    case 'module-node7':
    case 'webpack-node7':
      console.warn(`env "${env}" is deprecated, use "module-node8" instead`);
      transpilationPreset = ['latest-node', { target: 7.6, modules: false }];
      browser = false;
      break;

    case 'module':
    case 'webpack':
      transpilationPreset = ['env', { modules: false }];
      browser = true;
      break;

    case 'module-modern-browsers':
    case 'webpack-modern-browsers':
      transpilationPreset = ['modern-browsers', { modules: false }];
      browser = true;
      break;

    case 'browsers':
      transpilationPreset = 'env';
      browser = true;
      break;

    default:
      throw new Error(`Unsupported env ${env}`);
  }

  return {
    // preset order is last to first, so we reverse it for clarity.
    presets: [
      // add react preset with jsx
      react && ['babel-preset-pob-react', { production }],
      // add stage-1 to stage-3 features
      require.resolve('babel-preset-pob-stages'),
      // pob preset: import `src`, export default function name, replacements
      [
        require.resolve('babel-preset-pob'),
        {
          production,
          replacements: {
            BROWSER: browser,
            NODEJS: !browser,
            SERVER: !browser,
          },
        },
      ],
      // optimizations: remove dead-code
      require.resolve('babel-preset-babili-optimizations'),
      // flow runtime
      !production && {
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
      transpilationPreset,
    ]
      .reverse()
      .concat(otherPresets || [])
      .filter(Boolean),
    plugins: (otherPlugins || []).filter(Boolean),
  };
};
