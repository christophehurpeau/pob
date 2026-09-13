import Generator from "yeoman-generator";
import { updateNodeEngines } from "../../../utils/nodeEngines.js";

export default class CoreNodeGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("onlyLatestLTS", {
      type: Boolean,
      required: false,
      default: false,
      description: "only support latest LTS version of node",
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    updateNodeEngines(pkg, { onlyLatestLTS: this.options.onlyLatestLTS });

    // no formatting needed, pob:core:sort-package runs after and formats
    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
