'use strict';

// const pluginTransformReactJSXSelf = require.resolve('babel-plugin-transform-react-jsx-self');
// const pluginTransformReactJSXSource = require.resolve('babel-plugin-transform-react-jsx-source');

module.exports = function(context, opts) {
  opts = opts || {};
  const production =
    opts.production !== undefined ? opts.production : process.env.NODE_ENV === 'production';
  if (typeof production !== 'boolean') {
    throw new Error("Preset pob-react 'production' option must be a boolean.");
  }

  return {
    presets: require.resolve('babel-preset-react'),
    plugins: [
      require.resolve('babel-plugin-react-require'),
      // !production && pluginTransformReactJSXSelf,
      // !production && pluginTransformReactJSXSource,
    ].filter(Boolean),
  };
};
