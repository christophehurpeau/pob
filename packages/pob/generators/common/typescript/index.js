const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class TypescriptGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable typescript',
    });
  }

  writing() {
    if (this.fs.exists('flow-typed')) this.fs.delete('flow-typed');
    if (this.fs.exists(this.destinationPath('.flowconfig'))) {
      this.fs.delete(this.destinationPath('.flowconfig'));
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const withReact = packageUtils.hasReact(pkg);

    packageUtils.removeDevDependencies(pkg, ['flow-bin']);

    if (pkg.scripts) {
      delete pkg.scripts.flow;
    }

    packageUtils.addOrRemoveDevDependencies(pkg, this.options.enable, {
      typescript: '3.0.1',
    });

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    const tsconfigPath = this.destinationPath('tsconfig.json');
    const tsconfigBuildPath = this.destinationPath('tsconfig.build.json');
    if (this.options.enable) {
      this.fs.copyTpl(this.templatePath('tsconfig.json.ejs'), tsconfigPath, { withReact });
      this.fs.copyTpl(this.templatePath('tsconfig.build.json.ejs'), tsconfigBuildPath, { withReact });
    } else {
      this.fs.delete(tsconfigPath);
      this.fs.delete(tsconfigBuildPath);
    }
  }
};
