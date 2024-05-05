import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";

export default class AppNextjsGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("export", {
      type: Boolean,
      required: false,
      default: true,
      desc: "Use next export.",
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    packageUtils.addScripts(pkg, {
      start: "next dev",
      "start:prod": "next start",
      // NODE_ENV=production is for tamagui
      build: "NODE_ENV=production next build",
    });

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
