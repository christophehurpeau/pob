import Generator from "yeoman-generator";
import { hasExpoApp } from "../../../utils/expoApps.js";
import inMonorepo from "../../../utils/inMonorepo.js";
import { writeAndFormatJson } from "../../../utils/writeAndFormat.js";
import { getRenovateExtends } from "./renovateExtends.js";

export default class CoreRenovateGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("disable", {
      type: Boolean,
      required: false,
      default: false,
      description: "disable",
    });

    this.option("app", {
      type: Boolean,
      required: false,
      default: false,
      description: "is app (instead of lib)",
    });

    this.option("updateOnly", {
      type: Boolean,
      required: false,
      default: false,
      description: "Avoid asking questions",
    });
  }

  initializing() {
    if (inMonorepo && !inMonorepo.root) {
      this.enableRenovate = false;
      this.config.delete("renovate");
      return;
    }

    this.enableRenovateConfig = this.config.get("renovate");
  }

  async prompting() {
    if (inMonorepo && !inMonorepo.root) {
      return;
    }

    if (this.options.updateOnly && this.enableRenovateConfig) {
      this.enableRenovate = this.enableRenovateConfig.enable;
      return;
    }

    this.enableRenovateConfig = await this.prompt({
      type: "confirm",
      name: "enable",
      message: "Enable renovate ?",
    });
    this.config.set("renovate", this.enableRenovateConfig);
    this.enableRenovate = this.enableRenovateConfig.enable;
  }

  async writing() {
    if (this.enableRenovate) {
      const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
      const renovateConfig = this.fs.readJSON(
        this.destinationPath("renovate.json"),
        {},
      );

      if (this.options.app) {
        renovateConfig.$schema =
          "https://docs.renovatebot.com/renovate-schema.json";
      }
      renovateConfig.extends = getRenovateExtends({
        app: this.options.app,
        pkgName: pkg.name,
        withExpo: await hasExpoApp({
          rootPath: this.destinationPath(),
          pobConfig: this.config.getAll(),
        }),
      });

      return writeAndFormatJson(
        this.fs,
        this.destinationPath("renovate.json"),
        renovateConfig,
      );
    } else if (this.fs.exists(this.destinationPath("renovate.json"))) {
      this.fs.delete(this.destinationPath("renovate.json"));
    }
  }
}
