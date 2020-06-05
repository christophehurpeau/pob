'use strict';

const Generator = require('yeoman-generator');
const formatJson = require('../../../utils/formatJson');
const packageUtils = require('../../../utils/package');

module.exports = class SortPackageGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    this.fs.write(
      this.destinationPath('package.json'),
      formatJson(packageUtils.sort(pkg), 'package.json'),
    );
  }
};
