const presetReact = require('babel-preset-react');
const pluginReactRequire = require('babel-plugin-react-require');
const pluginTransformReactJSXSelf = require('babel-plugin-transform-react-jsx-self');
const pluginTransformReactJSXSource = require('babel-plugin-transform-react-jsx-source');

const useDefault = thing => thing.default || thing;

function preset(context, opts = {}) {
  const production = opts.production !== undefined ? opts.production : (process.env.NODE_ENV !== 'production');
  if (typeof production !== "boolean") throw new Error("Preset pob-react 'production' option must be a boolean.");

  return {
    presets: presetReact,
    plugins: [
      useDefault(pluginReactRequire),
      !production && useDefault(pluginTransformReactJSXSelf),
      !production && useDefault(pluginTransformReactJSXSource),
    ].filter(Boolean)
  };
}

module.exports = preset({});

Object.defineProperty(module.exports, "buildPreset", {
  configurable: true,
  writable: true,
  enumerable: false,
  value: preset,
});
