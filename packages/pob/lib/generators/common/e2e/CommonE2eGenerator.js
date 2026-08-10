import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
import { writeAndFormatJson } from "../../../utils/writeAndFormat.js";

// Common e2e (Playwright) generator. The .gitignore entries are emitted by
// pob:core:gitignore (the sole owner of .gitignore), gated on the same e2e flag.
export default class CommonE2eGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("enable", {
      type: Boolean,
      default: true,
      description: "enable e2e testing",
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    packageUtils.addOrRemoveDevDependencies(pkg, this.options.enable, [
      "@playwright/test",
      "playwright",
    ]);

    packageUtils.addOrRemoveScripts(pkg, this.options.enable, {
      "test:e2e:prepare": "playwright install chromium",
      "test:e2e": "playwright test",
    });

    return writeAndFormatJson(
      this.fs,
      this.destinationPath("package.json"),
      pkg,
    );
  }
}
