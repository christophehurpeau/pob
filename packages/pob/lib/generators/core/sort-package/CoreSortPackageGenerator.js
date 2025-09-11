import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
import { writeAndFormatJson } from "../../../utils/writeAndFormat.js";

export default class CoreSortPackageGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    writeAndFormatJson(
      this.fs,
      this.destinationPath("package.json"),
      // eslint-disable-next-line unicorn/no-array-sort
      packageUtils.sort(pkg),
    );
  }
}
