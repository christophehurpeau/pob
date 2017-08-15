const useDefault = obj => (obj.__esModule ? obj.default : obj);
const presetReact = useDefault(require('babel-preset-react'));
const pluginReactRequire = useDefault(require('babel-plugin-react-require'));
// const pluginTransformReactJSXSelf = useDefault(require('babel-plugin-transform-react-jsx-self'));
// const pluginTransformReactJSXSource = useDefault(
//   require('babel-plugin-transform-react-jsx-source')
// );

module.exports = function(context, opts = {}) {
  const production =
    opts.production !== undefined ? opts.production : process.env.NODE_ENV === 'production';
  if (typeof production !== 'boolean') {
    throw new Error("Preset pob-react 'production' option must be a boolean.");
  }

  return {
    presets: presetReact,
    plugins: [
      pluginReactRequire,
      // !production && pluginTransformReactJSXSelf,
      // !production && pluginTransformReactJSXSource,
    ].filter(Boolean),
  };
};
