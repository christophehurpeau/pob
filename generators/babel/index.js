'use strict';
var generators = require('yeoman-generator');

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
        const envs = {
            env_doc: this.options.env_doc,
            env_es5: this.options.env_es5,
            env_node5: this.options.env_node5,
            env_node6: this.options.env_node6,
            env_modern_browsers: this.options.env_modern_browsers,
        };

        this.fs.copyTpl(
            this.templatePath('babelrc'),
            this.destinationPath(this.options.destination, '.babelrc'),
            Object.assign({ react: this.options.react }, envs)
        );

        this.fs.copyTpl(
            this.templatePath('index.js.ejs'),
            this.destinationPath(this.options.destination, 'index.js'),
            envs
        );
    },

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        const envs = [
            this.options.env_es5 && "es5",
            this.options.env_node5 && "node5",
            this.options.env_node6 && "node6",
            this.options['env_modern_browsers'] && "modern-browsers",
        ].filter(Boolean);

        if (!pkg.main) {
            pkg.main = './index.js';
        }

        if (!this.options['env_modern_browsers']) {
            delete pkg['main-modern-browsers'];
        } else if (!pkg['main-modern-browsers-dev']) {
            if (this.options.env_es5) {
                pkg.browser = './dist/es5/index.js';
                pkg['browser-dev'] = './dist/es5-dev/index.js';
            }
            pkg['main-modern-browsers'] = './dist/modern-browsers/index.js';
            pkg['main-modern-browsers-dev'] = './dist/modern-browsers-dev/index.js';
        }

        const scripts = pkg.scripts || (pkg.scripts = {});
        scripts.build = 'rm -Rf dist && '
            + envs
                .map(env => [env, `${env}-dev`]
                    .map(env => `BABEL_ENV=${env} babel -s --out-dir dist/${env} src`)
                    .join(' && ')
                )
                .join(' && ');

        scripts['build:dev'] = 'rm -Rf dist/*-dev/ && '
            + envs
                .map(env => [`${env}-dev`]
                    .map(env => `BABEL_ENV=${env} babel -s --out-dir dist/${env} src`)
                    .join(' && ')
                )
                .join(' && ');

        if (this.options.testing) {
            scripts.build += '&& rm -Rf test/node6 && BABEL_ENV=node6 babel -s --out-dir test/node6 test/src';
        }

        scripts['watch:dev'] = 'rm -Rf dist test/node6 && echo "'
            + envs
                .map(env => `${env}-dev`)
                .map(env => `BABEL_ENV=${env} babel -sw --out-dir dist/${env} src`)
                .join('\\n')
            + (this.options.testing ? 'BABEL_ENV=node6 babel -sw --out-dir test/node6 test/src' : '')
            + `" | while read i; do printf "%q\\n" "$i"; done | xargs -n1 -P ${envs.length + (this.options.testing ? 1 : 0)} -I cmd bash -c "cmd"`;

        Object.assign(pkg.devDependencies, {
            'babel-cli': '^6.8.0',
            'babel-preset-stage-1': '^6.5.0',
            'babel-plugin-typecheck': '^3.9.0',
        });

        if (this.options.react) {
            pkg.devDependencies['babel-preset-react'] = '^6.5.0';
        } else {
            pkg.devDependencies['babel-preset-flow'] = '^1.0.0';
        }

        if (this.options.env_doc) {
            pkg.devDependencies['babel-plugin-add-jsdoc-annotations'] = '^4.0.1';
        }

        if (this.options.env_es5) {
            pkg.devDependencies['babel-preset-es2015'] = '^6.6.0';
            pkg.devDependencies['babel-preset-stage-1'] = '^6.5.0';
        }

        if (this.options.env_node5) {
            pkg.devDependencies['babel-preset-es2015-node5'] = '^1.2.0';
            pkg.devDependencies['babel-preset-stage-1'] = '^6.5.0';
        }

        if (this.options.env_node6) {
            pkg.devDependencies['babel-preset-es2015-node6'] = '^0.2.0';
            pkg.devDependencies['babel-preset-stage-1'] = '^6.5.0';
        }

        if (this.options['env_modern_browsers']) {
            pkg.devDependencies['babel-preset-modern-browsers'] = '^2.0.0';
        }

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    },
});
