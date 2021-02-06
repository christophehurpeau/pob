'use strict';

const Generator = require('yeoman-generator');
const inLerna = require('../../../utils/inLerna');
const packageUtils = require('../../../utils/package');
const { copyAndFormatTpl } = require('../../../utils/writeAndFormat');

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

    this.option('useYarn2', {
      type: Boolean,
      required: false,
      defaults: false,
    });

    this.option('packageNames', {
      type: String,
      required: false,
      defaults: '{}',
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
      const jsx =
        pkg.pob && pkg.pob.jsx !== undefined
          ? pkg.pob.jsx
          : packageUtils.hasReact(pkg);

      if (inLerna && inLerna.root) {
        const existingConfig = this.fs.readJSON(
          this.destinationPath('tsconfig.doc.json'),
          { typedocOptions: {} },
        );
        // "external-modulemap": ".*packages/([^/]+)/.*",
        const packageNames = JSON.parse(this.options.packageNames);
        copyAndFormatTpl(
          this.fs,
          this.templatePath('tsconfig.doc.json.lerna.ejs'),
          this.destinationPath('tsconfig.doc.json'),
          {
            jsx,
            workspaces: pkg.workspaces,
            packageNames,
            repositoryUrl: pkg.homepage, // or pkg.repository.replace(/\.git$/, '')
            useYarn2: this.options.useYarn2,
            readme: existingConfig.typedocOptions.readme || 'README.md',
          },
        );
      } else {
        copyAndFormatTpl(
          this.fs,
          this.templatePath('tsconfig.doc.json.ejs'),
          this.destinationPath('tsconfig.doc.json'),
          { jsx, readme: 'README.md' },
        );
      }
    } else {
      // this.fs.delete(this.destinationPath('jsdoc.conf.js'));
      if (this.fs.exists(this.destinationPath('docs'))) {
        this.fs.delete(this.destinationPath('docs'));
      }

      if (this.fs.exists(this.destinationPath('tsconfig.doc.json'))) {
        this.fs.delete(this.destinationPath('tsconfig.doc.json'));
      }
    }

    packageUtils.removeDevDependencies(pkg, [
      'jsdoc',
      'minami',
      'jaguarjs-jsdoc',
      'typedoc-plugin-lerna-packages',
      '@chrp/typedoc-plugin-lerna-packages',
    ]);

    packageUtils.addOrRemoveDevDependencies(pkg, this.options.enabled, [
      'typedoc',
    ]);

    // packageUtils.addOrRemoveDevDependencies(
    //   pkg,
    //   this.options.enabled && inLerna && inLerna.root,
    //   ['@chrp/typedoc-plugin-lerna-packages'],
    // );
    // packageUtils.addOrRemoveDependenciesMeta(
    //   pkg,
    //   this.options.enabled && inLerna && inLerna.root,
    //   {
    //     'typedoc-neo-theme': {
    //       unplugged: true,
    //     },
    //   },
    // );

    if (this.options.enabled) {
      packageUtils.addScripts(pkg, {
        'generate:docs':
          'rm -Rf docs ; yarn run generate:api ; touch docs/.nojekyll',
        'generate:api': 'typedoc --tsconfig tsconfig.doc.json',
      });

      if (this.options.testing && (!inLerna || !inLerna.root)) {
        pkg.scripts['generate:docs'] += ' && yarn run generate:test-coverage';
      }
    } else {
      delete pkg.scripts['generate:api'];
      delete pkg.scripts['generate:docs'];
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
