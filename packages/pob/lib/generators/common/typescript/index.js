'use strict';

const { existsSync } = require('fs');
const Generator = require('yeoman-generator');
const inLerna = require('../../../utils/inLerna');
const packageUtils = require('../../../utils/package');

module.exports = class TypescriptGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable typescript',
    });

    this.option('withReact', {
      type: Boolean,
      defaults: true,
      desc: 'enable react with typescript',
    });

    this.option('baseUrl', {
      type: String,
      defaults: '',
      desc: 'baseUrl option',
    });
  }

  writing() {
    if (this.fs.exists('flow-typed')) this.fs.delete('flow-typed');
    if (this.fs.exists(this.destinationPath('.flowconfig'))) {
      this.fs.delete(this.destinationPath('.flowconfig'));
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.removeDevDependencies(pkg, ['flow-bin']);

    if (pkg.scripts) {
      delete pkg.scripts.flow;
    }

    packageUtils.addOrRemoveDevDependencies(pkg, this.options.enable, [
      'typescript',
    ]);

    const tsconfigPath = this.destinationPath('tsconfig.json');
    const tsconfigBuildPath = this.destinationPath('tsconfig.build.json');
    if (this.options.enable) {
      const { withReact } = this.options;
      let composite;
      let monorepoPackageNames;
      if (inLerna && !inLerna.root) {
        const yoConfig = inLerna.rootYoConfig;

        composite =
          yoConfig.pob &&
          yoConfig.pob.monorepo &&
          yoConfig.pob.monorepo.typescript;

        if (composite) {
          packageUtils.removeDevDependencies(pkg, ['typescript']);

          monorepoPackageNames = yoConfig.pob.monorepo.packageNames.filter(
            (packageName) =>
              ((pkg.dependencies && pkg.dependencies[packageName]) ||
                (pkg.devDependencies && pkg.devDependencies[packageName]) ||
                (pkg.peerDependencies && pkg.peerDependencies[packageName])) &&
              existsSync(`../${packageName}/tsconfig.build.json`)
          );
        }
      }
      this.fs.copyTpl(this.templatePath('tsconfig.json.ejs'), tsconfigPath, {
        composite,
        monorepoPackageNames,
        withReact,
        baseUrl: this.options.baseUrl,
      });
      this.fs.copyTpl(
        this.templatePath('tsconfig.build.json.ejs'),
        tsconfigBuildPath,
        { withReact }
      );
    } else {
      this.fs.delete(tsconfigPath);
      this.fs.delete(tsconfigBuildPath);
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
