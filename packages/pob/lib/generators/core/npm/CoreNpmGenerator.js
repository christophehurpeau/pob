import Generator from "yeoman-generator";

export default class CoreNpmGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("enable", {
      type: Boolean,
      required: false,
      default: true,
      description: "Enable npm",
    });

    this.option("srcDirectory", {
      type: String,
      required: true,
      default: "lib",
      description: "src directory to include in published files",
    });

    this.option("distDirectory", {
      type: String,
      required: false,
      description: "dist directory to include in published files",
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});

    if (!pkg.private && this.options.enable) {
      this.fs.copyTpl(
        this.templatePath("npmignore.ejs"),
        this.destinationPath(".npmignore"),
        {},
      );
    } else if (this.fs.exists(this.destinationPath(".npmignore"))) {
      this.fs.delete(this.destinationPath(".npmignore"));
    }

    if (!pkg.private && this.options.enable) {
      if (pkg.files?.length === 1 && pkg.files[0] === "lib/index.js") {
        // see rollup-plugin-svgr
      } else {
        const files = new Set([
          this.options.srcDirectory,
          this.options.distDirectory,
        ]);

        if (pkg.bin) {
          files.add("bin");
        }

        if (pkg.exports) {
          Object.values(pkg.exports).forEach((value) => {
            if (typeof value === "string" && value.startsWith("./tsconfigs/")) {
              files.add("tsconfigs");
            }
            if (
              typeof value === "string" &&
              value.startsWith("./") &&
              value !== "./package.json" &&
              ![...files].some((file) => value.startsWith(`./${file}/`))
            ) {
              files.add(value.slice("./".length));
            }
          });
        }
        if (pkg.pob?.extraEntries) {
          pkg.pob?.extraEntries.forEach((extraEntry) => {
            if (extraEntry.directory) {
              files.add(extraEntry.directory);
            }
          });
        }

        pkg.files = [...files].filter(Boolean);
      }
    } else {
      delete pkg.files;
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
