/* eslint-disable global-require */

const resolvePreset = function (presetName) {
  return require.resolve(`babel-preset-${presetName}`);
};

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
        react && 'react',
        resolvePreset('stage-1'),
      ].filter(Boolean),
      plugins: [
        'add-jsdoc-annotations',
        require('babel-plugin-transform-flow-strip-types'),
      ],
    };
  }

  let presets;
  let browser;

  switch (env) {
    case 'es5':
      throw new Error('use olderNode instead.');

    case 'test':
    case 'node6':
      presets = [
        'es2015-node6',
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = false;
      break;

    case 'older-node':
      presets = [
        'es2015',
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = false;
      break;

    case 'webpack':
      presets = [
        ['es2015', { modules: false }],
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = true;
      break;

    case 'webpack-modern-browsers':
      presets = [
        ['modern-browsers', { modules: false }],
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = true;
      break;

    case 'browsers':
      presets = [
        'es2015',
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = true;
      break;

    default:
      throw new Error(`Unsupported env ${env}`);

  }

  return {
    presets: presets.concat(otherPresets || []).filter(Boolean),
    plugins: [
      require('babel-plugin-syntax-flow'),
      [require('babel-plugin-import-export-rename'), { '^([a-z\\-]+|[./]+)/src(.*)$': '$1$2' }],
      !production && [require('babel-plugin-transform-export-default-name-forked'), { compose: true }],
      !production && require('babel-plugin-tcomb-forked'),
      require('babel-plugin-transform-flow-strip-types'),
      react && require('babel-plugin-react-require'),
      !production && react && require('babel-plugin-transform-react-jsx-self'),
      !production && react && require('babel-plugin-transform-react-jsx-source'),

      [require('babel-plugin-minify-replace'), {
        replacements: [
          {
            identifierName: 'PRODUCTION',
            replacement: { type: 'booleanLiteral', value: production },
          },
          {
            identifierName: 'BROWSER',
            replacement: { type: 'booleanLiteral', value: browser },
          },
          {
            identifierName: 'SERVER',
            replacement: { type: 'booleanLiteral', value: !browser },
          },
          {
            identifierName: 'NODEJS',
            replacement: { type: 'booleanLiteral', value: !browser },
          },
        ],
      }],
      require('babel-plugin-minify-constant-folding'),
      [require('babel-plugin-minify-dead-code-elimination'), { keepFnName: true, keepFnames: true }],
      require('babel-plugin-minify-guarded-expressions'),
      require('babel-plugin-discard-module-references'),
      ...(otherPlugins || []),
    ].filter(Boolean),
  };
};
