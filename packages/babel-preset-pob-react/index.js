const presetReact = require('babel-preset-react');
const pluginReactRequire = require('babel-plugin-react-require');
const pluginTransformReactJSXSelf = require('babel-plugin-transform-react-jsx-self');
const pluginTransformReactJSXSource = require('babel-plugin-transform-react-jsx-source');


module.exports = function (context, opts = {}) {
  const production = opts.production !== undefined ? opts.production : (process.env.NODE_ENV === 'production');
  if (typeof production !== 'boolean') throw new Error("Preset pob-react 'production' option must be a boolean.");

  return {
    presets: presetReact,
    plugins: [
      pluginReactRequire,
      !production && pluginTransformReactJSXSelf,
      !production && pluginTransformReactJSXSource,
    ].filter(Boolean),
  };
};
