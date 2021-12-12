'use strict';

module.exports = function babelConfig(api) {
  const isTest = api.env('test');

  if (!isTest) return {};

  return {
    only: [
      'packages/*/src',
      'packages/*/lib',
      '@pob/*/src',
      '@pob/*/lib',
      'examples/*/src',
      'examples/*/lib',
    ],
    presets: [[require.resolve('pob-babel/preset.cjs')]],
  };
};
