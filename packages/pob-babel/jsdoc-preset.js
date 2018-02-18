'use strict';

const pobEnvPreset = require('babel-preset-pob-env');

module.exports = function(context, opts) {
  return {
    presets: [
      [
        pobEnvPreset,
        {
          modules: 'commonjs',
          react: opts.react,
          flow: opts.flow,
          target: false,
          production: true,
          loose: true,
        },
      ],
      // require.resolve('babel-preset-jsdoc'),
    ],
    plugins: [
      require.resolve('babel-plugin-add-jsdoc-annotations'),
      require.resolve('babel-plugin-transform-flow-strip-types'),
    ],
  };
};
