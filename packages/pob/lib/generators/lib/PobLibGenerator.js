import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Generator from "yeoman-generator";
import inMonorepo from "../../utils/inMonorepo.js";
import * as packageUtils from "../../utils/package.js";
import CommonBabelGenerator from "../common/babel/CommonBabelGenerator.js";
import CommonLintGenerator from "../common/format-lint/CommonLintGenerator.js";
import CommonHuskyGenerator from "../common/husky/CommonHuskyGenerator.js";
import CommonRemoveOldDependenciesGenerator from "../common/old-dependencies/CommonRemoveOldDependenciesGenerator.js";
import CommonReleaseGenerator from "../common/release/CommonReleaseGenerator.js";
import CommonTestingGenerator from "../common/testing/CommonTestingGenerator.js";
import CommonTranspilerGenerator from "../common/transpiler/CommonTranspilerGenerator.js";
import CommonTypescriptGenerator from "../common/typescript/CommonTypescriptGenerator.js";
import CoreGitignoreGenerator from "../core/gitignore/CoreGitignoreGenerator.js";
import CoreNpmGenerator from "../core/npm/CoreNpmGenerator.js";
import CoreSortPackageGenerator from "../core/sort-package/CoreSortPackageGenerator.js";
import CoreVSCodeGenerator from "../core/vscode/CoreVSCodeGenerator.js";
import LibDocGenerator from "./doc/LibDocGenerator.js";
import LibReadmeGenerator from "./readme/LibReadmeGenerator.js";

export default class PobLibGenerator extends Generator {
  static path = fileURLToPath(import.meta.url);

  constructor(args, opts) {
    super(args, opts);

    this.option("updateOnly", {
      type: Boolean,
      required: false,
      default: false,
      description: "Avoid asking questions",
    });

    this.option("fromPob", {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option("packageManager", {
      type: String,
      default: "yarn",
      description: "yarn or npm",
    });

    this.option("yarnNodeLinker", {
      type: String,
      required: false,
      default: "node-modules",
      description:
        "Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.",
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
    this.pobjson =
      this.config.get("lib") ||
      this.config.get("pob") ||
      this.config.get("pob-config") ||
      this.config.get("pob-lib-config");

    if (!this.pobjson) {
      this.pobjson = this.fs.readJSON(this.destinationPath(".pob.json"), null);
      if (this.pobjson) {
        this.config.set("lib", this.pobjson);
      }
    }

    this.config.delete("libtest"); // deprecated
    this.config.delete("pob"); // deprecated
    this.config.delete("pob-config"); // deprecated
    this.config.delete("pob-lib-config"); // deprecated
    this.config.save();
    this.fs.delete(".pob.json"); // deprecated

    if (!this.pobjson || this.pobjson.babelEnvs) {
      this.pobjson = {};
      this.updateOnly = false;
    } else {
      this.updateOnly = this.options.updateOnly;
    }

    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    const pobPkgConfig = pkg.pob || {};

    let babelEnvs =
      this.pobjson.envs ||
      pobPkgConfig.babelEnvs ||
      (pobPkgConfig.bundler === "rollup-babel" && pobPkgConfig.envs);
    const entries = this.pobjson.entries || pobPkgConfig.entries;
    const jsx =
      this.pobjson.withReact || pobPkgConfig.withReact || pobPkgConfig.jsx;

    if (babelEnvs && typeof babelEnvs[0] === "string") {
      babelEnvs = babelEnvs.map((env) => {
        switch (env) {
          case "node6":
          case "node7":
          case "node8":
          case "node10":
            return {
              target: "node",
              version: 14,
              formats: ["cjs"],
            };

          case "webpack-node7":
          case "module-node7":
          case "module-node8":
            return {
              target: "node",
              version: 14,
              formats: ["es"],
            };

          case "module":
          case "webpack":
            return { target: "browser", formats: ["es"] };

          case "module-modern-browsers":
          case "webpack-modern-browsers":
            return {
              target: "browser",
              version: "modern",
              formats: ["es"],
            };

          case "browsers":
            return { target: "browser", formats: ["cjs"] };

          default:
            throw new Error(`Unsupported env ${env}`);
        }
      });
    }

    if (this.pobjson.testing === true) {
      this.pobjson.testing = {
        ci: true,
        codecov: true,
      };
    } else if (this.pobjson.testing) {
      delete this.pobjson.testing.travisci;
      if ("circleci" in this.pobjson.testing) {
        this.pobjson.testing.ci = this.pobjson.testing.circleci;
        delete this.pobjson.testing.circleci;
      }
    }

    if (typeof this.pobjson.documentation === "object") {
      this.pobjson.documentation = true;
    }

    delete this.pobjson.doclets;
    delete this.pobjson.flow;
    delete this.pobjson.react;
    delete this.pobjson.entries;
    delete this.pobjson.envs;
    delete this.pobjson.withReact;

    pkg.pob = pkg.pob || {};

    delete pkg.pob.withReact;
    if (babelEnvs && babelEnvs.length > 0) {
      delete pkg.pob.babelEnvs;
      pkg.pob.bundler = "rollup-babel";
      pkg.pob.envs = babelEnvs;
      pkg.pob.entries = entries;
      pkg.pob.jsx = jsx;
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    // documentation
    if (inMonorepo && !inMonorepo.root) {
      this.pobjson.documentation = false;
    } else {
      const answers = await this.prompt([
        {
          type: "confirm",
          name: "documentation",
          message: "Would you like documentation (manually generated) ?",
          when: !this.updateOnly || this.pobjson.documentation === undefined,
          default:
            this.pobjson.documentation != null
              ? this.pobjson.documentation
              : true,
        },
      ]);

      Object.assign(this.pobjson, answers);
    }

    // testing
    if (!this.updateOnly || this.pobjson.testing === undefined) {
      const { testing } = await this.prompt({
        type: "confirm",
        name: "testing",
        message: "Would you like testing ?",
        default: this.pobjson.testing || false,
      });
      this.pobjson.testing = !testing ? false : this.pobjson.testing || {};
    }

    if (this.pobjson.testing && !(inMonorepo || inMonorepo.root)) {
      const testingPrompts = await this.prompt([
        {
          type: "confirm",
          name: "ci",
          message: "Would you like ci with github actions ?",
          when: !this.updateOnly || this.pobjson.testing?.ci === undefined,
          default: this.pobjson.testing.ci !== false,
        },
        {
          type: "list",
          name: "runner",
          message: "Testing runner ?",
          when: !this.updateOnly || this.pobjson.testing?.runner === undefined,
          default: this.pobjson.testing?.runner || "jest",
          choices: [
            {
              name: "Vitest",
              value: "vitest",
            },
            {
              name: "Jest",
              value: "jest",
            },
            {
              name: "node:test",
              value: "node",
            },
          ],
        },
        {
          type: "confirm",
          name: "codecov",
          message: "Would you like codecov ?",
          when: !this.updateOnly || this.pobjson.testing?.codecov === undefined,
          default: this.pobjson.testing.codecov === true,
        },
      ]);
      Object.assign(this.pobjson.testing, testingPrompts);
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);

    this.composeWith(
      {
        Generator: CommonBabelGenerator,
        path: CommonBabelGenerator.path,
      },
      {
        updateOnly: this.options.updateOnly,
        testing: !!this.pobjson.testing,
        documentation: !!this.pobjson.documentation,
        fromPob: this.options.fromPob,
        onlyLatestLTS: false,
      },
    );
    this.composeWith(
      {
        Generator: CommonTranspilerGenerator,
        path: CommonTranspilerGenerator.path,
      },
      {
        updateOnly: this.options.updateOnly,
        testing: !!this.pobjson.testing,
        documentation: !!this.pobjson.documentation,
        fromPob: this.options.fromPob,
        onlyLatestLTS: false,
      },
    );
  }

  default() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    const babelEnvs =
      pkg.pob.babelEnvs ||
      (((!pkg.pob.bundler && pkg.pob.typescript !== true) ||
        pkg.pob.bundler === "rollup-babel") &&
        pkg.pob.envs) ||
      [];

    const withBabel = babelEnvs.length > 0;
    const withTypescript = withBabel || pkg.pob.typescript === true;
    const jsx = (withBabel || withTypescript) && pkg.pob.jsx === true;
    const browser = pkg.pob.envs?.some((env) => env.target === "browser");

    this.composeWith(
      {
        Generator: CommonTypescriptGenerator,
        path: CommonTypescriptGenerator.path,
      },
      {
        enable:
          withTypescript ||
          pkg.pob.typescript === "check-only" ||
          (inMonorepo &&
            inMonorepo.pobMonorepoConfig.typescript === "check-only"),
        onlyCheck:
          pkg.pob.typescript === "check-only" ||
          (inMonorepo &&
            inMonorepo.pobMonorepoConfig.typescript === "check-only"),
        isApp: false,
        dom: browser,
        jsx,
        updateOnly: this.options.updateOnly,
        baseUrl: "none", // causes issues on dist definition files
        builddefs: true,
        onlyLatestLTS: false,
        srcDirectory: withTypescript ? "src" : "lib",
      },
    );

    this.composeWith(
      {
        Generator: CommonHuskyGenerator,
        path: CommonHuskyGenerator.path,
      },
      {},
    );

    this.composeWith({
      Generator: CommonRemoveOldDependenciesGenerator,
      path: CommonRemoveOldDependenciesGenerator.path,
    });

    const enableReleasePlease =
      !inMonorepo && this.pobjson.testing && this.pobjson.testing.ci;

    this.composeWith(
      {
        Generator: CommonTestingGenerator,
        path: CommonTestingGenerator.path,
      },
      {
        enable: this.pobjson.testing,
        disableYarnGitCache: this.options.disableYarnGitCache,
        enableReleasePlease,
        testing: this.pobjson.testing,
        e2eTesting: false,
        runner: this.pobjson.testing
          ? (inMonorepo
              ? inMonorepo.pobMonorepoConfig.testRunner
              : this.pobjson.testing.runner) || "jest"
          : undefined,
        build: withBabel || withTypescript,
        typescript: withTypescript,
        documentation: !!this.pobjson.documentation,
        codecov: this.pobjson.testing && this.pobjson.testing.codecov,
        ci: this.pobjson.testing && this.pobjson.testing.ci,
        packageManager: this.options.packageManager,
        isApp: false,
        splitCIJobs: false,
        srcDirectory: withBabel || withTypescript ? "src" : "lib",
      },
    );

    // must be after testing
    this.composeWith(
      {
        Generator: CommonLintGenerator,
        path: CommonLintGenerator.path,
      },
      {
        typescript: withTypescript,
        build: withTypescript,
        documentation:
          !!this.pobjson.documentation ||
          !!(this.pobjson.testing && this.pobjson.testing.codecov),
        testing: !!this.pobjson.testing,
        testRunner: inMonorepo
          ? inMonorepo.pobMonorepoConfig.testRunner
          : this.pobjson.testing?.runner,
        packageManager: this.options.packageManager,
        yarnNodeLinker: this.options.yarnNodeLinker,
        ignorePaths: withBabel || withTypescript ? "/dist" : "",
      },
    );

    this.composeWith(
      {
        Generator: LibDocGenerator,
        path: LibDocGenerator.path,
      },
      {
        enabled: this.pobjson.documentation,
        testing: this.pobjson.testing,
      },
    );

    // must be after doc, testing
    this.composeWith(
      {
        Generator: LibReadmeGenerator,
        path: LibReadmeGenerator.path,
      },
      {
        documentation: !!this.pobjson.documentation,
        testing: !!this.pobjson.testing,
        ci: this.pobjson.testing && this.pobjson.testing.ci,
        codecov: this.pobjson.testing && this.pobjson.testing.codecov,
      },
    );

    this.composeWith(
      {
        Generator: CommonReleaseGenerator,
        path: CommonReleaseGenerator.path,
      },
      {
        enable: !inMonorepo && this.pobjson.testing,
        enablePublish: true,
        withBabel,
        withTypescript,
        isMonorepo: false,
        enableYarnVersion: true,
        ci: this.pobjson.testing && this.pobjson.testing.ci,
        disableYarnGitCache: this.options.disableYarnGitCache,
        updateOnly: this.options.updateOnly,
      },
    );

    this.composeWith(
      {
        Generator: CoreVSCodeGenerator,
        path: CoreVSCodeGenerator.path,
      },
      {
        root: !inMonorepo,
        monorepo: false,
        packageManager: this.options.packageManager,
        yarnNodeLinker: this.options.yarnNodeLinker,
        typescript: withBabel || withTypescript,
        testing: this.pobjson.testing,
        testRunner: this.pobjson.testRunner,
      },
    );

    // must be after doc, testing
    this.composeWith(
      {
        Generator: CoreGitignoreGenerator,
        path: CoreGitignoreGenerator.path,
      },
      {
        root: !inMonorepo,
        withBabel: babelEnvs.length > 0,
        typescript: withTypescript,
        documentation: this.pobjson.documentation,
        testing: !!this.pobjson.testing,
      },
    );

    this.composeWith(
      {
        Generator: CoreNpmGenerator,
        path: CoreNpmGenerator.path,
      },
      {
        enable: !pkg.private,
        srcDirectory: withBabel || withTypescript ? "src" : "lib",
        distDirectory: withBabel || withTypescript ? "dist" : "",
      },
    );
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (pkg.engines) {
      delete pkg.engines.yarn;
    }

    if ("sideEffects" in pkg) {
      pkg.sideEffects = false;
    }

    const withBabel = Boolean(
      pkg.pob.babelEnvs ||
        (!pkg.pob.bundler && pkg.pob.typescript !== true && pkg.pob.envs) ||
        pkg.pob.bundler === "rollup-babel",
    );
    const withTypescript = withBabel || pkg.pob.typescript === true;

    packageUtils.removeDevDependencies(pkg, ["lerna", "@pob/lerna-light"]);
    if (inMonorepo) {
      if (pkg.scripts) {
        if (pkg.name !== "pob-dependencies") {
          delete pkg.scripts.preversion;
        }
        delete pkg.scripts.release;
        delete pkg.scripts.version;
      }
    }

    if (!withBabel && !withTypescript) {
      if (
        !this.fs.exists(this.destinationPath("lib/index.js")) &&
        this.fs.exists(this.destinationPath("index.js"))
      ) {
        this.fs.move(
          this.destinationPath("index.js"),
          this.destinationPath("lib/index.js"),
        );
      }
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
    [
      "lib-node14",
      "lib-node16",
      "coverage",
      this.pobjson.documentation && "docs",
      !(withBabel || withTypescript) && "dist",
    ]
      .filter(Boolean)
      .forEach((path) => {
        rmSync(path, { recursive: true, force: true });
      });

    const { pobjson } = this;

    this.config.set("lib", pobjson);
    this.config.save();

    this.composeWith({
      Generator: CoreSortPackageGenerator,
      path: CoreSortPackageGenerator.path,
    });
  }
}
