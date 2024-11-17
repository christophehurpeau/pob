import { fileURLToPath } from "node:url";
import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
import { writeAndFormatJson } from "../../../utils/writeAndFormat.js";

export default class CoreSortPackageGenerator extends Generator {
  static path = fileURLToPath(import.meta.url);

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    writeAndFormatJson(
      this.fs,
      this.destinationPath("package.json"),
      packageUtils.sort(pkg),
    );
  }
}
