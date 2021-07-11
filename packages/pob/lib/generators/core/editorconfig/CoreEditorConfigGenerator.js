import Generator from 'yeoman-generator';

export default class CoreEditorConfigGenerator extends Generator {
  writing() {
    this.fs.copy(
      this.templatePath('editorconfig'),
      this.destinationPath('.editorconfig'),
    );
  }
}
