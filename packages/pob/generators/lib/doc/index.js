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
    if (this.fs.exists(this.destinationPath('jsdoc.conf.json'))) {
      this.fs.delete(this.destinationPath('jsdoc.conf.json'));
    }
    if (this.fs.exists(this.destinationPath('jsdoc.conf.js'))) {
      this.fs.delete(this.destinationPath('jsdoc.conf.js'));
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (this.options.enabled) {
      const withReact = packageUtils.hasReact(pkg);
      this.fs.copyTpl(
        this.templatePath('tsconfig.doc.json.ejs'),
        this.destinationPath('tsconfig.doc.json'), { withReact }
      );
    } else {
      // this.fs.delete(this.destinationPath('jsdoc.conf.js'));
      if (this.fs.exists(this.destinationPath('docs'))) {
        this.fs.delete(this.destinationPath('docs'));
      }

      if (this.fs.exists(this.destinationPath('tsconfig.doc.json'))) {
        this.fs.delete(this.destinationPath('tsconfig.doc.json'));
      }
    }

    packageUtils.removeDevDependencies(pkg, ['jsdoc', 'minami', 'jaguarjs-jsdoc']);

    packageUtils.addOrRemoveDevDependencies(pkg, this.options.enabled, {
      typedoc: '0.12.0',
    });

    if (this.options.enabled) {
      packageUtils.addScripts(pkg, {
        'generate:docs': 'rm -Rf docs ; yarn run generate:api',
        'generate:api': 'typedoc --out docs --tsconfig tsconfig.doc.json',
      });

      if (this.options.testing) {
        pkg.scripts['generate:docs'] += ' && yarn run generate:test-coverage';
      }
    } else {
      delete pkg.scripts['generate:api'];
      delete pkg.scripts['generate:docs'];
    }


    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
