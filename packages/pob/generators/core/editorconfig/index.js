const Generator = require('yeoman-generator');

module.exports = class EditorConfigGenerator extends Generator {
  writing() {
    this.fs.copy(this.templatePath('editorconfig'), this.destinationPath('', '.editorconfig'));
  }
};
