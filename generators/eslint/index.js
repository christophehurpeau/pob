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
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        packageUtils.addScript(pkg, 'lint', 'eslint --ext .js,.jsx --fix -c .eslintrc.yml src/');
        if (this.options.testing) {
            pkg.scripts.lint += ' test/src/';
        }

        packageUtils.addDevDependencies(pkg, {
            'eslint': '^2.12.0',
            'eslint-plugin-import': '^1.8.0',
            'eslint-config-pob': '^6.1.1',
        });

        if (this.options.babel || this.options.react) {
            packageUtils.addDevDependency(pkg, 'babel-eslint', '^6.0.4');
        } else {
            delete pkg.devDependencies['babel-eslint'];
        }

        if (this.options.react) {
            packageUtils.addDevDependencies(pkg, {
                'babel-eslint': '^6.0.4',
                'eslint-config-airbnb': '^9.0.1',
                'eslint-plugin-react': '^5.0.1',
                'eslint-plugin-jsx-a11y': '^1.4.1',
            });
            delete pkg.devDependencies['eslint-config-airbnb-base'];
        } else {
            packageUtils.addDevDependency(pkg, 'eslint-config-airbnb-base', '^3.0.1');
            delete pkg.devDependencies['eslint-config-airbnb'];
            delete pkg.devDependencies['eslint-plugin-react'];
            delete pkg.devDependencies['eslint-plugin-jsx-a11y'];
        }

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    },
});
