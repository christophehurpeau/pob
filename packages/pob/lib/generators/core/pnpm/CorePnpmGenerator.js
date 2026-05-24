import sortObject from "@pob/sort-object";
import yml from "js-yaml";
import { lt } from "semver";
import Generator from "yeoman-generator";
import { writeAndFormat } from "../../../utils/writeAndFormat.js";

const minimumReleaseAgeExcludePackages = [
  "@pob/*",
  "pob-dependencies",
  "alouette",
  "alouette-icons",
  "nightingale",
  "nightingale-logger",
];

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
        pkg.packageManager &&
        (!pkg.packageManager.startsWith("pnpm@") ||
          lt(pkg.packageManager.slice("pnpm@".length), "11.0.0"))
      ) {
        pkg.packageManager = "pnpm@11.0.0";
      }

      const configString = this.fs.read(
        this.destinationPath("pnpm-workspace.yaml"),
        { defaults: "" },
      );
      const config =
        yml.load(configString, {
          schema: yml.FAILSAFE_SCHEMA,
          json: true,
        }) || {};

      if (pkg.workspaces) {
        config.packages = pkg.workspaces;
      } else {
        delete config.packages;
      }
      config.savePrefix = this.options.type === "app" ? "" : "^";
      config.minimumReleaseAge = 1440 * 3; // 3 days in minutes
      config.minimumReleaseAgeExclude = minimumReleaseAgeExcludePackages;
      config.dedupePeerDependents = true;

      await writeAndFormat(
        this.fs,
        this.destinationPath("pnpm-workspace.yaml"),
        yml.dump(sortObject(config), { lineWidth: 9999, noCompatMode: true }),
      );
    } else {
      if (pkg.packageManager?.startsWith("pnpm@")) {
        delete pkg.packageManager;
      }
      this.fs.delete("pnpm-lock.yaml");
      this.fs.delete("pnpm-workspace.yaml");
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
