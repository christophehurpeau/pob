'use strict';
const generators = require('yeoman-generator');
const packageUtils = require('../../utils/package');

module.exports = generators.Base.extend({
    constructor: function () {
        generators.Base.apply(this, arguments);

        this.option('destination', {
            type: String,
            required: false,
            defaults: '',
            desc: 'Destination of the generated files.'
        });

        this.option('react', {
            type: Boolean,
            required: false,
            defaults: false,
            desc: 'Parse react.'
        });

        this.option('documentation', {
            type: Boolean,
            required: false,
            defaults: false,
            desc: 'Has documentation (use preset for jsdoc).'
        });

        this.option('env_node6', {
            type: Boolean,
            required: false,
            desc: 'Babel Env node6'
        });

        this.option('env_olderNode', {
            type: Boolean,
            required: false,
            desc: 'Babel Env older node'
        });

        this.option('env_webpack_modernBrowsers', {
            type: Boolean,
            required: false,
            desc: 'Babel Env webpack modern-browsers'
        });

        this.option('env_webpack_allBrowsers', {
            type: Boolean,
            required: false,
            desc: 'Babel Env webpack all browsers'
        });

        this.option('env_browsers', {
            type: Boolean,
            required: false,
            desc: 'Babel Env browsers'
        });
    },

    initializing: function () {
        this.mkdir('src');
        this.fs.copyTpl(
            this.templatePath('index.js.ejs'),
            this.destinationPath(this.options.destination, 'index.js'),
            {
                env_node6: this.options.env_node6,
                env_olderNode: this.options.env_olderNode,
            }
        );
    },

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        if (!pkg.main) {
            pkg.main = './index.js';
        }

        if (!this.options.env_browsers) {
            delete pkg.browser;
            delete pkg['browser-dev'];
        } else if (!pkg.browser) {
            pkg.browser = './lib-browsers/index.js';
            pkg['browser-dev'] = './lib-browsers-dev/index.js';
        }

        if (!this.options.env_webpack_modernBrowsers) {
            delete pkg['webpack:main'];
            delete pkg['webpack:main-dev'];
        } else if (!pkg['webpack:main-modern-browsers']) {
            pkg['webpack:main-modern-browsers'] = './lib-webpack-modern-browsers/index.js';
            pkg['webpack:main-modern-browsers-dev'] = './lib-webpack-modern-browsers-dev/index.js';
        }

        if (!this.options.env_webpack_allBrowsers) {
            delete pkg['webpack:main'];
            delete pkg['webpack:main-dev'];
        } else if (!pkg['webpack:main']) {
            pkg['webpack:main'] = './lib-webpack/index.js';
            pkg['webpack:main-dev'] = './lib-webpack-dev/index.js';
        }

        packageUtils.sort(pkg);

        if (!pkg.scripts.build) {
            packageUtils.addScript(pkg, 'build', 'pob-build');
        }

        if (!pkg.scripts.watch) {
            packageUtils.addScript(pkg, 'watch', 'pob-watch');
        }

        delete pkg.scripts['build:dev'];
        delete pkg.scripts['watch:dev'];

        packageUtils.addDevDependencies(pkg, {
            'pob-babel': '^8.3.2',
            'eslint-plugin-babel': '^3.3.0',
            'tcomb-forked': '^3.4.0',
        });

        delete pkg.devDependencies['tcomb'];
        delete pkg.devDependencies['babel-preset-es2015-webpack'];
        delete pkg.devDependencies['babel-preset-stage-1'];
        delete pkg.devDependencies['babel-preset-modern-browsers-stage-1'];
        delete pkg.devDependencies['babel-preset-flow'];
        delete pkg.devDependencies['babel-preset-flow-tcomb'];
        delete pkg.devDependencies['babel-preset-flow-tcomb-forked'];
        delete pkg.devDependencies['babel-plugin-typecheck'];
        delete pkg.devDependencies['babel-plugin-defines'];
        delete pkg.devDependencies['babel-plugin-discard-module-references'];
        delete pkg.devDependencies['babel-plugin-remove-dead-code'];

        if (this.options.react) {
            packageUtils.addDevDependencies(pkg, {
                'babel-preset-react': '^6.16.0',
            });
        } else {
            delete pkg.devDependencies['babel-preset-react'];
        }

        if (this.options.documentation) {
            packageUtils.addDevDependency(pkg, 'babel-preset-jsdoc', '^0.4.0');
            packageUtils.addDevDependency(pkg, 'babel-plugin-add-jsdoc-annotations', '^5.1.0');
        } else {
            delete pkg.devDependencies['babel-preset-jsdoc'];
            delete pkg.devDependencies['babel-plugin-add-jsdoc-annotations'];
        }

        if (this.options.env_olderNode || this.options.env_browsers || this.options.env_webpack_allBrowsers) {
            packageUtils.addDevDependency(pkg, 'babel-preset-es2015', '^6.16.0');
        } else {
           delete pkg.devDependencies['babel-preset-es2015'];
        }

        if (this.options.env_node6) {
            packageUtils.addDevDependency(pkg, 'babel-preset-es2015-node6', '^0.3.0');
        } else {
           delete pkg.devDependencies['babel-preset-es2015-node6'];
        }

        if (this.options.env_webpack_modernBrowsers) {
            packageUtils.addDevDependency(pkg, 'babel-preset-modern-browsers', '^5.1.0');
        } else {
           delete pkg.devDependencies['babel-preset-modern-browsers'];
        }


        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    },
});
