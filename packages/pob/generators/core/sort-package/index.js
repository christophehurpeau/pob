const Generator = require('yeoman-generator');
const prettier = require('prettier');
const packageUtils = require('../../../utils/package');

module.exports = class SortPackageGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const json = JSON.stringify(packageUtils.sort(pkg), null, 2);
    const formatted = prettier.format(json, { parser: 'json', printWidth: 100 });
    this.fs.write(this.destinationPath('package.json'), formatted);
  }
};
