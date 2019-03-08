'use strict';

const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');
const formatJson = require('../../../utils/formatJson');

module.exports = class SortPackageGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    this.fs.write(
      this.destinationPath('package.json'),
      formatJson(packageUtils.sort(pkg))
    );
  }
};
