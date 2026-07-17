import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
import {
  workspacesRunExcluding,
  workspacesRunTopological,
} from "../../../utils/packageManagerWorkspacesUtils.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

export default class MonorepoWorkspacesGenerator extends Generator {
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
      description: "yarn, npm, bun, or pnpm",
    });

    this.option("disableYarnGitCache", {
      type: Boolean,
      required: false,
      default: false,
      description:
        "Disable git cache. See https://yarnpkg.com/features/caching#offline-mirror.",
    });
  }

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

  default() {}

  writing() {
    const getPackagePobConfig = (config) => ({
      babelEnvs: [],
      envs: [],
      ...(config && config.pob),
    });
    const withBundler = this.packages.some((config) => {
      const pobConfig = getPackagePobConfig(config);
      return (
        pobConfig.envs.length > 0 ||
        pobConfig.babelEnvs.length > 0 ||
        pobConfig.bundler === "rollup-babel"
      );
    });

    // package.json
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
    packageUtils.removeDependencies(pkg, ["@pob/lerna-light"]);
    packageUtils.removeDevDependencies(pkg, ["@pob/lerna-light"]);

    if (this.options.packageManager === "npm") {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = "< 0.0.0";
      pkg.engines.npm = ">= 6.4.0";
    } else if (this.options.packageManager === "pnpm") {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.pnpm = ">= 11.0.0";
      delete pkg.engines.yarn;
    } else if (pkg.engines) {
      delete pkg.engines.yarn;
    }

    const monorepoConfig = this.config.get("monorepo");
    const packageManager = this.options.packageManager;

    packageUtils.addScripts(pkg, {
      lint: `${packageManager} run format && ${packageManager} run lint:eslint`,
      format: "oxfmt",
      "format:check": "oxfmt --check .",
      "lint:eslint":
        monorepoConfig &&
        monorepoConfig.eslint &&
        `${
          this.packagesConfig.length > 15
            ? "NODE_OPTIONS=--max_old_space_size=4096 "
            : ""
        }eslint --quiet .`,
    });

    if (
      pkg.scripts?.version ===
      "YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn && git add yarn.lock"
    ) {
      delete pkg.scripts.version;
    }

    if (this.options.isAppProject) {
      packageUtils.addOrRemoveScripts(pkg, withBundler, {
        build: workspacesRunTopological(packageManager, "build"),
        watch: workspacesRunExcluding(packageManager, "watch", "*-example"),
      });
    }

    // packageUtils.addOrRemoveScripts(pkg, withTypescript, {
    //   'build:definitions': `${
    //     useYarnWorkspacesCommand
    //       ? 'yarn workspaces foreach --parallel --exclude "*-example" -Av run'
    //       : 'lerna run --stream'
    //   } build:definitions`,
    // });

    // if (withTypescript) {
    //   pkg.scripts.build += `${packageManager} run build:definitions${
    //     useYarnWorkspacesCommand ? '' : ' --since'
    //   }`;
    // }

    delete pkg.scripts.postbuild;
    delete pkg.scripts.prepublishOnly;

    if (!pkg.workspaces) {
      pkg.workspaces = ["packages/*"];
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);

    // README.md
    const readmePath = this.destinationPath("README.md");

    let content = "";

    if (this.fs.exists(readmePath)) {
      const readmeFullContent = this.fs.read(readmePath);
      // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/match-any
      content = readmeFullContent.match(/^<h1 align="center"[^#*]+([^]+)$/);
      if (!content) {
        // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/match-any
        content = readmeFullContent.match(/^<h3 align="center"[^#*]+([^]+)$/);
      }
      if (!content) {
        // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/match-any
        content = readmeFullContent.match(/^<h3[^#*]+([^]+)$/);
      }
      // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/match-any
      if (!content) content = readmeFullContent.match(/^#[^#*]+([^]+)$/);
      content = content ? content[1].trim() : readmeFullContent;
    }

    return copyAndFormatTpl(
      this.fs,
      this.templatePath("README.md.ejs"),
      readmePath,
      {
        title: pkg.description,
        description: "",
        packages: this.packages,
        ci: this.fs.exists(this.destinationPath(".github/workflows/push.yml")),
        content,
      },
    );
  }

  end() {
    this.packagePaths.forEach((packagePath) => {
      if (
        !existsSync(`${packagePath}/.yo-rc.json`) &&
        !existsSync(`${packagePath}/.pob.json`)
      ) {
        return;
      }
      console.log(`=> update ${packagePath}`);
      spawnSync(
        process.argv[0],
        [
          process.argv[1],
          "update",
          "from-pob",
          this.options.force ? "--force" : undefined,
        ].filter(Boolean),
        {
          cwd: packagePath,
          stdio: "inherit",
        },
      );
    });

    switch (this.options.packageManager) {
      case "npm":
        this.spawnCommandSync("npm", ["install"]);
        this.spawnCommandSync("npm", ["run", "preversion"]);
        break;
      case "pnpm":
        // see CorePnpmGenerator
        break;
      case "yarn":
        // see CoreYarnGenerator
        break;
      case "bun":
        // see CoreBunGenerator
        break;
      default:
        throw new Error("Invalid packageManager");
    }
  }
}
