const generators = require('yeoman-generator');

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
        this.pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        const scripts = this.pkg.scripts || (this.pkg.scripts = {});

        scripts.test = 'mocha --harmony --es_staging --recursive --bail -u tdd test/node6';
        scripts['generate:test-coverage'] = 'rm -Rf coverage/; node --harmony --es_staging node_modules/istanbul/lib/cli.js'
            + ' cover node_modules/.bin/_mocha -- --recursive --reporter=spec -u tdd test/node6';

        this.pkg.devDependencies = this.pkg.devDependencies || {};
        Object.assign(this.pkg.devDependencies, {
            'mocha': '^2.4.5',
            'istanbul': '^0.4.3',
        });

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), this.pkg);
    },
});
