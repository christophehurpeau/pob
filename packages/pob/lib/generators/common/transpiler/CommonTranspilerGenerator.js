import fs from "node:fs";
import semver from "semver";
import Generator from "yeoman-generator";
import { latestLTS, maintenanceLTS } from "../../../utils/node.js";
import * as packageUtils from "../../../utils/package.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

export default class CommonTranspilerGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("updateOnly", {
      type: Boolean,
      required: false,
      default: false,
      description: "Avoid asking questions",
    });

    this.option("testing", {
      type: Boolean,
      required: false,
      default: false,
      description: "Has testing.",
    });

    this.option("fromPob", {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option("isApp", {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option("isAppLibrary", {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option("useAppConfig", {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option("srcDirectory", {
      type: String,
      required: false,
      default: "src",
    });

    this.option("buildDirectory", {
      type: String,
      required: false,
      default: "dist",
    });

    this.option("onlyLatestLTS", {
      type: Boolean,
      required: false,
      default: false,
      description: "only latest lts",
    });
  }

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    let pobConfig = pkg.pob;

    const hasInitialPkgPob = !!pkg.pob;
    if (!hasInitialPkgPob) pkg.pob = {};

    const babelEnvs = pkg.pob.babelEnvs || [];

    if (babelEnvs) {
      // skip as it is using babel with rollup
      return;
    }

    if (!hasInitialPkgPob || !this.options.updateOnly) {
      pobConfig = await this.prompt([
        {
          type: "confirm",
          name: "typescript",
          message: "Enable Typescript ?",
          default: false,
        },
        {
          type: "confirm",
          name: "rollup",
          message: "Enable Rollup ?",
          default: true,
          when: ({ typescript }) => !!typescript,
        },
        {
          type: "confirm",
          name: "jsx",
          message: "Enable JSX ?",
          when: ({ typescript }) => !!typescript,
        },
      ]);
    }

    if (!pobConfig.typescript) {
      delete pkg.pob.entries;
      delete pkg.pob.jsx;
    } else if (pkg.pob.jsx === false) {
      delete pkg.pob.jsx;
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  configuring() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    this.entries = pkg.pob.entries;
    this.babelEnvs = pkg.pob.babelEnvs || [];

    if (
      this.babelEnvs.length > 0 ||
      pkg.pob.typescript === true ||
      pkg.pob.bundler
    ) {
      fs.mkdirSync(this.destinationPath("src"), { recursive: true });
    } else {
      // recursive does not throw if directory already exists
      fs.mkdirSync(this.destinationPath("lib"), { recursive: true });
    }
  }

  default() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    const withBabel = this.babelEnvs && this.babelEnvs.length > 0;
    const withTypescript = pkg.pob.typescript || withBabel || !!pkg.pob.bundler;
    const bundler =
      withTypescript &&
      pkg.pob?.typescript !== "check-only" &&
      (pkg.pob.rollup === false ||
      pkg.pob.bundler === "tsc" ||
      (!pkg.pob.bundler && !pkg.pob.typescript === true)
        ? "tsc"
        : (pkg.pob.bundler ??
          (pkg.pob.typescript === true
            ? "rollup-typescript"
            : "rollup-babel")));
    this.bundler = bundler;

    const cleanCommand = (() => {
      if (bundler === "rollup-typescript") return "pob-typescript-clean-out";
      if (bundler === "rollup-esbuild") return "pob-esbuild-clean-out";
      if (bundler === "rollup-babel") return "pob-babel-clean-out";
      if (bundler === "esbuild") return "pob-esbuild-clean-out";
      if (bundler === "tsc") return "rm -Rf";
      if (bundler) throw new Error(`Invalid bundler: ${bundler}`);
    })();

    /* scripts */

    if (this.options.isApp) {
      packageUtils.removeScripts(["watch"]);
      packageUtils.addOrRemoveScripts(pkg, bundler && bundler !== "tsc", {
        "clean:build": `${cleanCommand} ${this.options.buildDirectory}`,
        clean: "yarn clean:build",
      });

      packageUtils.addOrRemoveScripts(pkg, bundler, {
        start: (() => {
          if (bundler && bundler.startsWith("rollup")) {
            return "yarn clean:build && rollup --config rollup.config.mjs --watch";
          }
          if (bundler === "tsc") return "tsc --watch";
          if (bundler === "esbuild") return "pob-esbuild-watch";
        })(),
      });
    } else {
      packageUtils.removeScripts(["start"]);
      packageUtils.addOrRemoveScripts(pkg, bundler && bundler !== "tsc", {
        "clean:build": `${cleanCommand} ${this.options.buildDirectory}`,
      });
    }

    packageUtils.addOrRemoveScripts(pkg, bundler, {
      build: (() => {
        if (bundler && bundler.startsWith("rollup")) {
          return "yarn clean:build && rollup --config rollup.config.mjs";
        }
        if (bundler === "tsc") return "tsc";
        if (bundler === "esbuild") return "pob-esbuild-build";
      })(),
    });

    const shouldBuildDefinitions =
      !this.options.isApp && withTypescript && bundler !== "tsc";

    packageUtils.addOrRemoveScripts(pkg, shouldBuildDefinitions, {
      "build:definitions": "tsc -p tsconfig.json",
    });

    if (shouldBuildDefinitions) {
      if (pkg.scripts.build) {
        pkg.scripts.build += " && yarn run build:definitions";
      } else {
        pkg.scripts.build = "yarn run build:definitions";
      }
    } else if (!this.options.isApp && !bundler && !withTypescript) {
      // check definitions, but also force lerna to execute build:definitions in right order
      // example: nightingale-types depends on nightingale-levels
      if (this.fs.exists(this.destinationPath("lib/index.d.ts"))) {
        packageUtils.addScripts(pkg, {
          "build:definitions":
            "tsc --lib esnext --noEmit --skipLibCheck ./lib/index.d.ts",
          build: "yarn run build:definitions",
        });
      }

      if (this.fs.exists(this.destinationPath("lib/index.ts"))) {
        packageUtils.addScripts(pkg, {
          "build:definitions":
            "tsc --lib esnext --noEmit --skipLibCheck ./lib/index.ts",
          build: "yarn run build:definitions",
        });
      }
    }

    if (pkg.scripts) {
      delete pkg.scripts.postbuild;
      delete pkg.scripts["build:dev"];
      delete pkg.scripts["watch:dev"];
    }

    /* dependencies */

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      bundler === "rollup-typescript",
      ["@pob/rollup-typescript"],
    );
    packageUtils.addOrRemoveDevDependencies(
      pkg,
      bundler === "esbuild" &&
        withTypescript &&
        pkg.pob?.typescript !== "check-only",
      ["@pob/esbuild"],
    );
    packageUtils.addOrRemoveDevDependencies(
      pkg,
      bundler === "rollup-esbuild" &&
        withTypescript &&
        pkg.pob?.typescript !== "check-only",
      ["@pob/rollup-esbuild"],
    );
    packageUtils.addOrRemoveDependencies(
      pkg,
      (bundler === "tsc" || bundler === "rollup-typescript") &&
        withTypescript &&
        pkg.pob?.typescript !== "check-only",
      ["tslib"],
      "^",
    );

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      bundler === "rollup-babel" &&
        this.options.isApp &&
        !this.options.isAppLibrary &&
        this.options.useAppConfig,
      ["alp-rollup-plugin-config"],
    );

    /* engines */
    // TODO move from CommonBabelGenerator

    /* side effects */

    if (this.options.isApp && !this.options.isAppLibrary) {
      delete pkg.sideEffects;
    } else if (!("sideEffects" in pkg)) {
      pkg.sideEffects = true;
      console.warn("Setting pkg.sideEffects to true, as it was not defined");
    } else if (pkg.sideEffects) {
      console.warn(
        "pkg.sideEffects is true, are you sure you can't set it to false ?",
      );
    }

    /* main / aliases / typing */

    if (this.options.isApp && !this.options.isAppLibrary) {
      delete pkg.types;
      delete pkg.typings;
    } else if (pkg.typings) {
      if (!pkg.types) pkg.types = pkg.typings;
      delete pkg.typings;
    }

    // if (!pkg.main || pkg.main.startsWith('./lib/')) {
    if (bundler || (withTypescript && pkg.pob?.typescript !== "check-only")) {
      // see pkg.exports instead.
      delete pkg.main;
      if (!this.options.isApp) {
        pkg.types = `./${this.options.buildDirectory}/${"definitions/"}index.d.ts`;
      } else if (this.options.isAppLibrary) {
        pkg.types = `./${this.options.srcDirectory}/index.ts`;
      }
    } else {
      if (!pkg.main && !pkg.pob.entries) {
        pkg.exports = "./lib/index.js";
      }
      if (pkg.type === "module" && this.fs.exists("./lib/index.cjs")) {
        pkg.main = "./lib/index.cjs";
      } else if (!pkg.pob?.entries || pkg.pob.entries.includes("index")) {
        pkg.main = "./lib/index.js";
      }
      if (!this.options.isApp || this.options.isAppLibrary) {
        if (this.fs.exists("./lib/index.ts")) {
          pkg.types = "./lib/index.ts";
        } else if (this.fs.exists("./lib/index.d.ts") || pkg.types) {
          pkg.types = "./lib/index.d.ts";
        }
      }
    }

    delete pkg["browser-dev"];
    delete pkg["module-dev"];

    const envs = pkg.pob.babelEnvs ||
      pkg.pob.envs || [
        {
          target: "node",
          version: "18",
        },
      ];

    const esAllBrowserEnv = envs.find(
      (env) =>
        env.target === "browser" &&
        env.version === undefined &&
        (!env.formats || env.formats.includes("es")),
    );

    // Legacy "dev" builds
    delete pkg["module:browser"];
    delete pkg["module:browser-dev"];
    delete pkg["module:modern-browsers"];
    delete pkg["module:modern-browsers-dev"];
    delete pkg["module:node"];
    delete pkg["module:node-dev"];

    /* webpack 4 */
    if (esAllBrowserEnv) {
      pkg.module = `./${this.options.buildDirectory}/index-browser.es.js`;
      pkg.browser = `./${this.options.buildDirectory}/index-browser.es.js`;
    } else {
      delete pkg.module;
      delete pkg.browser;
    }

    /* webpack 5 and node with ESM support */
    if (bundler || (withTypescript && pkg.pob?.typescript !== "check-only")) {
      const omitTarget = bundler === "esbuild" || bundler === "tsc";
      pkg.exports = {
        "./package.json": "./package.json",
      };

      this.entries.forEach((entryWithOptionalExt) => {
        const entry = entryWithOptionalExt.replace(/\.[jt]sx?$/, "");
        const isBrowserOnly =
          withBabel &&
          entry === "browser" &&
          (envs?.every((env) => env.target === "browser") ||
            (this.entries.length === 2 && this.entries.includes("index")));
        const entryDistName = isBrowserOnly ? "index" : entry;
        const exportName = entry === "index" ? "." : `./${entry}`;

        const targets = {
          types:
            pkg.private || this.options.isAppLibrary
              ? `./src/${entryDistName}.ts`
              : `./${this.options.buildDirectory}/definitions/${entryDistName}.d.ts`,
        };

        const defaultNodeEnv =
          withBabel || (withTypescript && pkg.pob?.typescript !== "check-only")
            ? envs.find((env) => env.target === "node")
            : undefined;

        const defaultNodeEnvVersion = defaultNodeEnv && defaultNodeEnv.version;

        envs.forEach(
          ({
            target,
            version,
            formats,
            omitVersionInFileName = bundler === "tsc",
          }) => {
            if (target === "node" && entry === "browser") return;

            const exportTarget = {};

            switch (target) {
              case "node": {
                const cjsExt = pkg.type === "module" ? "cjs" : "cjs.js";
                const filenameWithoutExt = `${entryDistName}${
                  omitTarget
                    ? ""
                    : `-${target}${omitVersionInFileName ? "" : version}`
                }`;
                if (bundler === "tsc") {
                  if (formats) {
                    throw new Error("tsc does not support formats");
                  }
                  exportTarget.import = `./${this.options.buildDirectory}/${filenameWithoutExt}.js`;
                } else if (!formats || formats.includes("es")) {
                  exportTarget.import = `./${this.options.buildDirectory}/${filenameWithoutExt}.mjs`;

                  if (formats && formats.includes("cjs")) {
                    exportTarget.require = `./${this.options.buildDirectory}/${filenameWithoutExt}.${cjsExt}`;
                  }
                } else if (formats && formats.includes("cjs")) {
                  exportTarget.default = `./${this.options.buildDirectory}/${filenameWithoutExt}.${cjsExt}`;
                }
                // eslint: https://github.com/benmosher/eslint-plugin-import/issues/2132
                // jest: https://github.com/facebook/jest/issues/9771
                if (!pkg.main && exportName === ".") {
                  pkg.main =
                    pkg.type === "module"
                      ? exportTarget.import
                      : exportTarget.default ||
                        exportTarget.require ||
                        exportTarget.import;
                }

                break;
              }
              case "browser": {
                if (!formats || formats.includes("es")) {
                  exportTarget.import = `./${
                    this.options.buildDirectory
                  }/${entryDistName}-${target}${version || ""}.es.js`;
                }

                if (formats && formats.includes("cjs")) {
                  exportTarget.require = `./${
                    this.options.buildDirectory
                  }/${entryDistName}-${target}${version || ""}.cjs.js`;
                }

                break;
              }
              case "react-native": {
                if (!formats || formats.includes("es")) {
                  exportTarget.import = `./${
                    this.options.buildDirectory
                  }/${entryDistName}-${target}.es.js`;
                }

                if (formats && formats.includes("cjs")) {
                  exportTarget.require = `./${
                    this.options.buildDirectory
                  }/${entryDistName}-${target}.cjs.js`;
                }

                break;
              }
              default: {
                throw new Error(`Invalid target: ${target}`);
              }
            }

            if (
              !version ||
              (target === "node" && version === defaultNodeEnvVersion)
            ) {
              targets[target] = {
                ...targets[target],
                ...exportTarget,
              };
            } else {
              targets[target] = {
                [`${target}:${version}`]: exportTarget,
                ...targets[target],
              };
            }
          },
        );

        pkg.exports[exportName] = targets;
      });

      if (pkg.pob.extraEntries) {
        pkg.pob.extraEntries.forEach((extraEntryConfig) => {
          if (typeof extraEntryConfig === "string") {
            extraEntryConfig = {
              name: extraEntryConfig,
            };
          }

          const calcExport = () => {
            if (pkg.type === "module") {
              return extraEntryConfig.name.endsWith(".cjs") ||
                extraEntryConfig.name.endsWith(".d.ts")
                ? `./${extraEntryConfig.name}`
                : `./${extraEntryConfig.name}.js`;
            }

            return {
              import: `./${extraEntryConfig.name}.mjs`,
              require: `./${extraEntryConfig.name}.js`,
            };
          };

          let exportValue = calcExport();

          if (extraEntryConfig.types) {
            if (typeof exportValue === "string") {
              exportValue = {
                types: `./${extraEntryConfig.types}`,
                default: exportValue,
              };
            } else {
              exportValue = {
                types: `./${extraEntryConfig.types}`,
                ...exportValue,
              };
            }
          }

          pkg.exports[`./${extraEntryConfig.name}`] = exportValue;
        });
      }
    } else if (!pkg.exports) {
      console.error("Please setup your package.exports manually.");
    } else {
      if (typeof pkg.exports === "string") {
        pkg.exports = {
          ".": pkg.exports,
        };
      }
      if (!pkg.exports["./package.json"]) {
        pkg.exports["./package.json"] = "./package.json";
      }

      if (pkg.types && !pkg.exports["."].types) {
        if (typeof pkg.exports["."] === "string") {
          pkg.exports["."] = {
            default: pkg.exports["."],
          };
        }
        pkg.exports["."] = { types: pkg.types, ...pkg.exports["."] };
      }
    }

    Object.keys(pkg).forEach((key) => {
      if (!key.startsWith("module:") && !key.startsWith("webpack:")) return;
      delete pkg[key];
    });

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    const entries = pkg.pob.entries || ["index"];
    let envs = pkg.pob.envs || pkg.pob.babelEnvs;
    delete pkg.pob.withReact;

    if (envs) {
      if (
        !envs.some(
          (env) =>
            env.target === "node" &&
            String(env.version) ===
              (this.options.onlyLatestLTS
                ? `${latestLTS}`
                : `${maintenanceLTS}`),
        ) &&
        envs.some(
          (env) =>
            env.target === "node" &&
            (["8", "6", "10", "12", "14", "16", "18"].includes(
              String(env.version),
            ) ||
              (this.options.onlyLatestLTS &&
                String(env.version) === `${maintenanceLTS}`)),
        )
      ) {
        envs.unshift({
          target: "node",
          version: this.options.onlyLatestLTS
            ? `${latestLTS}`
            : `${maintenanceLTS}`,
          omitVersionInFileName: this.options.onlyLatestLTS ? true : undefined,
        });
      }
      envs = envs.filter(
        (env) =>
          env.target !== "node" ||
          env.version >=
            (this.options.onlyLatestLTS ? latestLTS : maintenanceLTS),
      );

      if (pkg.pob.babelEnvs) {
        pkg.pob.babelEnvs = envs;
      } else {
        pkg.pob.envs = envs;
      }
    }

    const hasTargetNode = envs && envs.some((env) => env.target === "node");

    if (!pkg.engines) pkg.engines = {};

    if (hasTargetNode || !envs) {
      const minNodeVersion = envs
        ? Math.min(
            ...envs
              .filter((env) => env.target === "node")
              .map((env) => env.version),
          )
        : (() =>
            this.options.onlyLatestLTS
              ? `${latestLTS}`
              : `${maintenanceLTS}`)();

      switch (String(minNodeVersion)) {
        case "10":
        case "12":
        case "14":
        case "16":
        case "18":
        case "20":
          if (
            envs ||
            !pkg.engines.node ||
            !pkg.engines.node.startsWith(">=22")
          ) {
            pkg.engines.node = ">=20.11.0";
          }
          break;
        case "22":
          pkg.engines.node = ">=22.14.0";
          break;
        default:
          throw new Error(`Invalid min node version: ${minNodeVersion}`);
      }

      if (pkg.dependencies && pkg.dependencies["@types/node"]) {
        pkg.dependencies["@types/node"] = `>=${minNodeVersion}.0.0`;
      }
      if (
        pkg.devDependencies &&
        pkg.devDependencies["@types/node"] &&
        !semver.satisfies(
          pkg.devDependencies["@types/node"],
          `>=${minNodeVersion}.0.0`,
        )
      ) {
        pkg.devDependencies["@types/node"] = `>=${minNodeVersion}.0.0`;
      }
    } else {
      packageUtils.removeDependencies(pkg, ["@types/node"]);
      packageUtils.removeDevDependencies(pkg, ["@types/node"]);

      // Supports oldest current or active LTS version of node
      const minVersion = this.options.onlyLatestLTS ? "22.14.0" : "20.11.0";

      if (
        !pkg.engines.node ||
        semver.lt(semver.minVersion(pkg.engines.node), minVersion)
      ) {
        pkg.engines.node = `>=${minVersion}`;
      }
    }

    this.fs.delete("rollup.config.js");
    if (
      pkg.pob.typescript === true &&
      pkg.pob.rollup !== false &&
      ((!pkg.pob.bundler && pkg.pob.typescript !== true) ||
        pkg.pob.bundler?.startsWith("rollup"))
    ) {
      if (this.options.isApp) {
        copyAndFormatTpl(
          this.fs,
          this.templatePath("app.rollup.config.mjs.ejs"),
          this.destinationPath("rollup.config.mjs"),
          {
            rollupConfigLib: this.bundler,
            config: this.options.useAppConfig,
            outDirectory: this.options.buildDirectory,
            enableRun: !this.options.isAppLibrary && entries.includes("index"),
          },
        );
      } else {
        copyAndFormatTpl(
          this.fs,
          this.templatePath("lib.rollup.config.mjs.ejs"),
          this.destinationPath("rollup.config.mjs"),
          {
            rollupConfigLib: this.bundler,
            outDirectory: this.options.buildDirectory,
          },
        );
      }
    } else if (
      !envs ||
      envs.length === 0 ||
      pkg.pob?.bundler === "esbuild" ||
      pkg.pob?.bundler === "tsc"
    ) {
      this.fs.delete("rollup.config.mjs");
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
