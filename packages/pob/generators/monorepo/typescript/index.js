const Generator = require('yeoman-generator');
const { existsSync } = require('fs');
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

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    const tsconfigPath = this.destinationPath('tsconfig.json');
    if (this.options.enable) {
      const packageNames = JSON.parse(this.options.packageNames).filter(packageName => existsSync(`packages/${packageName}/tsconfig.json`));
      this.fs.copyTpl(this.templatePath('tsconfig.json.ejs'), tsconfigPath, {
        packageNames,
      });
    } else {
      this.fs.delete(tsconfigPath);
    }
  }
};
