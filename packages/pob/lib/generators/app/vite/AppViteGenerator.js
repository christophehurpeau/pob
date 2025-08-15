import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";

export default class AppViteGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    packageUtils.addScripts(pkg, {
      build: "vite build",
      "build:analyze": "ENABLE_ANALYZER=true vite build",
      start: "vite",
      serve: "vite preview",
    });

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
