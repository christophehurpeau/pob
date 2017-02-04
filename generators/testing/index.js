const Generator = require('yeoman-generator');
const mkdirp = require('mkdirp');
const packageUtils = require('../../utils/package');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.option('destination', {
            type: String,
            required: false,
            defaults: '',
            desc: 'Destination of the generated files.'
        });

        this.option('circleci', {
            type: Boolean,
            required: true,
            desc: 'circleci'
        });

        this.option('travisci', {
            type: Boolean,
            required: true,
            desc: 'travisci'
        });

        this.option('withBabel', {
            type: Boolean,
            required: true,
            desc: 'withBabel'
        });

        this.option('codecov', {
            type: Boolean,
            required: true,
            desc: 'Include codecov report'
        });

        this.option('documentation', {
            type: Boolean,
            required: true,
            desc: 'Include documentation generation'
        });
    }

    initializing() {
        const testDirectory = `test${this.options.withBabel ? '/src' : ''}`;
        mkdirp(this.destinationPath(this.options.destination, testDirectory));
        const testIndexPath = this.destinationPath(this.options.destination, `${testDirectory}/index.js`);
        if (!this.fs.exists(testIndexPath)) {
            this.fs.copy(this.templatePath('index.js'), testIndexPath);
        }
    }

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        const testDirectory = `test${this.options.withBabel ? '/lib' : ''}`;
        packageUtils.addScripts(pkg, {
            test: `mocha --harmony --es_staging --recursive --bail -u tdd ${testDirectory}`,
            'generate:test-coverage': [
                'rm -Rf coverage/',
                'NODE_ENV=production node --harmony --es_staging node_modules/istanbul/lib/cli.js'
                    + ` cover node_modules/.bin/_mocha -- --recursive --reporter=spec -u tdd ${testDirectory}`,
            ].join(' ; ')
        });

        packageUtils.addDevDependencies(pkg, {
            'mocha': '^3.1.0',
            'istanbul': '^0.4.5',
        });

        delete pkg.devDependencies['coveralls'];

        if (this.options.circleci) {
            packageUtils.addDevDependency(pkg, 'xunit-file', '^1.0.0');
        }

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);

        if (this.options.circleci) {
            try {
            this.fs.copyTpl(
                this.templatePath('circle.yml.ejs'),
                this.destinationPath(this.options.destination, 'circle.yml'),
                {
                    documentation: this.options.documentation,
                    codecov: this.options.codecov,
                    withBabel: this.options.withBabel,
                }
            );
            } catch (err) {
                console.log(err.stack || err.message || err);
                throw err;
            }
        }

        if (this.options.travisci) {
            this.fs.copy(
                this.templatePath('travis.yml'),
                this.destinationPath(this.options.destination, '.travis.yml')
            );
        }
    }
};
