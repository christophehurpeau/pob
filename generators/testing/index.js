const generators = require('yeoman-generator');
const packageUtils = require('../../utils/package');

module.exports = generators.Base.extend({
    constructor: function() {
        generators.Base.apply(this, arguments);
        this.option('destination', {
            type: String,
            required: false,
            defaults: '',
            desc: 'Destination of the generated files.'
        });
    },

    initializing() {
        const testIndexPath = this.destinationPath(this.options.destination, 'test/src/index.js');
        if (!this.fs.exists(testIndexPath)) {
            this.fs.copy(this.templatePath('index.js'), testIndexPath);
        }
    },

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        packageUtils.addScripts(pkg, {
            test: 'mocha --harmony --es_staging --recursive --bail -u tdd test/node6',
            'generate:test-coverage': 'rm -Rf coverage/; node --harmony --es_staging node_modules/istanbul/lib/cli.js'
                + ' cover node_modules/.bin/_mocha -- --recursive --reporter=spec -u tdd test/node6',
        });

        packageUtils.addDevDependencies(pkg, {
            'mocha': '^2.4.5',
            'istanbul': '^0.4.3',
        });

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    },
});
