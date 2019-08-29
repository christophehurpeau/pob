'use strict';

const { existsSync } = require('fs');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class MonorepoTypescriptGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable typescript',
    });

    this.option('packageNames', {
      type: String,
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
      packageUtils.addScripts(pkg, {
        'build:definitions': 'tsc -b tsconfig.build.json',
        postbuild: 'yarn run build:definitions',
      });

      const packagePaths = JSON.parse(this.options.packageNames)
        .map(
          (packageName) =>
            `${packageName[0] === '@' ? '' : 'packages/'}${packageName}`
        )
        .filter((packagePath) => existsSync(`${packagePath}/tsconfig.json`));
      this.fs.copyTpl(this.templatePath('tsconfig.json.ejs'), tsconfigPath, {
        packagePaths,
      });
      this.fs.copyTpl(
        this.templatePath('tsconfig.build.json.ejs'),
        tsconfigBuildPath,
        {
          packagePaths: packagePaths.filter((packagePath) =>
            existsSync(`${packagePath}/tsconfig.build.json`)
          ),
        }
      );
    } else {
      this.fs.delete(tsconfigPath);
      this.fs.delete(tsconfigBuildPath);
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
