import { fileURLToPath } from "node:url";
import Generator from "yeoman-generator";

export default class CoreGitignoreGenerator extends Generator {
  static path = fileURLToPath(import.meta.url);

  constructor(args, opts) {
    super(args, opts);

    this.option("root", {
      type: Boolean,
      required: false,
      default: true,
      description: "Root package.",
    });

    this.option("documentation", {
      type: Boolean,
      required: false,
      default: false,
      description: "Documentation enabled.",
    });

    this.option("testing", {
      type: Boolean,
      required: false,
      default: false,
      description: "Testing enabled.",
    });

    this.option("withBabel", {
      type: Boolean,
      required: false,
      default: undefined,
      description: "Babel enabled.",
    });

    this.option("paths", {
      type: String,
      required: false,
      default: "",
      description: "Paths ignored.",
    });

    this.option("typescript", {
      type: Boolean,
      required: false,
      default: true,
      description: "Typescript use.",
    });

    this.option("buildInGit", {
      type: Boolean,
      required: false,
      default: true,
      description: "Build is saved in git.",
    });
  }

  writing() {
    const dest = this.destinationPath(".gitignore");
    const withBabel = this.options.withBabel;

    if (
      !this.options.root &&
      !this.options.documentation &&
      !this.options.paths &&
      !withBabel
    ) {
      this.fs.delete(dest);
    } else {
      this.fs.copyTpl(this.templatePath("gitignore.ejs"), dest, {
        root: this.options.root,
        documentation: this.options.documentation,
        testing: this.options.testing,
        withBabel,
        tsTestUtil: "ts-node",
        typescript: withBabel || this.options.typescript,
        paths: this.options.paths,
        buildInGit: this.options.buildInGit,
      });
    }
  }
}
