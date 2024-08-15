import { execSync } from "node:child_process";
import { platform } from "node:process";
import Generator from "yeoman-generator";
import inMonorepo from "../../utils/inMonorepo.js";
import * as packageUtils from "../../utils/package.js";
import { appIgnorePaths } from "./ignorePaths.js";

const appsWithTypescript = [
  "alp",
  "next.js",
  "remix",
  "pobpack",
  "expo",
  "yarn-plugin",
];
const appsWithBrowser = ["alp", "next.js", "remix"];

export default class PobAppGenerator extends Generator {
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
    this.appConfig =
      this.config.get("app") || this.config.get("pob-app-config");

    this.config.delete("pob-app-config"); // deprecated

    // see lib, in case the app migrating from a lib when app were not available
    this.config.delete("pob"); // deprecated
    this.config.delete("pob-config"); // deprecated
    this.fs.delete(".pob.json"); // deprecated
    this.config.delete("pob-lib-config"); // in case coming from lib
  }

  async prompting() {
    const config = this.appConfig;

    if (config && this.options.updateOnly) {
      this.config.set("app", this.appConfig);
      this.config.save();
      return;
    }

    this.appConfig = await this.prompt([
      {
        type: "list",
        name: "type",
        message: "What kind of app is this ?",
        default: (config && config.type) || "alp",
        choices: [
          "alp",
          "pobpack",
          "next.js",
          "remix",
          "node",
          "node-library", // monorepo library for app. Not a real library
          "untranspiled-library", // monorepo library for app. Not a real library
          "alp-node",
          "expo",
          "other",
        ],
      },
      {
        type: "confirm",
        name: "export",
        message: "Use next export ?",
        default: false,
        when: (values) => values.type === "next.js",
      },
      {
        type: "confirm",
        name: "testing",
        message: "Do you want testing ?",
        default:
          !config || config.testing === undefined ? false : config.testing,
      },
      {
        type: "confirm",
        name: "codecov",
        message: "Do you want codecov ?",
        default: !config || false,
        when: (values) => values.testing,
      },
      {
        type: "confirm",
        name: "ci",
        message: "Do you want ci ?",
        default: !config || config.ci === undefined ? true : config.ci,
        when: () => !inMonorepo,
      },
    ]);

    this.config.set("app", this.appConfig);
    this.config.save();
  }

  default() {
    const srcDirectory =
      this.appConfig.type === "yarn-plugin" ? "sources" : "src";
    const isAppLibrary =
      this.appConfig.type === "node-library" ||
      this.appConfig.type === "untranspiled-library";

    if (
      this.appConfig.type === "node" ||
      this.appConfig.type === "node-library" ||
      this.appConfig.type === "alp-node"
    ) {
      this.composeWith("pob:common:babel", {
        updateOnly: this.options.updateOnly,
        onlyLatestLTS: true,
        isApp: true,
        isAppLibrary,
        useAppConfig: this.appConfig.type === "alp-node",
        testing: this.appConfig.testing,
        documentation: false,
        fromPob: this.options.fromPob,
        buildDirectory: "build",
      });
      this.composeWith("pob:common:transpiler", {
        updateOnly: this.options.updateOnly,
        onlyLatestLTS: true,
        isApp: true,
        isAppLibrary,
        useAppConfig: this.appConfig.type === "alp-node",
        testing: this.appConfig.testing,
        documentation: false,
        fromPob: this.options.fromPob,
        srcDirectory,
        buildDirectory: "build",
      });
    }

    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (!inMonorepo || inMonorepo.root) {
      this.composeWith("pob:common:husky", {});
    }

    const envs = (pkg.pob && (pkg.pob.babelEnvs || pkg.pob.envs)) || [];
    const babel =
      envs.length > 0 || appsWithTypescript.includes(this.appConfig.type);
    const typescript = babel || pkg.pob?.typescript;
    const node = true;
    const browser =
      appsWithBrowser.includes(this.appConfig.type) ||
      (babel && envs.some((env) => env.target === "browser"));
    const jsx =
      envs.length > 0 && pkg.pob.jsx !== undefined
        ? pkg.pob.jsx
        : packageUtils.hasReact(pkg);

    if (!appIgnorePaths[this.appConfig.type]) {
      throw new Error(`Unknown app type: ${this.appConfig.type}`);
    }

    const ignorePaths = appIgnorePaths[this.appConfig.type](
      this.appConfig,
      pkg,
    ).filter(Boolean);

    this.composeWith("pob:common:typescript", {
      enable:
        typescript ||
        pkg.pob?.typescript === "check-only" ||
        (inMonorepo &&
          inMonorepo.pobMonorepoConfig?.typescript === "check-only"),
      onlyCheck:
        pkg.pob?.typescript === "check-only" ||
        (inMonorepo &&
          inMonorepo.pobMonorepoConfig?.typescript === "check-only"),
      isApp: true,
      isAppLibrary,
      nextConfig: this.appConfig.type === "next.js",
      // nextjs now supports src
      rootDir: this.appConfig.type === "expo" ? "." : srcDirectory,
      srcDirectory,
      builddefs: false,
      dom: browser,
      jsx,
      jsxPreserve: this.appConfig.type === "next.js",
      forceExcludeNodeModules: this.appConfig.type === "next.js",
      forceAllowJs: this.appConfig.type === "next.js",
      updateOnly: this.options.updateOnly,
      resolveJsonModule: true,
      onlyLatestLTS: true,
      baseUrl: (() => {
        if (
          this.appConfig.type === "alp" ||
          this.appConfig.type === "pobpack" ||
          this.appConfig.type === "alp-node" ||
          this.appConfig.type === "next.js"
        ) {
          return `./${srcDirectory}`;
        }
        if (this.appConfig.type === "remix") {
          return ".";
        }
        return "";
      })(),
      plugins: (() => {
        if (this.appConfig.type === "next.js") {
          return "next";
        }
        return "";
      })(),
      additionalIncludes: (() => {
        // if (this.appConfig.type === 'next.js') {
        //   return '.next/types/**/*.ts';
        // }
        return "";
      })(),
    });

    this.composeWith("pob:common:remove-old-dependencies");

    const enableReleasePlease =
      !inMonorepo && this.appConfig.testing && this.appConfig.ci;

    if (this.appConfig.type !== "remix") {
      this.composeWith("pob:common:testing", {
        enable: this.appConfig.testing,
        disableYarnGitCache: this.options.disableYarnGitCache,
        enableReleasePlease,
        testing: this.appConfig.testing,
        runner: this.appConfig.testing
          ? (inMonorepo
              ? inMonorepo.pobMonorepoConfig.testRunner
              : this.appConfig.testRunner) || "jest"
          : undefined,
        e2eTesting: this.appConfig.e2e ? "." : "",
        typescript,
        build: typescript === true && this.appConfig.type !== "expo",
        documentation: false,
        codecov: this.appConfig.codecov,
        ci: this.appConfig.ci,
        packageManager: this.options.packageManager,
        isApp: true,
        splitCIJobs: false,
        onlyLatestLTS: true,
        srcDirectory,
      });

      this.composeWith("pob:app:e2e-testing", {
        enable: this.appConfig.e2e,
      });

      this.composeWith("pob:common:format-lint", {
        isApp: true,
        documentation: false,
        testing: this.appConfig.testing,
        testRunner: this.appConfig.testRunner,
        babel,
        typescript,
        build: typescript === true,
        node,
        browser,
        // nextjs now supports src rootAsSrc: this.appConfig.type === 'next.js',
        enableSrcResolver: true,
        packageManager: this.options.packageManager,
        yarnNodeLinker: this.options.yarnNodeLinker,
        rootIgnorePaths: ignorePaths.join("\n"),
        srcDirectory,
        buildDirectory: this.appConfig.type === "expo" ? ".expo" : "build",
      });

      this.composeWith("pob:common:release", {
        enable:
          !inMonorepo &&
          this.appConfig.testing &&
          pkg.name !== "yarn-plugin-conventional-version",
        enablePublish: false,
        withBabel: babel,
        isMonorepo: false,
        enableYarnVersion: true,
        ci: this.appConfig.ci,
        disableYarnGitCache: this.options.disableYarnGitCache,
        updateOnly: this.options.updateOnly,
      });
    }

    this.composeWith("pob:core:vscode", {
      root: !inMonorepo,
      monorepo: false,
      packageManager: this.options.packageManager,
      yarnNodeLinker: this.options.yarnNodeLinker,
      typescript,
      testing: this.appConfig.testing,
      testRunner: this.appConfig.testRunner,
    });

    // only for gitignore
    if (this.fs.exists(".env.example")) {
      ignorePaths.push("/.env*", "!/.env.example");
    }

    this.composeWith("pob:core:gitignore", {
      root: !inMonorepo || inMonorepo.root,
      documentation: false,
      testing: this.appConfig.testing,
      withBabel: babel,
      paths: ignorePaths.join("\n"),
      buildInGit: false,
    });

    this.composeWith("pob:core:npm", { enable: false });

    switch (this.appConfig.type) {
      case "next.js":
        this.composeWith("pob:app:nextjs", {
          export: this.appConfig.export,
        });
        break;
      case "remix":
        this.composeWith("pob:app:remix", {});
        break;
      // no default
    }

    if (platform !== "win32") {
      execSync(
        `rm -Rf ${["lib-*", "coverage", "docs", "dist"]
          .filter(Boolean)
          .join(" ")}`,
      );
    }
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    // if (isNpm) {
    //   if (!pkg.engines) pkg.engines = {};
    //   pkg.engines.yarn = '< 0.0.0';
    // } else
    if (pkg.engines) {
      delete pkg.engines.yarn;
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);

    this.composeWith("pob:core:sort-package");
  }
}
