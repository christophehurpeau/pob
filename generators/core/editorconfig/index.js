const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  initializing() {
    this.fs.copy(this.templatePath('editorconfig'), this.destinationPath('', '.editorconfig'));
  }
};
