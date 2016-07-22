const plugins = new Map();

module.exports = {
    plugins,
    findByExtension: ext => plugins.get(ext),
    register: plugin => plugins.set(plugin.extension, plugin),
};
