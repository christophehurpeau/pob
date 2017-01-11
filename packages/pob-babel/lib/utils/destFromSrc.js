const path = require('path');
const plugins = require('../plugins');

module.exports = function destFromSrc(relative, plugin) {
  if (plugin === undefined) {
    const extension = path.extname(relative);
    if (extension && extension.length > 1) {
      plugin = plugins.findByExtension(extension.substr(1));
    }
  }
  if (plugin) {
    if (plugin.destExtension) {
      return relative.slice(0, -(plugin.extension.length)) + plugin.destExtension;
    } else {
      return relative;
    }
  }

  if (relative.endsWith('jsx')) return relative.slice(0, -1);
  return relative;
};
