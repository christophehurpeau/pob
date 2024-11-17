import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

export default class MonorepoTypescriptGenerator extends Generator {
  static path = fileURLToPath(import.meta.url);

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
      default: "jest",
    });

    this.option("checkOnly", {
      type: Boolean,
      required: false,
      default: false,
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

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      pkg.name === "@pob/eslint-config-monorepo" || this.options.enable,
      ["typescript"],
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
        pkg.scripts.build += " && yarn run build:definitions";
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
  end() {
    const tsconfigPath = this.destinationPath("tsconfig.json");
    const tsconfigCheckPath = this.destinationPath("tsconfig.check.json");
    const tsconfigBuildPath = this.destinationPath("tsconfig.build.json");
    const tsconfigTestPath = this.destinationPath("tsconfig.test.json");

    if (!this.options.enable) {
      this.fs.delete(tsconfigPath);
      this.fs.delete(tsconfigCheckPath);
      this.fs.delete(tsconfigBuildPath);
      this.fs.delete(tsconfigTestPath);
    } else {
      const packagePaths = JSON.parse(this.options.packagePaths);

      copyAndFormatTpl(
        this.fs,
        this.templatePath("tsconfig.json.ejs"),
        tsconfigPath,
        {
          packagePaths,
          tsConfigSuffix: false,
        },
      );

      if (this.options.testRunner === "node") {
        copyAndFormatTpl(
          this.fs,
          this.templatePath("tsconfig.json.ejs"),
          tsconfigTestPath,
          {
            packagePaths: packagePaths.filter((packagePath) =>
              existsSync(`${packagePath}/tsconfig.test.json`),
            ),
            tsConfigSuffix: "test",
          },
        );
      }

      this.fs.delete(tsconfigCheckPath);
      this.fs.delete(tsconfigBuildPath);
      // if (this.options.isAppProject) {
      // } else {
      //   copyAndFormatTpl(
      //     this.fs,
      //     this.templatePath('tsconfig.check.json.ejs'),
      //     tsconfigCheckPath,
      //     {
      //       packagePaths: packagePaths.filter((packagePath) =>
      //         existsSync(`${packagePath}/tsconfig.check.json`),
      //       ),
      //     },
      //   );

      //   copyAndFormatTpl(
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
