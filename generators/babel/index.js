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

        this.option('env_doc', {
            type: Boolean,
            required: false,
            desc: 'Babel Env doc'
        });

        this.option('env_es5', {
            type: Boolean,
            required: false,
            desc: 'Babel Env es5'
        });

        this.option('env_node5', {
            type: Boolean,
            required: false,
            desc: 'Babel Env node5'
        });

        this.option('env_node6', {
            type: Boolean,
            required: false,
            desc: 'Babel Env node6'
        });

        this.option('env_modern_browsers', {
            type: Boolean,
            required: false,
            desc: 'Babel Env modern-browsers'
        });
    },

    initializing: function () {
        this.fs.copyTpl(
            this.templatePath('index.js.ejs'),
            this.destinationPath(this.options.destination, 'index.js'),
            {
                env_es5: this.options.env_es5,
                env_node5: this.options.env_node5,
                env_node6: this.options.env_node6,
            }
        );
    },

    writing() {
        const pobrc = this.fs.readJSON(this.destinationPath(this.options.destination, '.pobrc.json'), {});

        const envs = [
            this.options.env_es5 && "es5",
            this.options.env_node5 && "node5",
            this.options.env_node6 && "node6",
            this.options.env_webpack_es5 && "webpack",
            this.options.env_webpack_modern_browsers && "webpack-modern-browsers",
        ].filter(Boolean);

        pobrc.envs = envs;
        pobrc.react = !!this.options.react;
        pobrc.testing = !!this.options.testing;

        this.fs.writeJSON(this.destinationPath(this.options.destination, '.pobrc.json'), pobrc);

        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        if (!pkg.main) {
            pkg.main = './index.js';
        }

        if (!this.options.env_es5) {
            delete pkg.browser;
            delete pkg['browser-dev'];
        } else if (!pkg.browser) {
            pkg.browser = './lib-es5/index.js';
            pkg['browser-dev'] = './lib-es5-dev/index.js';
        }

        if (!this.options.env_webpack_es5) {
            delete pkg['webpack:main'];
            delete pkg['webpack:main-dev'];
        } else if (!pkg['webpack:main']) {
            pkg['webpack:main'] = './lib-webpack/index.js';
            pkg['webpack:main-dev'] = './lib-webpack-dev/index.js';
        }

        if (!this.options.env_webpack_modern_browsers) {
            delete pkg['webpack:main'];
            delete pkg['webpack:main-dev'];
        } else if (!pkg['webpack:main-modern-browsers']) {
            pkg['webpack:main-modern-browsers'] = './lib-webpack-modern-browsers/index.js';
            pkg['webpack:main-modern-browsers-dev'] = './lib-webpack-modern-browsers-dev/index.js';
        }

        packageUtils.sort(pkg);

        packageUtils.addScripts(pkg, {
            build: 'pob-build',
            'build:dev': 'pob-build',
            'watch': 'pob-watch',
            'watch:dev': 'pob-watch',
        });

        packageUtils.addDevDependencies(pkg, {
            'pob-babel': '^0.4.1',
            'babel-preset-stage-1': '^6.5.0',
            'babel-plugin-typecheck': '^3.9.0',
            'babel-plugin-defines': '^2.0.0',
            'babel-plugin-discard-module-references': '^1.0.0',
            'babel-plugin-remove-dead-code': '^1.0.1',
        });

        if (this.options.react) {
            packageUtils.addDevDependencies(pkg, {
                'babel-preset-react': '^6.5.0',
                'babel-plugin-react-require': '^2.1.0',
            });
        } else {
            packageUtils.addDevDependency(pkg, 'babel-preset-flow', '^1.0.0');
        }

        if (this.options.env_doc) {
            packageUtils.addDevDependency(pkg, 'babel-plugin-add-jsdoc-annotations', '^4.0.1');
        }

        if (this.options.env_es5) {
            packageUtils.addDevDependency(pkg, 'babel-preset-es2015', '^6.9.0');
            packageUtils.addDevDependency(pkg, 'babel-preset-stage-1', '^6.5.0');
        }

        if (this.options.env_node5) {
            packageUtils.addDevDependency(pkg, 'babel-preset-es2015-node5', '^1.2.0');
            packageUtils.addDevDependency(pkg, 'babel-preset-stage-1', '^6.5.0');
        }

        if (this.options.env_node6) {
            packageUtils.addDevDependency(pkg, 'babel-preset-es2015-node6', '^0.2.0');
            packageUtils.addDevDependency(pkg, 'babel-preset-stage-1', '^6.5.0');
        }

        if (this.options.env_webpack_es5) {
            packageUtils.addDevDependency(pkg, 'babel-preset-es2015-webpack', '^6.4.1');
        }

        if (this.options.env_webpack_modern_browsers) {
            packageUtils.addDevDependency(pkg, 'babel-preset-modern-browsers', '^3.0.0');
        }

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    },
});
