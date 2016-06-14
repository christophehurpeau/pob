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
    },

    initializing() {
        this.fs.copyTpl(
            this.templatePath('jsdoc.conf.json.ejs'),
            this.destinationPath(this.options.destination, 'jsdoc.conf.json'),
            {
                projectName: this.options.name,
            }
        );
    },

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        packageUtils.addScripts({
            'generate:docs': 'npm run generate:api',
            'generate:api': [
                'rm -Rf docs/',
                'BABEL_ENV=doc babel -s --out-dir docs/_dist src',
                'jsdoc README.md docs/_dist --recurse --destination docs/ --configure jsdoc.conf.json',
                'rm -Rf docs/_dist'
            ].join(' ; ')
        });

        if (this.options.testing) {
            pkg.scripts['generate:docs'] += ' && npm run generate:test-coverage';
        }

        packageUtils.addDevDependencies(pkg, {
            'jsdoc': '^3.4.0',
            'jaguarjs-jsdoc': 'github:christophehurpeau/jaguarjs-jsdoc#0e577602ac327a694d4f619cb37c1476c523261e',
        });

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);
    },
});
