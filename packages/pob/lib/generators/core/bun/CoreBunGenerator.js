import Generator from "yeoman-generator";

export default class CoreBunGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("type", {
      type: String,
      required: false,
      default: "app",
      description: "Project type",
    });

    this.option("enable", {
      type: Boolean,
      required: true,
      description: "Enable bun",
    });
  }

  initializing() {
    if (this.options.enable) {
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (this.options.enable) {
      this.fs.copyTpl(
        this.templatePath("bunfig.toml.ejs"),
        this.destinationPath("bunfig.toml"),
        {},
      );
    } else {
      this.fs.delete("bun.lock");
      this.fs.delete("bunfig.toml");
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  end() {
    if (this.options.enable) {
      this.spawnSync("bun", ["install", "--save-text-lockfile"], {});

      const pkg = this.fs.readJSON(this.destinationPath("package.json"));

      if (pkg.scripts.preversion) {
        try {
          this.spawnSync("bun", ["run", "preversion"]);
        } catch {}
      } else if (pkg.scripts.build) {
        try {
          this.spawnSync("bun", ["run", "build"]);
        } catch {}
      }
    }
  }
}
