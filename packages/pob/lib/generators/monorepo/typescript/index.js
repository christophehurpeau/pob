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

    this.option('isAppProject', {
      type: Boolean,
      defaults: true,
      desc: 'app project, no building definitions',
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
        tsc: 'tsc -b',
      });
      packageUtils.addOrRemoveScripts(pkg, !this.options.isAppProject, {
        'build:definitions': 'tsc -b tsconfig.build.json',
        postbuild: `yarn run build:definitions${
          pkg.scripts['generate:docs'] ? ' && yarn run generate:docs' : ''
        }`,
      });

      const basePackageName = pkg.name.startsWith('@')
        ? `${pkg.name.replace(/-monorepo$/, '')}-`
        : `@${pkg.name}/`;

      const packagePaths = JSON.parse(this.options.packageNames)
        .map((packageName) =>
          this.options.isAppProject && packageName.startsWith(basePackageName)
            ? `packages/${packageName.slice(basePackageName.length)}`
            : `${packageName[0] === '@' ? '' : 'packages/'}${packageName}`,
        )
        .filter((packagePath) => existsSync(`${packagePath}/tsconfig.json`));

      if (packagePaths.length === 0) {
        console.log(
          JSON.parse(this.options.packageNames),
          JSON.parse(this.options.packageNames).map((packageName) =>
            this.options.isAppProject && packageName.startsWith(basePackageName)
              ? `packages/${packageName.slice(basePackageName.length)}`
              : `${packageName[0] === '@' ? '' : 'packages/'}${packageName}`,
          ),
        );
        throw new Error('packages should not be empty');
      }

      this.fs.copyTpl(this.templatePath('tsconfig.json.ejs'), tsconfigPath, {
        packagePaths,
      });
      if (this.options.isAppProject) {
        this.fs.delete(tsconfigBuildPath);
      } else {
        this.fs.copyTpl(
          this.templatePath('tsconfig.build.json.ejs'),
          tsconfigBuildPath,
          {
            packagePaths: packagePaths.filter((packagePath) =>
              existsSync(
                `${packagePath}/tsconfig${
                  this.options.isAppProject ? '' : '.build'
                }.json`,
              ),
            ),
          },
        );
      }
    } else {
      if (pkg.scripts) {
        delete pkg.scripts.tsc;
        if (pkg.scripts.postbuild === 'tsc -b tsconfig.build.json') {
          delete pkg.scripts.postbuild;
        }
        delete pkg.scripts['build:definitions'];
      }
      this.fs.delete(tsconfigPath);
      this.fs.delete(tsconfigBuildPath);
    }

    if (pkg.scripts) {
      delete pkg.scripts['typescript-check'];
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
