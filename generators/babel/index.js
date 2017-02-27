'use strict';
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

        this.option('react', {
            type: Boolean,
            required: false,
            defaults: false,
            desc: 'Parse react.'
        });

        this.option('flow', {
            type: Boolean,
            required: false,
            defaults: false,
            desc: 'Use flow.'
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

        this.option('env_webpack_node7', {
            type: Boolean,
            required: false,
            desc: 'Babel Env webpack node7'
        });

        this.option('env_browsers', {
            type: Boolean,
            required: false,
            desc: 'Babel Env browsers'
        });
    }

    initializing() {
        mkdirp(this.destinationPath(this.options.destination, 'src'));

        const indexDestPath = this.destinationPath(this.options.destination, 'index.js');
        if (this.options.env_node6 || this.options.env_node7 || this.options.env_olderNode) {
            this.fs.copyTpl(
                this.templatePath('index.js.ejs'),
                indexDestPath,
                {
                    env_node6: this.options.env_node6,
                    env_node7: this.options.env_node7,
                    env_olderNode: this.options.env_olderNode,
                }
            );
        } else {
            this.fs.delete(indexDestPath);
        }

        const indexSrcDestPath = this.destinationPath(this.options.destination, 'src/index.js');
        if (!this.fs.exists(indexSrcDestPath)) {
            const idxJsxDestPath = this.destinationPath(this.options.destination, 'src/index.jsx');
            if (!this.fs.exists(idxJsxDestPath)) {
                this.fs.copy(this.templatePath('src/index.js'), indexSrcDestPath);
            }
        }

        if (this.options.flow) {
            this.fs.copy(
                this.templatePath('types.js'),
                this.destinationPath(this.options.destination, 'types.js')
            );
            const typesDestPath = this.destinationPath(this.options.destination, 'src/types.js');
            if (!this.fs.exists(typesDestPath)) {
                this.fs.copy(this.templatePath('src/types.js'), typesDestPath);
            }
        }
    }

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
            delete pkg['webpack:browser'];
            delete pkg['webpack:browser-dev'];
        } else if (!pkg['webpack:main']) {
            pkg['webpack:main'] = pkg['webpack:browser'] = './lib-webpack/index.js';
            pkg['webpack:main-dev'] = pkg['webpack:browser-dev'] = './lib-webpack-dev/index.js';
        }

        if (!this.options.env_node7 && !this.options.env_webpack_node7) {
            delete pkg['webpack:node'];
            delete pkg['webpack:node-dev'];
        } else if (this.options.env_webpack_node7) {
            pkg['webpack:node'] = './lib-webpack-node7/index.js';
            pkg['webpack:node-dev'] = './lib-webpack-node7-dev/index.js';
        } else {
            pkg['webpack:node'] = './lib-node7/index.js';
            pkg['webpack:node-dev'] = './lib-node7-dev/index.js';
        }

        if (!this.options.env_olderNode && (this.options.env_node6 || this.options.env_node7)) {
            if (!pkg.engines) pkg.engines = {};
            pkg.engines = { "node" : `>=${this.options.env_node6 ? '6.5.0' : '7.6.0'}` };
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
            'pob-babel': '^16.0.0',
            'eslint-plugin-babel': '^4.0.0',
            'flow-runtime': '^0.6.0',
        });

        // old pob dependencies
        delete pkg.devDependencies['tcomb'];
        delete pkg.devDependencies['tcomb-forked'];
        delete pkg.devDependencies['babel-preset-env'];
        delete pkg.devDependencies['babel-preset-es2015'];
        delete pkg.devDependencies['babel-preset-es2015-webpack'];
        delete pkg.devDependencies['babel-preset-es2015-node5'];
        delete pkg.devDependencies['babel-preset-es2015-node6'];
        delete pkg.devDependencies['babel-preset-stage-1'];
        delete pkg.devDependencies['babel-preset-modern-browsers-stage-1'];
        delete pkg.devDependencies['babel-preset-flow'];
        delete pkg.devDependencies['babel-preset-flow-tcomb'];
        delete pkg.devDependencies['babel-preset-flow-tcomb-forked'];
        delete pkg.devDependencies['babel-plugin-typecheck'];
        delete pkg.devDependencies['babel-plugin-defines'];
        delete pkg.devDependencies['babel-plugin-discard-module-references'];
        delete pkg.devDependencies['babel-plugin-remove-dead-code'];
        delete pkg.devDependencies['babel-plugin-react-require'];
        delete pkg.devDependencies['babel-preset-react'];

        if (this.options.react) {
            packageUtils.addDevDependencies(pkg, {
                'babel-preset-pob-react': '^0.1.0',
            });
        } else {
            delete pkg.devDependencies['babel-preset-pob-react'];
        }

        if (this.options.documentation) {
            packageUtils.addDevDependency(pkg, 'babel-preset-jsdoc', '^0.4.0');
            packageUtils.addDevDependency(pkg, 'babel-plugin-add-jsdoc-annotations', '^5.1.0');
        } else {
            delete pkg.devDependencies['babel-preset-jsdoc'];
            delete pkg.devDependencies['babel-plugin-add-jsdoc-annotations'];
        }

        if (this.options.env_olderNode || this.options.env_browsers || this.options.env_webpack_allBrowsers) {
            packageUtils.addDevDependency(pkg, 'babel-preset-latest', '^6.22.0');
        } else {
           delete pkg.devDependencies['babel-preset-latest'];
        }

        if (this.options.env_node6 || this.options.env_node7) {
            packageUtils.addDevDependency(pkg, 'babel-preset-latest-node', '^0.1.0');
        } else {
           delete pkg.devDependencies['babel-preset-latest-node'];
        }

        if (this.options.env_webpack_modernBrowsers) {
            packageUtils.addDevDependency(pkg, 'babel-preset-modern-browsers', '^8.1.1');
        } else {
           delete pkg.devDependencies['babel-preset-modern-browsers'];
        }


        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    }

    end() {
        return this.spawnCommandSync('yarn', ['run', 'build']);
    }
};
