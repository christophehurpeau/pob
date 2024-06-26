import Generator from "yeoman-generator";

export default class CoreCleanGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("root", {
      type: Boolean,
      required: false,
      default: true,
      description: "Root package.",
    });
  }

  writing() {
    if (!this.options.root) {
      this.fs.delete(".idea");
    }
  }
}
