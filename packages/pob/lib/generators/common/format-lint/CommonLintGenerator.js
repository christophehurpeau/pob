import path from "node:path";
import Generator from "yeoman-generator";
import inMonorepo from "../../../utils/inMonorepo.js";
import * as packageUtils from "../../../utils/package.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";
import { appIgnorePaths } from "../../app/ignorePaths.js";

export default class CommonFormatLintGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("monorepo", {
      type: Boolean,
      required: false,
      default: false,
      description: "Is root monorepo",
    });

    this.option("isApp", {
      type: Boolean,
      required: false,
      default: false,
      description: "Is app",
    });

    this.option("babel", {
      type: String,
      required: false,
      default: "undefined",
      description: "Use babel.",
    });

    this.option("documentation", {
      type: Boolean,
      required: false,
      default: false,
      description: "Documentation enabled",
    });

    this.option("testing", {
      type: Boolean,
      required: true,
      description: "Testing enabled",
    });
    this.option("testRunner", {
      type: String,
      required: false,
      default: "jest",
      description: "test runner: jest | node",
    });

    this.option("typescript", {
      type: Boolean,
      required: false,
      default: false,
      description: "Typescript enabled",
    });

    this.option("build", {
      type: Boolean,
      required: false,
      description: "Build",
    });

    this.option("enableSrcResolver", {
      type: Boolean,
      required: false,
      default: false,
      description: "Enable resolving from src directory",
    });

    this.option("storybook", {
      type: Boolean,
      required: false,
      default: false,
      description: "Enable storybook",
    });

    this.option("rootAsSrc", {
      type: Boolean,
      required: false,
      default: false,
      description: "src directory is root",
    });

    this.option("appTypes", {
      type: String,
      required: false,
      description: "list of app types",
    });

    this.option("rootIgnorePaths", {
      type: String,
      required: false,
      default: "",
      description: "list of ignore paths to add",
    });

    this.option("ignorePaths", {
      type: String,
      required: false,
      default: "",
      description: "list of ignore paths to add",
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

    this.option("srcDirectory", {
      type: String,
      default: "src",
      description: "customize src directory. Default to src",
    });

    this.option("buildDirectory", {
      type: String,
      required: false,
      default: "dist",
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    const babelEnvs =
      (pkg.pob &&
        (pkg.pob.babelEnvs ||
          (pkg.pob.bundler === "rollup-babel" && pkg.pob.envs))) ||
      [];
    // const typescriptTargets = (pkg.pob && pkg.pob.typescriptTargets) || [];
    const useBabel =
      this.options.babel !== "undefined"
        ? this.options.babel === "true"
        : babelEnvs.length > 0;
    const useTypescript = this.options.typescript;
    const hasReact = useTypescript && packageUtils.hasReact(pkg);
    const useNode = !useBabel || babelEnvs.some((env) => env.target === "node");
    const useNodeOnly =
      (!useBabel && !useTypescript) ||
      (useTypescript &&
        (!pkg.pob?.envs ||
          pkg.pob?.envs?.every((env) => env.target === "node")) &&
        (!pkg.pob?.entries ||
          pkg.pob?.entries.every(
            (entry) =>
              typeof entry === "string" ||
              (entry.target && entry.target !== "node"),
          ))) ||
      (babelEnvs.length > 0 && babelEnvs.every((env) => env.target === "node"));

    if (this.fs.exists(this.destinationPath(".eslintignore"))) {
      this.fs.delete(this.destinationPath(".eslintignore"));
    }

    if (pkg.scripts) {
      delete pkg.scripts.postmerge;
      delete pkg.scripts.postcheckout;
      delete pkg.scripts.postrewrite;
      delete pkg.scripts.precommit;
      delete pkg.scripts.commitmsg;
      delete pkg.scripts.preparecommitmsg;
      delete pkg.scripts.prepublish;
      delete pkg.scripts.postpublish;
      delete pkg.scripts.prepare;
    }

    delete pkg.standard;

    pkg.prettier = "@pob/root/prettier-config";

    if (!inMonorepo || inMonorepo.root || this.options.monorepo) {
      const rootIgnorePatterns = new Set(
        this.options.rootIgnorePaths.split("\n").filter(Boolean),
      );
      const ignorePatterns = new Set(
        this.options.ignorePaths.split("\n").filter(Boolean),
      );

      if (this.options.appTypes) {
        const appTypes = JSON.parse(this.options.appTypes);
        appTypes.forEach((appType) => {
          appIgnorePaths[appType]({})
            .filter(Boolean)
            .forEach((ignorePath) => {
              if (ignorePath.startsWith("#")) return;
              ignorePatterns.add(ignorePath);
            });
        });
      }

      this.fs.copyTpl(
        this.templatePath("prettierignore.ejs"),
        this.destinationPath(".prettierignore"),
        {
          inRoot: !inMonorepo || inMonorepo.root || this.options.monorepo,
          documentation: this.options.documentation,
          packageManager: this.options.packageManager,
          yarnNodeLinker: this.options.yarnNodeLinker,
          workspaces: pkg.workspaces,
          hasApp: this.options.hasApp,
          rootIgnorePatterns: [...rootIgnorePatterns],
          ignorePatterns: [...ignorePatterns],
          storybook: this.options.storybook,
        },
      );
    } else if (this.fs.exists(this.destinationPath(".prettierignore"))) {
      this.fs.delete(this.destinationPath(".prettierignore"));
    }

    if (pkg.devDependencies) {
      if (pkg.devDependencies["@pob/eslint-config-babel"]) {
        packageUtils.addDevDependencies(pkg, ["@pob/eslint-config-typescript"]);
      }
    }

    packageUtils.removeDevDependencies(pkg, [
      "@pob/eslint-config-babel",
      "@pob/eslint-config-babel-node",
      "@pob/eslint-config-node",
      "@pob/eslint-config-typescript-node",
      "babel-eslint",
      "eslint-config-pob",
      "typescript-eslint-parser",
      "standard",
      "eslint-import-resolver-node",
    ]);

    if (!pkg.name.startsWith("@pob/eslint-config")) {
      packageUtils.removeDevDependencies(pkg, [
        "eslint-plugin-jsx-a11y",
        "eslint-config-airbnb",
        "eslint-config-airbnb-base",
        "eslint-config-prettier",
        "eslint-plugin-babel",
        "eslint-plugin-flowtype",
        "eslint-plugin-prefer-class-properties",
        "eslint-plugin-prettier",
        "eslint-plugin-react",
        "eslint-plugin-react-hooks",
      ]);
    }

    const yoConfigPobMonorepo = inMonorepo && inMonorepo.pobMonorepoConfig;
    const globalEslint =
      this.options.monorepo ||
      (yoConfigPobMonorepo && yoConfigPobMonorepo.eslint !== false);
    const composite = yoConfigPobMonorepo && yoConfigPobMonorepo.typescript;
    const { rootPackageManager, rootYarnNodeLinker } = inMonorepo || {};
    const lernaProjectType =
      inMonorepo.pobConfig &&
      inMonorepo.pobConfig.project &&
      inMonorepo.pobConfig.project.type;

    if (this.options.monorepo && !globalEslint) {
      throw new Error("Please enable global eslint");
    }

    if (
      globalEslint &&
      !((inMonorepo && inMonorepo.root) || this.options.monorepo)
    ) {
      if (
        !pkg.name.startsWith("@pob/eslint-config") &&
        !pkg.name.startsWith("@pob/eslint-plugin")
      ) {
        packageUtils.removeDevDependencies(
          pkg,
          [
            "eslint",
            "prettier",
            "@pob/eslint-config",
            "@pob/eslint-config-typescript",
            "@pob/eslint-config-typescript-react",
            "@pob/eslint-config-react",
            "@typescript-eslint/eslint-plugin",
            "@typescript-eslint/parser",
            "eslint-plugin-node",
            "eslint-plugin-unicorn",
            "eslint-plugin-import",
          ],
          true,
        );
      }
    } else {
      if (pkg.name !== "pob-monorepo") {
        packageUtils.removeDevDependencies(pkg, ["prettier"]);
      }
      packageUtils.addOrRemoveDevDependencies(
        pkg,
        !globalEslint ||
          (inMonorepo && inMonorepo.root) ||
          this.options.monorepo ||
          lernaProjectType === "app" ||
          (rootPackageManager === "yarn" &&
            rootYarnNodeLinker !== "node-modules") ||
          !!(pkg.peerDependencies && pkg.peerDependencies.eslint),
        ["eslint"],
      );
      const shouldHavePluginsDependencies =
        rootPackageManager === "yarn" && rootYarnNodeLinker !== "node-modules";

      if (
        !pkg.name.startsWith("eslint-config") &&
        !pkg.name.startsWith("@pob/eslint-config") &&
        pkg.name !== "@pob/use-eslint-plugin"
      ) {
        packageUtils.addDevDependencies(pkg, ["@pob/eslint-config"]);
        packageUtils.addOrRemoveDevDependencies(
          pkg,
          shouldHavePluginsDependencies,
          ["eslint-plugin-import", "eslint-plugin-unicorn"],
        );

        packageUtils.addOrRemoveDevDependencies(
          pkg,
          shouldHavePluginsDependencies,
          ["eslint-plugin-node"],
        );

        if ((inMonorepo && inMonorepo.root) || this.options.monorepo) {
          if (this.options.typescript) {
            packageUtils.updateDevDependenciesIfPresent(pkg, [
              "@pob/eslint-config-typescript",
              "@pob/eslint-config-typescript-react",
            ]);
          } else if (pkg.name !== "@pob/eslint-config-monorepo") {
            packageUtils.removeDevDependencies(pkg, [
              "@pob/eslint-config-typescript",
              "@pob/eslint-config-typescript-react",
            ]);
          }
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            this.options.typescript && shouldHavePluginsDependencies,
            ["@typescript-eslint/eslint-plugin", "@typescript-eslint/parser"],
          );
        } else {
          packageUtils.addOrRemoveDevDependencies(pkg, useTypescript, [
            "@pob/eslint-config-typescript",
          ]);
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            useTypescript && shouldHavePluginsDependencies,
            ["@typescript-eslint/eslint-plugin", "@typescript-eslint/parser"],
          );

          packageUtils.addOrRemoveDevDependencies(pkg, hasReact, [
            "@pob/eslint-config-typescript-react",
          ]);
        }
      }
    }

    const { imports, flatCascade } = (() => {
      if (pkg.name === "@pob/eslint-config-monorepo") {
        return {
          imports: [
            'import pobTypescriptConfig from "@pob/eslint-config-typescript"',
            'import pobTypescriptConfigReact from "@pob/eslint-config-typescript-react"',
          ],
          flatCascade: [
            // TODO
          ],
        };
      }

      return {
        imports: [
          useTypescript
            ? 'import pobTypescriptConfig from "@pob/eslint-config-typescript"'
            : 'import pobConfig from "@pob/eslint-config"',
          useTypescript &&
            hasReact &&
            'import pobTypescriptConfigReact from "@pob/eslint-config-typescript-react"',
        ].filter(Boolean),
        flatCascade: (() => {
          // TODO do something with useNodeOnly ?
          console.log({ useNodeOnly });

          if (!useTypescript) {
            return [
              useNode
                ? `...pobConfig(import.meta.url).configs.node${pkg.type === "commonjs" ? "Commonjs" : "Module"}`
                : `...pobConfig(import.meta.url).configs.base${pkg.type === "commonjs" ? "Commonjs" : "Module"}`,
            ];
          }
          if (!hasReact) {
            return [
              useNode
                ? "...pobTypescriptConfig(import.meta.url).configs.node"
                : "...pobTypescriptConfig(import.meta.url).configs.base",
            ];
          }

          return [
            useNode
              ? "...pobTypescriptConfig(import.meta.url).configs.node"
              : "...pobTypescriptConfig(import.meta.url).configs.base",
            this.options.isApp &&
              "...pobTypescriptConfig(import.meta.url).configs.app",
            pkg.dependencies?.["react-native-web"] &&
              '...pobTypescriptConfigReact(import.meta.url).configs["react-native-web"]',
          ];
        })().filter(Boolean),
      };
    })();

    const eslintrcBadPath = this.destinationPath(".eslintrc");
    this.fs.delete(eslintrcBadPath);
    this.fs.delete(`${eslintrcBadPath}.yml`);
    this.fs.delete(`${eslintrcBadPath}.js`);

    const rootLegacyEslintrcPath = this.options.rootAsSrc
      ? false
      : this.destinationPath(".eslintrc.json");

    const srcLegacyEslintrcPath = this.options.rootAsSrc
      ? this.destinationPath(".eslintrc.json")
      : this.destinationPath(
          `${
            useTypescript ? `${this.options.srcDirectory}/` : "lib/"
          }.eslintrc.json`,
        );

    if (rootLegacyEslintrcPath) this.fs.delete(rootLegacyEslintrcPath);
    this.fs.delete(srcLegacyEslintrcPath);

    const eslintConfigPath = this.destinationPath(
      pkg.type === "commonjs" ? "eslint.config.mjs" : "eslint.config.js",
    );

    const invalidEslintConfigPath = this.destinationPath(
      pkg.type !== "commonjs" ? "eslint.config.mjs" : "eslint.config.js",
    );
    this.fs.delete(invalidEslintConfigPath);

    if (!inMonorepo || inMonorepo.root) {
      const rootIgnorePaths = this.options.rootIgnorePaths
        .split("\n")
        .filter(Boolean);
      const getRootIgnorePatterns = () => {
        const ignorePatterns = new Set();

        if (useTypescript) {
          ignorePatterns.add("*.d.ts");
        }

        if (inMonorepo && inMonorepo.root && this.options.documentation) {
          ignorePatterns.add("/docs");
        }

        if ((!inMonorepo || !inMonorepo.root) && useTypescript) {
          const buildPath = `/${this.options.buildDirectory}`;
          if (!rootIgnorePaths.includes(buildPath)) {
            ignorePatterns.add(buildPath);
          }
        }
        if (inMonorepo && inMonorepo.root && this.options.build) {
          ignorePatterns.add("/rollup.config.mjs");
        }

        if (rootIgnorePaths) {
          rootIgnorePaths.forEach((ignorePath) => {
            if (ignorePath.startsWith("#")) return;
            ignorePatterns.add(ignorePath);
          });
        }

        return ignorePatterns;
      };

      const ignorePatterns = getRootIgnorePatterns();
      const srcDirectory =
        useBabel || this.options.typescript ? this.options.srcDirectory : "lib";

      if (this.fs.exists(eslintConfigPath)) {
        // TODO update config !
      } else {
        copyAndFormatTpl(
          this.fs,
          this.templatePath("eslint.config.js.ejs"),
          eslintConfigPath,
          {
            imports,
            flatCascade,
            srcDirectory,
            ignorePatterns: [...ignorePatterns],
          },
        );
        // TODO
        /*  settings: {
              "import/resolver": this.options.enableSrcResolver
                ? {
                    node: {
                      moduleDirectory: [
                        "node_modules",
                        this.options.srcDirectory,
                      ],
                    },
                  }
                : false,
            },
            */
      }
    } else {
      this.fs.delete(eslintConfigPath);
    }

    // see monorepo/lerna/index.js
    if (!(inMonorepo && inMonorepo.root) && !this.options.monorepo) {
      const args = "--quiet";

      packageUtils.addScripts(pkg, {
        "lint:eslint": globalEslint
          ? `yarn ../.. run eslint ${args} ${path
              .relative("../..", ".")
              .replace("\\", "/")}`
          : `eslint ${args} .`,
        lint: `${
          useTypescript && !composite ? "tsc && " : ""
        }yarn run lint:eslint`,
      });

      if (!inMonorepo) {
        pkg.scripts.lint = `yarn run lint:prettier && ${pkg.scripts.lint}`;
        packageUtils.addScripts(pkg, {
          "lint:prettier": "pob-root-prettier --check .",
          "lint:prettier:fix": "pob-root-prettier --write .",
        });
      } else {
        delete pkg.scripts["lint:prettier"];
      }

      delete pkg.scripts["typescript-check"];
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
