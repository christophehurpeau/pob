import Generator from "yeoman-generator";

export default class CoreGitignoreGenerator extends Generator {
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

    this.option("buildDirectory", {
      type: String,
      required: false,
      default: "",
      description: "Build directory.",
    });
  }

  writing() {
    const gitignorePath = this.destinationPath(".gitignore");
    const cursorignorePath = this.destinationPath(".cursorignore");
    const withBabel = this.options.withBabel;

    if (
      !this.options.root &&
      !this.options.documentation &&
      !this.options.paths &&
      !withBabel
    ) {
      this.fs.delete(gitignorePath);
    } else {
      this.fs.copyTpl(this.templatePath("gitignore.ejs"), gitignorePath, {
        root: this.options.root,
        documentation: this.options.documentation,
        testing: this.options.testing,
        withBabel,
        typescript: withBabel || this.options.typescript,
        paths: this.options.paths,
        buildInGit: this.options.buildInGit,
      });
    }

    // if (!this.options.root) {
    this.fs.delete(cursorignorePath);
    // } else {
    //   this.fs.write(
    //     cursorignorePath,
    //     `${["/.yarn", this.options.buildDirectory].join("\n")}\n`,
    //   );
    // }
  }
}
