'use strict';

const emptyFile = 'export default {}';
const emptyFileName =
  '\0rollup_plugin_ignoreBrowserOnlyImports_empty_module_placeholder';

module.exports = function ignoreBrowserOnlyImports({ extensions }) {
  return {
    resolveId(importee) {
      return extensions.some((ext) => importee.endsWith(ext))
        ? emptyFileName
        : null;
    },
    load(id) {
      return id === emptyFileName ? emptyFile : null;
    },
  };
};
