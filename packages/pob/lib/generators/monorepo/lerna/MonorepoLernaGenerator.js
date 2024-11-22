import { readdirSync, existsSync } from "node:fs";
import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
import { writeAndFormatJson } from "../../../utils/writeAndFormat.js";

export default class MonorepoLernaGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("isAppProject", {
      type: Boolean,
      default: true,
      description: "is app project",
    });

    this.option("packageManager", {
      type: String,
      default: "yarn",
      description: "yarn or npm",
    });

    this.option("disableYarnGitCache", {
      type: Boolean,
      required: false,
      default: false,
      description:
        "Disable git cache. See https://yarnpkg.com/features/caching#offline-mirror.",
    });
  }

  // TODO pass packages as options ?
  initializing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
    const packagesPaths = pkg.workspaces
      ? pkg.workspaces.map((workspace) => workspace.replace(/\/\*$/, ""))
      : ["packages"];

    this.packagePaths = packagesPaths.flatMap((packagesPath) =>
      existsSync(`${packagesPath}/`)
        ? readdirSync(`${packagesPath}/`).map(
            (packageName) => `${packagesPath}/${packageName}`,
          )
        : [],
    );
    this.packages = this.packagePaths
      .map((packagePath) =>
        this.fs.readJSON(this.destinationPath(`${packagePath}/package.json`)),
      )
      .filter(Boolean);
    this.packagesConfig = this.packagePaths
      .map((packagePath) =>
        this.fs.readJSON(this.destinationPath(`${packagePath}/.yo-rc.json`)),
      )
      .filter(Boolean);
  }

  default() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});

    const lernaCurrentConfig = this.fs.readJSON(
      this.destinationPath("lerna.json"),
      pkg.lerna || {},
    );

    this.npm =
      lernaCurrentConfig.version && lernaCurrentConfig.npmClient !== "yarn";

    // lerna.json
    const lernaConfig = this.npm
      ? {
          version: "independent",
        }
      : {
          version: lernaCurrentConfig.version || "independent",
          npmClient: "yarn",
          useWorkspaces: true,
        };

    if (!lernaConfig.command) lernaConfig.command = {};
    if (!lernaConfig.command.publish) lernaConfig.command.publish = {};

    lernaConfig.command.publish.ignoreChanges =
      (lernaCurrentConfig &&
        lernaCurrentConfig.command &&
        lernaCurrentConfig.command.publish &&
        lernaCurrentConfig.command.publish.ignoreChanges) ||
      [];

    writeAndFormatJson(
      this.fs,
      this.destinationPath("lerna.json"),
      lernaConfig,
    );
  }

  writing() {
    // package.json
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
    delete pkg.lerna;
    packageUtils.removeDependencies(pkg, ["lerna"]);
    packageUtils.removeDevDependencies(pkg, ["lerna"]);

    // TODO remove lerna completely
    const isYarnVersionEnabled = true;

    const getPackagePobConfig = (config) => ({
      babelEnvs: [],
      ...(config && config.pob),
    });
    const withBabel = this.packages.some((config) => {
      const pobConfig = getPackagePobConfig(config);
      return (
        pobConfig.babelEnvs.length > 0 || pobConfig.bundler === "rollup-babel"
      );
    });

    // lerna.json
    const lernaConfig = this.fs.readJSON(
      this.destinationPath("lerna.json"),
      {},
    );

    // TODO pass that to yarn plugin
    lernaConfig.command.publish.ignoreChanges = [
      "**/.yo-rc.json",
      "**/.eslintrc.json",
    ];

    if (withBabel) {
      lernaConfig.command.publish.ignoreChanges.push("**/tsconfig.json");
    }

    if (isYarnVersionEnabled) {
      if (pkg.version === "0.0.0" && lernaConfig && lernaConfig.version) {
        if (lernaConfig.version === "independent") {
          delete pkg.version;
        } else {
          pkg.version = lernaConfig.version;
        }
      }
      this.fs.delete(this.destinationPath("lerna.json"));
    } else {
      writeAndFormatJson(
        this.fs,
        this.destinationPath("lerna.json"),
        lernaConfig,
      );
    }

    if (this.fs.exists(this.destinationPath("lerna-debug.log"))) {
      this.fs.delete(this.destinationPath("lerna-debug.log"));
    }

    packageUtils.addOrRemoveScripts(
      pkg,
      this.options.packageManager === "yarn" && !isYarnVersionEnabled,
      {
        version:
          "YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn && git add yarn.lock",
      },
    );

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
