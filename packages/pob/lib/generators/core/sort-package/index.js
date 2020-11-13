'use strict';

const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');
const { writeAndFormatJson } = require('../../../utils/writeAndFormat');

module.exports = class SortPackageGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    writeAndFormatJson(
      this.fs,
      this.destinationPath('package.json'),
      packageUtils.sort(pkg),
    );
  }
};
