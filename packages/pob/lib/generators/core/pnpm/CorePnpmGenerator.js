import { lt } from "semver";
import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
import { writeAndFormat } from "../../../utils/writeAndFormat.js";

export default class CorePnpmGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("type", {
      type: String,
      required: false,
      default: "lib",
      description: "Project type (app or lib)",
    });

    this.option("enable", {
      type: Boolean,
      required: true,
      description: "Enable pnpm",
    });
  }

  async writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (this.options.enable) {
      if (
        !pkg.packageManager ||
        !pkg.packageManager.startsWith("pnpm@") ||
        lt(pkg.packageManager.slice("pnpm@".length), "11.0.0")
      ) {
        pkg.packageManager = "pnpm@11.0.0";
      }

      packageUtils.removeDevDependencies(pkg, ["pinst"]);
      if (pkg.scripts?.prepack === "pinst --disable") {
        delete pkg.scripts.prepack;
      }
      if (pkg.scripts?.postpack === "pinst --enable") {
        delete pkg.scripts.postpack;
      }

      const npmrcContent = `save-prefix=${this.options.type === "app" ? "" : "^"}\n`;
      await writeAndFormat(this.fs, ".npmrc", npmrcContent);
    } else {
      if (pkg.packageManager?.startsWith("pnpm@")) {
        delete pkg.packageManager;
      }
      packageUtils.removeDevDependencies(pkg, ["pinst"]);
      if (pkg.scripts?.prepack === "pinst --disable") {
        delete pkg.scripts.prepack;
      }
      if (pkg.scripts?.postpack === "pinst --enable") {
        delete pkg.scripts.postpack;
      }
      this.fs.delete("pnpm-lock.yaml");
      this.fs.delete(".npmrc");
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  end() {
    if (this.options.enable) {
      this.spawnSync("pnpm", ["install"], {});
      this.spawnSync("pnpm", ["dedupe"], {});

      this.fs.delete("package-lock.json");
      this.fs.delete("yarn.lock");

      const pkg = this.fs.readJSON(this.destinationPath("package.json"));

      if (pkg.scripts?.preversion) {
        try {
          this.spawnSync("pnpm", ["run", "preversion"]);
        } catch {}
      } else if (pkg.scripts?.build) {
        try {
          this.spawnSync("pnpm", ["run", "build"]);
        } catch {}
      }
    }
  }
}
