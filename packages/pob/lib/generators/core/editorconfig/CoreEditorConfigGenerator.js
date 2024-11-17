import { fileURLToPath } from "node:url";
import Generator from "yeoman-generator";

export default class CoreEditorConfigGenerator extends Generator {
  static path = fileURLToPath(import.meta.url);

  writing() {
    this.fs.copy(
      this.templatePath("editorconfig"),
      this.destinationPath(".editorconfig"),
    );
  }
}
