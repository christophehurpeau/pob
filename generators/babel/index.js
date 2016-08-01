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
        const pobrc = this.fs.readJSON(this.destinationPath(this.options.destination, '.pobrc.json'), {});

        const envs = [
            this.options.env_node6 && "node6",
            this.options.env_olderNode && "older-node",
            this.options.env_webpack_modernBrowsers && "webpack-modern-browsers",
            this.options.env_webpack_allBrowsers && "webpack",
            this.options.env_browsers && "browsers",
        ].filter(Boolean);

        pobrc.envs = envs;
        pobrc.react = !!this.options.react;
        pobrc.testing = !!this.options.testing;

        this.fs.writeJSON(this.destinationPath(this.options.destination, '.pobrc.json'), pobrc);

        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        if (!pkg.main) {
            pkg.main = './index.js';
        } else if (pkg.main.startsWith('./lib/')) {
            pkg.main = `./${pkg.main.substr('./lib/'.length)}`;
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

        packageUtils.addScripts(pkg, {
            build: 'pob-build',
            'build:dev': 'pob-build',
            'watch': 'pob-watch',
            'watch:dev': 'pob-watch',
        });

        packageUtils.addDevDependencies(pkg, {
            'pob-babel': '^4.0.1',
            'babel-preset-stage-1': '^6.5.0',
            'babel-plugin-typecheck': '^3.9.0',
            'babel-plugin-defines': '^3.0.0',
            'babel-plugin-discard-module-references': '^1.0.0',
            'babel-plugin-remove-dead-code': '^1.1.0',
        });

        if (this.options.react) {
            packageUtils.addDevDependencies(pkg, {
                'babel-preset-react': '^6.11.1',
                'babel-plugin-react-require': '^2.1.0',
            });
        } else {
            packageUtils.addDevDependency(pkg, 'babel-preset-flow', '^1.0.0');
        }

        if (this.options.documentation) {
            packageUtils.addDevDependency(pkg, 'babel-plugin-add-jsdoc-annotations', '^4.0.1');
        }

        if (this.options.env_olderNode || this.options.env_browsers || this.options.documentation) {
            packageUtils.addDevDependency(pkg, 'babel-preset-es2015', '^6.9.0');
        }

        if (this.options.env_node6) {
            packageUtils.addDevDependency(pkg, 'babel-preset-es2015-node6', '^0.2.0');
        }

        if (this.options.env_node6
            || this.options.env_browsers
            || this.options.documentation
            || this.options.env_webpack_allBrowsers
        ) {
            packageUtils.addDevDependency(pkg, 'babel-preset-stage-1', '^6.5.0');
        }

        if (this.options.env_webpack_modernBrowsers) {
            packageUtils.addDevDependency(pkg, 'babel-preset-modern-browsers', '^5.0.2');
            packageUtils.addDevDependency(pkg, 'babel-preset-modern-browsers-stage-1', '^1.0.0');
        }

        if (this.options.env_webpack_allBrowsers) {
            packageUtils.addDevDependency(pkg, 'babel-preset-es2015-webpack', '^6.4.1');
        }

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    },
});
