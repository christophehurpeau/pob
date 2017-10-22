const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enabled', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Enabled.',
    });

    this.option('testing', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Coverage.',
    });
  }

  writing() {
    if (this.options.enabled) {
      this.fs.copyTpl(
        this.templatePath('jsdoc.conf.json.ejs'),
        this.destinationPath('jsdoc.conf.json'),
      );
    } else {
      this.fs.delete(this.destinationPath('jsdoc.conf.json'));
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (this.options.enabled) {
      packageUtils.addScripts(pkg, {
        'generate:docs': 'yarn run generate:api',
        'generate:api': [
          'rm -Rf docs/',
          'mkdir docs/',
          'pob-build doc',
          'jsdoc README.md lib-doc --recurse --destination docs/ --configure jsdoc.conf.json',
          'rm -Rf lib-doc',
        ].join(' ; '),
      });

      if (this.options.testing) {
        pkg.scripts['generate:docs'] += ' && yarn run generate:test-coverage';
      }

      packageUtils.addDevDependencies(pkg, {
        jsdoc: '^3.4.1',
        minami: '^1.1.1',
      });
    } else {
      delete pkg.scripts['generate:api'];
      delete pkg.scripts['generate:docs'];

      packageUtils.removeDevDependencies(pkg, ['jsdoc', 'minami']);
    }

    packageUtils.removeDevDependency(pkg, 'jaguarjs-jsdoc');

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
