import fs from "node:fs";
import path from "node:path";
import Generator from "yeoman-generator";
import inMonorepo from "../../../utils/inMonorepo.js";
import * as packageUtils from "../../../utils/package.js";
import { askName } from "./askName.js";

export default class CorePackageGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("isMonorepo", {
      type: Boolean,
      required: true,
      default: false,
      description: "is monorepo",
    });

    this.option("inMonorepo", {
      type: Boolean,
      required: true,
      default: false,
      description: "in monorepo",
    });

    this.option("isRoot", {
      type: Boolean,
      required: true,
      default: false,
      description: "is root",
    });

    this.option("private", {
      type: Boolean,
      required: false,
      default: false,
      description: "private package",
    });

    this.option("packageType", {
      type: String,
      required: false,
      description: "package type",
    });

    this.option("packageManager", {
      type: String,
      required: false,
      description: "package manager",
    });
  }

  async initializing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});

    if (!pkg.engines) pkg.engines = {};

    // dont override engines if set to latest
    if (
      !pkg.engines.node ||
      !(
        pkg.engines.node.startsWith(">=22.") ||
        pkg.engines.node.startsWith(">=24.")
      )
    ) {
      // this might be overridden by babel generator
      pkg.engines.node = ">=22.18.0"; // 22.18.0 is the version with strip typescript out of experimental status
    }

    if (pkg.engines.node.startsWith(">=22.11.")) {
      pkg.engines.node = ">=22.18.0";
    }

    if (!this.options.isRoot) {
      delete pkg.packageManager;
    }

    if (pkg.pob && pkg.main && !pkg.exports) {
      const result = await this.prompt({
        type: "confirm",
        name: "setupExports",
        message: 'Setup package.json "exports" field based on "main" ?',
      });

      if (result.setupExports) {
        pkg.exports = pkg.main;
      }
    }

    if (!this.options.updateOnly) {
      if (this.options.isMonorepo && this.options.isRoot) {
        pkg.private = true;
      } else if (this.options.private) {
        pkg.private = true;
      } else {
        const { isPrivate } = await this.prompt({
          type: "confirm",
          name: "isPrivate",
          message: "Private package ?",
          default: pkg.private === true,
        });
        if (isPrivate) {
          pkg.private = isPrivate;
        } else {
          delete pkg.private;
        }
      }
    }

    if (this.options.isMonorepo && this.options.isRoot) {
      if (!pkg.name) {
        const { name } = await this.prompt({
          name: "name",
          message: "Monorepo Name",
          default: path.basename(process.cwd()),
          validate: (str) => str.length > 0,
        });
        pkg.name = name;
      } else if (pkg.name.endsWith("-lerna")) {
        pkg.name = pkg.name.replace("-lerna", "-monorepo");
      }
    } else if (!pkg.name) {
      const prompt = {
        name: "name",
        message: "Module Name",
        default: path.basename(process.cwd()),
        validate: (str) => str.length > 0,
      };

      const { name } = await (pkg.private
        ? this.prompt([prompt])
        : askName(prompt, this));
      pkg.name = name;
    }

    if (this.options.packageType) {
      pkg.type = this.options.packageType;
    }

    let author = packageUtils.parsePkgAuthor(pkg);

    const props = await this.prompt(
      [
        !this.options.updateOnly &&
          !(this.options.isMonorepo && this.options.isRoot) && {
            name: "description",
            message: "Description",
            default: pkg.description,
          },
        {
          name: "authorName",
          message: "Author's Name",
          when: !pkg.authors && (!author || !author.name),
          default: await this.git.name(),
        },
        {
          name: "authorEmail",
          message: "Author's Email",
          when: !pkg.authors && (!author || !author.email),
          default: await this.git.email(),
        },
        {
          name: "authorUrl",
          message: "Author's Homepage",
          when: !pkg.authors && (!author || !author.url),
        },
        {
          name: "type",
          message: "Package Type",
          type: "list",
          choices: ["commonjs", "module"],
          when: !pkg.type,
        },
        {
          name: "license",
          message: "License Type",
          type: "list",
          choices: ["MIT", "ISC", "UNLICENSED"],
          when: !pkg.license,
        },
      ].filter(Boolean),
    );

    if (!pkg.type) pkg.type = props.type;
    if (
      inMonorepo &&
      !inMonorepo.root &&
      inMonorepo.rootMonorepoPkg.type === "module"
    ) {
      pkg.type = "module";
    }

    pkg.description = this.options.updateOnly
      ? pkg.description
      : props.description || pkg.description;

    if (this.options.inMonorepo && !this.options.isRoot) {
      const rootMonorepoPkg = inMonorepo.rootMonorepoPkg;
      const rootRepositoryUrl =
        typeof rootMonorepoPkg.repository === "string"
          ? rootMonorepoPkg.repository
          : rootMonorepoPkg.repository.url;
      pkg.repository = {
        type: "git",
        url: rootRepositoryUrl,
        directory: process.cwd().slice(inMonorepo.rootPath.length + 1),
      };
      pkg.homepage = rootMonorepoPkg.homepage;

      if (this.fs.exists(this.destinationPath("yarn.lock"))) {
        fs.unlinkSync(this.destinationPath("yarn.lock"));
      }
    }
    if (this.fs.exists(this.destinationPath("yarn-error.log"))) {
      fs.unlinkSync(this.destinationPath("yarn-error.log"));
    }

    if (this.options.inMonorepo && !this.options.isRoot) {
      packageUtils.removeScripts(pkg, ["checks"]);
      packageUtils.removeDevDependencies(pkg, ["check-package-dependencies"]);
    } else if (this.options.isMonorepo && this.options.isRoot) {
      const doesMjsCheckPackagesExists = this.fs.exists(
        this.destinationPath("scripts/check-packages.mjs"),
      );
      const doesJsCheckPackagesExists = this.fs.exists(
        this.destinationPath("scripts/check-packages.js"),
      );

      if (doesJsCheckPackagesExists || doesMjsCheckPackagesExists) {
        packageUtils.addDevDependencies(pkg, ["check-package-dependencies"]);
      }

      packageUtils.addOrRemoveScripts(
        pkg,
        doesMjsCheckPackagesExists || doesJsCheckPackagesExists,
        {
          checks: `node scripts/check-packages.${
            doesMjsCheckPackagesExists ? "mjs" : "js"
          }`,
        },
      );
    } else if (inMonorepo && !inMonorepo.root) {
      if (this.fs.exists("scripts/check-package.js")) {
        this.fs.delete("scripts/check-package.js");
      }
      if (this.fs.exists("scripts/check-package.mjs")) {
        this.fs.delete("scripts/check-package.mjs");
      }
      packageUtils.removeScripts(pkg, ["checks"]);
    } else {
      const doesMjsCheckPackageExists = this.fs.exists(
        this.destinationPath("scripts/check-package.mjs"),
      );
      let doesJsCheckPackageExists = this.fs.exists(
        this.destinationPath("scripts/check-package.js"),
      );

      if (pkg.type === "module") {
        if (!doesJsCheckPackageExists) {
          doesJsCheckPackageExists = true;
          this.fs.copyTpl(
            this.templatePath("check-package.js.ejs"),
            this.destinationPath("scripts/check-package.js"),
            {
              isLibrary: pkg.private !== true,
            },
          );
        }
      }
      if (doesJsCheckPackageExists || doesMjsCheckPackageExists) {
        packageUtils.addDevDependencies(pkg, ["check-package-dependencies"]);
      }

      packageUtils.addOrRemoveScripts(
        pkg,
        doesMjsCheckPackageExists || doesJsCheckPackageExists,
        {
          checks: `node scripts/check-package.${
            doesMjsCheckPackageExists ? "mjs" : "js"
          }`,
        },
      );
    }

    if (!pkg.authors) {
      author = {
        name: props.authorName || author.name,
        email: props.authorEmail || author.email,
        url: props.authorUrl || (author && author.url),
      };

      pkg.author = `${author.name} <${author.email}>${
        author.url ? ` (${author.url})` : ""
      }`;
    }

    if (!pkg.license) {
      pkg.license = props.license;
      this.fs.copyTpl(
        this.templatePath(`licenses/${props.license}.ejs`),
        this.destinationPath("LICENSE"),
        {
          year: new Date().getFullYear(),
          author: pkg.author,
        },
      );
    }

    if (pkg.private) {
      if (!pkg.description) delete pkg.description;
      if (!pkg.keywords || pkg.keywords.length === 0) delete pkg.keywords;
    } else if (!pkg.keywords) {
      pkg.keywords = [];
    }

    if (!pkg.private && !pkg.version) {
      // lerna root pkg should not have version
      pkg.version = "0.0.0";
    }

    if (!pkg.private && !pkg.publishConfig && pkg.name[0] === "@") {
      pkg.publishConfig = {
        access: "public",
      };
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
    if (!pkg.scripts) pkg.scripts = {};

    const installPostinstallScript = (scriptName) => {
      if (
        !pkg.scripts[scriptName] ||
        !pkg.scripts[scriptName].includes("pob-root-postinstall")
      ) {
        pkg.scripts[scriptName] = "pob-root-postinstall";
      }
    };

    const uninstallPostinstallScript = (scriptName) => {
      if (pkg.scripts && pkg.scripts[scriptName]) {
        if (pkg.scripts[scriptName] === "pob-root-postinstall") {
          delete pkg.scripts[scriptName];
        } else if (
          pkg.scripts[scriptName].startsWith("pob-root-postinstall && ")
        ) {
          pkg.scripts[scriptName] = pkg.scripts[scriptName].slice(
            "pob-root-postinstall && ".length - 1,
          );
        } else if (pkg.scripts[scriptName].includes("pob-root-postinstall")) {
          throw new Error("Could not remove pob-root-postinstall");
        }
      }
    };
    if (this.options.inMonorepo || inMonorepo || pkg.private) {
      uninstallPostinstallScript("postinstallDev");
      if (this.options.isRoot) {
        installPostinstallScript("postinstall");
      } else {
        uninstallPostinstallScript("postinstall");
      }
    } else if (this.options.packageManager === "yarn") {
      uninstallPostinstallScript("postinstallDev");
      installPostinstallScript("postinstall");
    } else {
      uninstallPostinstallScript("postinstallDev");
      installPostinstallScript("postinstall");
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
