import { fileURLToPath } from "node:url";
import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
// import * as templateUtils from '../../../utils/templateUtils.js';
import { writeAndFormatJson } from "../../../utils/writeAndFormat.js";

export default class AppE2ETestingGenerator extends Generator {
  static path = fileURLToPath(import.meta.url);

  constructor(args, opts) {
    super(args, opts);

    this.option("enable", {
      type: Boolean,
      default: true,
      description: "enable e2e testing",
    });

    this.option("ci", {
      type: Boolean,
      required: true,
      description: "ci",
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    packageUtils.addOrRemoveDevDependencies(pkg, this.options.enable, [
      "@playwright/test",
    ]);

    packageUtils.addOrRemoveScripts(pkg, this.options.enable, {
      "test:e2e": "playwright test",
    });

    // templateUtils.addOrRemoveTemplate(
    //   this.fs,
    //   this.options.enable && this.options.ci,
    //   this.destinationPath('playwright.config.js'),
    // );

    if (this.options.enable) {
    }

    writeAndFormatJson(this.fs, this.destinationPath("package.json"), pkg);
  }
}
