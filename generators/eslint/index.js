const Generator = require('yeoman-generator');
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
    }

    initializing() {
        const config = (() => {
            if (this.options.react) {
                return this.options.flow ? 'pob/react-flow' : 'pob/react';
            }
            if (this.options.babel) {
                return this.options.flow ? 'pob/flow' : 'pob/babel';
            }
            return 'pob/base'
        })();

        const eslintrcBadPath = this.destinationPath(this.options.destination, '.eslintrc');
        this.fs.delete(eslintrcBadPath);
        this.fs.delete(eslintrcBadPath + '.yml');
        const eslintrcPath = this.destinationPath(this.options.destination, '.eslintrc.js');
        if (!this.fs.exists(eslintrcPath)) {
            this.fs.copyTpl(this.templatePath('eslintrc.js.ejs'), eslintrcPath, { config });
        }
        this.fs.copy(
            this.templatePath('eslintignore'),
            this.destinationPath(this.options.destination, '.eslintignore')
        );
    }

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        const srcDirectory = this.options.babel ? 'src' : 'lib';
        packageUtils.addScript(pkg, 'lint', `eslint --ext .js,.jsx ${srcDirectory}/`);
        if (this.options.testing) {
            pkg.scripts.lint += ` test/`;
        }

        packageUtils.addDevDependencies(pkg, {
            'eslint': '^3.16.1',
            'eslint-plugin-import': '^2.2.0',
            'eslint-config-pob': '^11.1.0',
        });

        if (this.options.babel) {
            packageUtils.addDevDependency(pkg, 'babel-eslint', '^7.0.0');
        } else {
            delete pkg.devDependencies['babel-eslint'];
        }

        if (this.options.react) {
            packageUtils.addDevDependencies(pkg, {
                'eslint-config-airbnb': '^14.0.0',
                'eslint-plugin-jsx-a11y': '^3.0.2',
                'eslint-plugin-react': '^6.3.0',
            });
            delete pkg.devDependencies['eslint-config-airbnb-base'];
        } else {
            packageUtils.addDevDependency(pkg, 'eslint-config-airbnb-base', '^11.1.0');
            delete pkg.devDependencies['eslint-config-airbnb'];
            delete pkg.devDependencies['eslint-plugin-react'];
            delete pkg.devDependencies['eslint-plugin-jsx-a11y'];
        }


        if (this.options.flow) {
            packageUtils.addDevDependencies(pkg, {
                'eslint-plugin-flowtype': '^2.30.0',
            });
        } else {
            delete pkg.devDependencies['eslint-plugin-flowtype'];
        }

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    }
};
