const { safeLoad: saveLoadYml } = require('js-yaml');

module.exports = {
    extension: 'yml',
    destExtension: 'json',

    transform: content => ({
        code: JSON.stringify(saveLoadYml(content)),
        map: null,
    })
};
