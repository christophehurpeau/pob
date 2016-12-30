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

        this.option('name', {
            type: String,
            required: true,
            desc: 'Project name'
        });

        this.option('testing', {
            type: Boolean,
            required: false,
            defaults: false,
            desc: 'Coverage.'
        });
    }

    initializing() {
        this.fs.copyTpl(
            this.templatePath('jsdoc.conf.json.ejs'),
            this.destinationPath(this.options.destination, 'jsdoc.conf.json'),
            {
                projectName: this.options.name,
            }
        );
    }

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        packageUtils.addScripts(pkg, {
            'generate:docs': 'npm run generate:api',
            'generate:api': [
                'rm -Rf docs/',
                'mkdir docs/',
                'pob-build doc',
                'jsdoc README.md lib-doc --recurse --destination docs/ --configure jsdoc.conf.json',
                'rm -Rf lib-doc'
            ].join(' ; ')
        });

        if (this.options.testing) {
            pkg.scripts['generate:docs'] += ' && npm run generate:test-coverage';
        }

        packageUtils.addDevDependencies(pkg, {
            'jsdoc': '^3.4.1',
            'minami': '^1.1.1',
        });

        delete pkg.devDependencies['jaguarjs-jsdoc'];

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    }
};
