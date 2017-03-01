const existsSync = require('fs').existsSync;
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

        this.option('env_node6', {
            type: Boolean,
            required: false,
            desc: 'Babel Env node6'
        });

        this.option('env_node7', {
            type: Boolean,
            required: false,
            desc: 'Babel Env node7'
        });

        this.option('env_olderNode', {
            type: Boolean,
            required: false,
            desc: 'Babel Env older node'
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
        const testDirectory = this.destinationPath(this.options.destination, 'test');
        if (!existsSync(testDirectory)) {
            mkdirp(testDirectory);
            const testIndexPath = this.destinationPath(this.options.destination, 'test/index.js');
            if (!this.fs.exists(testIndexPath)) {
                this.fs.copy(this.templatePath('index.js'), testIndexPath);
            }
        }
    }

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        const envVariables = this.options.withBabel ? 'POBREGISTER_ONLY=./test' : '';
        const mochaOptions = (this.options.withBabel ? '--require pob-babel/register ' : '')
                             + '--recursive --bail -u tdd test';
        packageUtils.addScripts(pkg, {
            test: `${envVariables} mocha ${mochaOptions}`.trim(),
            'generate:test-coverage': [
                'rm -Rf coverage/',
                `NODE_ENV=production ${envVariables} node node_modules/istanbul/lib/cli.js`
                    + ` cover node_modules/.bin/_mocha -- ${mochaOptions}`,
            ].join(' ; ')
        });

        packageUtils.addDevDependencies(pkg, {
            'mocha': '^3.2.0',
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
            const { withBabel, env_node6, env_node7, env_olderNode } = this.options;
            this.fs.copyTpl(
                this.templatePath('travis.yml.ejs'),
                this.destinationPath(this.options.destination, '.travis.yml'),
                {
                    node6: !withBabel || env_node6 || env_olderNode,
                    node4: !withBabel || env_olderNode,
                }
            );
        }
        this.fs.copy(
            this.templatePath('eslintrc.js'),
            this.destinationPath(this.options.destination, 'test/.eslintrc.js')
        );
    }
};
