import { readdirSync } from "node:fs";
import Generator from "yeoman-generator";
import { latestLTS } from "../../../utils/nodeVersions.js";
import * as packageUtils from "../../../utils/package.js";
import { packageManagerRun } from "../../../utils/packageManagerUtils.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

const rootConfigExtensionsRegex = /\.config\.(?:ts|mts|cts)$/;

const hasRootConfigFiles = (rootPath) => {
  try {
    return readdirSync(rootPath).some((name) =>
      rootConfigExtensionsRegex.test(name),
    );
  } catch {
    return false;
  }
};

export default class MonorepoTypescriptGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("enable", {
      type: Boolean,
      default: true,
      description: "enable typescript",
    });

    this.option("isAppProject", {
      type: Boolean,
      default: true,
      description: "app project, no building definitions",
    });

    this.option("packageNames", {
      type: String,
      required: true,
    });

    this.option("packagePaths", {
      type: String,
      required: true,
    });

    this.option("testRunner", {
      type: String,
      required: false,
    });

    this.option("checkOnly", {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option("onlyLatestLTS", {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option("packageManager", {
      type: String,
      required: false,
      default: "yarn",
    });
  }

  writing() {
    if (this.fs.exists("flow-typed")) this.fs.delete("flow-typed");
    if (this.fs.exists(this.destinationPath(".flowconfig"))) {
      this.fs.delete(this.destinationPath(".flowconfig"));
    }

    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    packageUtils.removeDevDependencies(pkg, ["flow-bin"]);

    if (pkg.scripts) {
      delete pkg.scripts.flow;
    }

    // "typescript" is aliased to the typescript 6 api package, still required by
    // typescript-eslint and typedoc. "@typescript/native" is typescript 7, which
    // provides the "tsc" binary.
    packageUtils.addOrRemoveDevDependencies(
      pkg,
      pkg.name === "@pob/eslint-config-monorepo" || this.options.enable,
      ["typescript", "@typescript/native"],
    );

    if (this.options.enable) {
      packageUtils.addScripts(pkg, {
        tsc: "tsc -b",
      });
      packageUtils.addOrRemoveScripts(
        pkg,
        !this.options.isAppProject && !this.options.checkOnly,
        {
          "build:definitions": "tsc -b",
        },
      );

      delete pkg.scripts.postbuild;

      if (!this.options.isAppProject && !this.options.checkOnly) {
        if (pkg.scripts.build) {
          pkg.scripts.build += ` && ${packageManagerRun(this.options.packageManager, "build:definitions")}`;
        } else {
          pkg.scripts.build = packageManagerRun(
            this.options.packageManager,
            "build:definitions",
          );
        }
      }
    } else if (pkg.scripts) {
      delete pkg.scripts.tsc;
      if (
        pkg.scripts.postbuild === "tsc -b tsconfig.build.json" ||
        pkg.scripts.postbuild === "tsc -b"
      ) {
        delete pkg.scripts.postbuild;
      }
      delete pkg.scripts["build:definitions"];
    }

    if (pkg.scripts) {
      delete pkg.scripts["typescript-check"];
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  // after pob ran in workspaces
  async end() {
    const tsconfigPath = this.destinationPath("tsconfig.json");
    const tsconfigCheckPath = this.destinationPath("tsconfig.check.json");
    const tsconfigBuildPath = this.destinationPath("tsconfig.build.json");
    const tsconfigTestPath = this.destinationPath("tsconfig.test.json");
    const tsconfigRootConfigsPath = this.destinationPath(
      "tsconfig.root-configs.json",
    );
    this.fs.delete(tsconfigTestPath);

    if (!this.options.enable) {
      this.fs.delete(tsconfigPath);
      this.fs.delete(tsconfigCheckPath);
      this.fs.delete(tsconfigBuildPath);
      this.fs.delete(tsconfigRootConfigsPath);
    } else {
      const packagePaths = JSON.parse(this.options.packagePaths);

      // root config files written in typescript (e.g. vitest.config.ts) are not
      // part of any package tsconfig, so they need a dedicated project for
      // type-aware linting and tsc -b
      const hasRootConfigs = hasRootConfigFiles(this.destinationPath());
      if (hasRootConfigs) {
        await copyAndFormatTpl(
          this.fs,
          this.templatePath("tsconfig.root-configs.json.ejs"),
          tsconfigRootConfigsPath,
          {
            nodeVersion: latestLTS,
          },
        );
      } else {
        this.fs.delete(tsconfigRootConfigsPath);
      }

      await copyAndFormatTpl(
        this.fs,
        this.templatePath("tsconfig.json.ejs"),
        tsconfigPath,
        {
          packagePaths,
          tsConfigSuffix: false,
          hasRootConfigs,
        },
      );

      this.fs.delete(tsconfigCheckPath);
      this.fs.delete(tsconfigBuildPath);
      // if (this.options.isAppProject) {
      // } else {
      //   await copyAndFormatTpl(
      //     this.fs,
      //     this.templatePath('tsconfig.check.json.ejs'),
      //     tsconfigCheckPath,
      //     {
      //       packagePaths: packagePaths.filter((packagePath) =>
      //         existsSync(`${packagePath}/tsconfig.check.json`),
      //       ),
      //     },
      //   );

      //   await copyAndFormatTpl(
      //     this.fs,
      //     this.templatePath('tsconfig.build.json.ejs'),
      //     tsconfigBuildPath,
      //     {
      //       packagePaths: packagePaths.filter((packagePath) =>
      //         existsSync(`${packagePath}/tsconfig.build.json`),
      //       ),
      //     },
      //   );
      // }
    }
  }
}
