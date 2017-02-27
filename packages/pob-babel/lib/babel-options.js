/* eslint-disable global-require */

module.exports = function createOpts(
  env,
  react,
  { presets: otherPresets, plugins: otherPlugins } = {}
) {
  const production = !env.endsWith('-dev');

  if (!production) {
    env = env.slice(0, -4);
  }

  if (env === 'doc') {
    return {
      presets: [
        'jsdoc',
        react && 'babel-preset-pob-react',
        require.resolve('babel-preset-stage-1'),
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

    case 'test':
    case 'node7':
      transpilationPreset = ['latest-node', { target: 7.6 }];
      browser = false;
      break;

    case 'node6':
      transpilationPreset = ['latest-node', { target: 6.5 }];
      browser = false;
      break;

    case 'older-node':
      transpilationPreset = 'latest';
      browser = false;
      break;

    case 'webpack-node7':
      transpilationPreset = ['latest-node', { target: 7.6, modules: false }];
      browser = false;
      break;

    case 'webpack':
      transpilationPreset = ['latest', { es2015: { modules: false } }];
      browser = true;
      break;

    case 'webpack-modern-browsers':
      transpilationPreset = ['modern-browsers', { modules: false }];
      browser = true;
      break;

    case 'browsers':
      transpilationPreset = 'latest';
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
      // pob preset: flow, import `src`, export default function name, replacements
      [require.resolve('babel-preset-pob'), {
        production,
        replacements: {
          BROWSER: browser,
          NODEJS: !browser,
          SERVER: !browser,
        },
      }],
      // optimizations: remove dead-code
      require.resolve('babel-preset-babili-optimizations'),
      // discard unused imports (like production-only or node-only imports)
      { plugins: [require.resolve('babel-plugin-discard-module-references')] },
      // transpile for specified target
      transpilationPreset,
    ].reverse().concat(otherPresets || []).filter(Boolean),
    plugins: (otherPlugins || []).filter(Boolean),
  };
};
