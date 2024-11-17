import { spawnSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

export default class MonorepoWorkspacesGenerator extends Generator {
  static path = fileURLToPath(import.meta.url);

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
      ...(config && config.pob),
    });
    const withBundler = this.packages.some((config) => {
      const pobConfig = getPackagePobConfig(config);
      return (
        pobConfig.babelEnvs.length > 0 || pobConfig.bundler === "rollup-babel"
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
    } else if (pkg.engines) {
      delete pkg.engines.yarn;
    }

    const isYarnVersionEnabled = true;

    if (pkg.name !== "pob-monorepo") {
      packageUtils.addDevDependencies(pkg, ["repository-check-dirty"]);
    }

    const monorepoConfig = this.config.get("monorepo");
    const packageManager = this.options.packageManager;

    packageUtils.addScripts(pkg, {
      lint: `${packageManager} run lint:prettier && ${packageManager} run lint:eslint`,
      "lint:prettier": "pob-root-prettier --check .",
      "lint:prettier:fix": "pob-root-prettier --write .",
      "lint:eslint":
        monorepoConfig &&
        monorepoConfig.eslint &&
        this.packagesConfig.length < 50
          ? `${
              this.packagesConfig.length > 15
                ? "NODE_OPTIONS=--max_old_space_size=4096 "
                : ""
            }eslint --quiet .`
          : // eslint-disable-next-line unicorn/no-nested-ternary
            this.options.packageManager === "yarn"
            ? `NODE_OPTIONS=--max_old_space_size=4096 eslint --report-unused-disable-directives --resolve-plugins-relative-to . --quiet . --ignore-pattern ${pkg.workspaces.join(
                ",",
              )} && yarn workspaces foreach --parallel -Av run lint:eslint`
            : "npm run lint:eslint --workspaces",
    });

    packageUtils.addOrRemoveScripts(
      pkg,
      this.options.packageManager === "yarn" && !isYarnVersionEnabled,
      {
        version:
          "YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn && git add yarn.lock",
      },
    );

    if (this.options.isAppProject) {
      packageUtils.addOrRemoveScripts(pkg, withBundler, {
        build:
          "yarn workspaces foreach --parallel --topological-dev -Av run build",
        watch:
          'yarn workspaces foreach --parallel --jobs unlimited --interlaced --exclude "*-example" -Av run watch',
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
      content = readmeFullContent.match(/^<h3[^#*]+([^]+)$/);
      if (!content) content = readmeFullContent.match(/^#[^#*]+([^]+)$/);
      content = content ? content[1].trim() : readmeFullContent;
    }

    copyAndFormatTpl(this.fs, this.templatePath("README.md.ejs"), readmePath, {
      projectName: pkg.name,
      description: pkg.description,
      packages: this.packages,
      ci: this.fs.exists(this.destinationPath(".github/workflows/push.yml")),
      content,
    });
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
      case "yarn":
        // see CoreYarnGenerator
        break;
      default:
        throw new Error("Invalid packageManager");
    }
  }
}
