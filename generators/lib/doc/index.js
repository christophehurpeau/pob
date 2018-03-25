const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class DocGenerator extends Generator {
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
    this.fs.delete(this.destinationPath('jsdoc.conf.json'));
    if (this.options.enabled) {
      this.fs.copy(
        this.templatePath('jsdoc.conf.js'),
        this.destinationPath('jsdoc.conf.js'),
      );
    } else {
      this.fs.delete(this.destinationPath('jsdoc.conf.js'));
      this.fs.delete(this.destinationPath('docs'));
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));


    packageUtils.addOrRemoveDevDependencies(pkg, this.options.enabled, {
      jsdoc: '^3.5.5',
      minami: '^1.2.3',
    });

    if (this.options.enabled) {
      packageUtils.addScripts(pkg, {
        'generate:docs': 'rm -Rf docs ; yarn run generate:api',
        'generate:api': 'pob-build-doc',
      });

      if (this.options.testing) {
        pkg.scripts['generate:docs'] += ' && yarn run generate:test-coverage';
      }
    } else {
      delete pkg.scripts['generate:api'];
      delete pkg.scripts['generate:docs'];

      packageUtils.removeDevDependencies(pkg, ['jsdoc', 'minami']);
    }

    packageUtils.removeDevDependencies(pkg, ['jaguarjs-jsdoc']);

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
