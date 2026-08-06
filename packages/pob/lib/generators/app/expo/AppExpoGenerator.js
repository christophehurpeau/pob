import Generator from "yeoman-generator";

export default class AppExpoGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    pkg.main = "./src/AppEntry.tsx";

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
