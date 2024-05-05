"use strict";

module.exports = function babelConfig(api) {
  const isTest = api.env("test");

  if (!isTest) return {};

  return {
    only: [
      "packages/*/src",
      "packages/*/lib",
      "@pob/*/src",
      "@pob/*/lib",
      "pob-examples/*/src",
      "pob-examples/*/lib",
    ],
    presets: [["pob-babel/preset.js", { modules: false }]],
  };
};
