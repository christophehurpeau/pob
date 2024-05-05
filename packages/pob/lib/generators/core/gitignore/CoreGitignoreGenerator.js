import Generator from "yeoman-generator";

export default class CoreGitignoreGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("root", {
      type: Boolean,
      required: false,
      default: true,
      desc: "Root package.",
    });

    this.option("documentation", {
      type: Boolean,
      required: false,
      default: false,
      desc: "Documentation enabled.",
    });

    this.option("testing", {
      type: Boolean,
      required: false,
      default: false,
      desc: "Testing enabled.",
    });

    this.option("withBabel", {
      type: Boolean,
      required: false,
      default: undefined,
      desc: "Babel enabled.",
    });

    this.option("paths", {
      type: String,
      required: false,
      default: "",
      desc: "Paths ignored.",
    });

    this.option("typescript", {
      type: Boolean,
      required: false,
      default: true,
      desc: "Typescript use.",
    });

    this.option("buildInGit", {
      type: Boolean,
      required: false,
      default: true,
      desc: "Build is saved in git.",
    });
  }

  writing() {
    const dest = this.destinationPath(".gitignore");
    const withBabel = this.options.withBabel;
    // if (withBabel === undefined) {
    //   const babelEnvs = (pkg.pob && pkg.pob.babelEnvs) || [];
    //   withBabel = babelEnvs.length !== 0;
    // }

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
