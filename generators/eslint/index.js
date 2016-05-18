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

        this.option('babel', {
            type: Boolean,
            required: false,
            defaults: false,
            desc: 'Lint with babel.'
        });

        this.option('react', {
            type: Boolean,
            required: false,
            defaults: false,
            desc: 'Lint react.'
        });

        this.option('testing', {
            type: Boolean,
            required: false,
            defaults: false,
            desc: 'Lint test/src.'
        });
    },

    initializing() {
        const config = (() => {
            if (this.options.react) {
                return 'pob/react';
            }
            if (this.options.babel) {
                return 'pob/babel';
            }
            return 'pob/base'
        })();

        this.fs.copyTpl(
            this.templatePath('eslintrc.yml.ejs'),
            this.destinationPath(this.options.destination, '.eslintrc.yml'),
            { config }
        );
        this.fs.copy(
            this.templatePath('eslintignore'),
            this.destinationPath(this.options.destination, '.eslintignore')
        );
    },

    writing() {
        this.pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        const scripts = this.pkg.scripts || (this.pkg.scripts = {});
        scripts.lint = 'eslint --fix -c .eslintrc.yml src/';
        if (this.options.testing) {
            scripts.lint += ' test/src/';
        }

        this.pkg.devDependencies = this.pkg.devDependencies || {};
        Object.assign(this.pkg.devDependencies, {
            'eslint': '^2.10.2',
            'eslint-plugin-import': '^1.6.1',
            'eslint-config-pob': '^6.0.1',
        });

        if (this.options.babel || this.options.react) {
            Object.assign(this.pkg.devDependencies, {
                'babel-eslint': '^6.0.4',
            });
        } else {
            delete this.pkg.devDependencies['babel-eslint'];
        }

        if (this.options.react) {
            Object.assign(this.pkg.devDependencies, {
                'babel-eslint': '^6.0.4',
                'eslint-config-airbnb': '^9.0.1',
                'eslint-plugin-react': '^5.0.1',
                'eslint-plugin-jsx-a11y': '^1.0.4',
            });
            delete this.pkg.devDependencies['eslint-config-airbnb-base'];
        } else {
            this.pkg.devDependencies['eslint-config-airbnb-base'] = '^3.0.1';
            delete this.pkg.devDependencies['babel-eslint'];
            delete this.pkg.devDependencies['eslint-config-airbnb'];
            delete this.pkg.devDependencies['eslint-plugin-react'];
            delete this.pkg.devDependencies['eslint-plugin-jsx-a11y'];
        }

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), this.pkg);
    },
});
