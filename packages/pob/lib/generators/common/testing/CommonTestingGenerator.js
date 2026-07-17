import fs from "node:fs";
import path from "node:path";
import Generator from "yeoman-generator";
import { quoteArg } from "../../../utils/execUtils.js";
import inMonorepo from "../../../utils/inMonorepo.js";
import * as packageUtils from "../../../utils/package.js";
import { packageManagerRunWithCwd } from "../../../utils/packageManagerUtils.js";
import { workspacesRun } from "../../../utils/packageManagerWorkspacesUtils.js";
import {
  copyAndFormatTpl,
  writeAndFormatJson,
} from "../../../utils/writeAndFormat.js";

export default class CommonTestingGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("monorepo", {
      type: Boolean,
      default: false,
      description: "is root monorepo",
    });

    this.option("enable", {
      type: Boolean,
      default: true,
      description: "enable testing",
    });

    this.option("runner", {
      type: String,
      default: "node",
      description: "test runner (jest or node)",
    });

    this.option("ci", {
      type: Boolean,
      required: true,
      description: "ci",
    });

    this.option("typescript", {
      type: Boolean,
      required: true,
      description: "typescript",
    });

    this.option("build", {
      type: Boolean,
      required: true,
      description: "build (with babel or typescript)",
    });

    this.option("codecov", {
      type: Boolean,
      required: true,
      description: "Include codecov report",
    });

    this.option("documentation", {
      type: Boolean,
      required: true,
      description: "Include documentation generation",
    });

    this.option("packageManager", {
      type: String,
      default: "yarn",
      description: "yarn, npm, bun, or pnpm",
    });

    this.option("isApp", {
      type: Boolean,
      required: true,
      description: "is app",
    });

    this.option("e2eTesting", {
      type: String,
      default: "",
      description: "e2e testing package path",
    });

    this.option("splitCIJobs", {
      type: Boolean,
      required: true,
      description: "split CI jobs for faster result",
    });

    this.option("onlyLatestLTS", {
      type: Boolean,
      required: true,
      description: "only latest lts",
    });

    this.option("srcDirectory", {
      type: String,
      default: "src",
      description: 'customize srcDirectory, default to "src"',
    });

    this.option("disableYarnGitCache", {
      type: Boolean,
      required: false,
      default: false,
      description:
        "Disable git cache. See https://yarnpkg.com/features/caching#offline-mirror.",
    });
  }

  prompting() {
    if (this.options.enable && this.options.runner === "jest") {
      throw new Error(
        "Jest is deprecated. Please consider using an alternative test runner.",
      );
    }
  }

  default() {
    if (!inMonorepo || inMonorepo.root) {
      this.composeWith("pob:core:ci", {
        enable: this.options.ci,
        disableYarnGitCache: this.options.disableYarnGitCache,
        testing: this.options.enable,
        testRunner: this.options.runner,
        e2eTesting: this.options.e2eTesting,
        build: this.options.build,
        typescript: this.options.typescript,
        documentation: this.options.documentation,
        codecov: this.options.codecov,
        packageManager: this.options.packageManager,
        isApp: this.options.isApp,
        splitJobs: this.options.splitCIJobs,
        onlyLatestLTS: this.options.onlyLatestLTS,
      });
    } else {
      this.composeWith("pob:core:ci", {
        enable: false,
      });
    }
  }

  async writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    packageUtils.removeDevDependencies(pkg, [
      "coveralls",
      "mocha",
      "istanbul",
      "babel-core",
      "ts-jest",
      "babel-jest",
      "pob-lcov-reporter",
    ]);

    const yoConfigPobMonorepo =
      (inMonorepo && inMonorepo.pobMonorepoConfig) || {};
    const globalTesting = yoConfigPobMonorepo && yoConfigPobMonorepo.testing;
    const enableForMonorepo = this.options.monorepo && globalTesting;
    const transpileWithEsbuild = packageUtils.transpileWithEsbuild(pkg);
    const transpileWithBabel = transpileWithEsbuild
      ? false
      : // eslint-disable-next-line unicorn/no-nested-ternary
        this.options.monorepo
        ? yoConfigPobMonorepo.typescript &&
          yoConfigPobMonorepo.typescript !== "check-only"
        : packageUtils.transpileWithBabel(pkg);
    const withTypescript =
      transpileWithBabel ||
      pkg.pob?.bundler === "tsc" ||
      (pkg.pob?.typescript && pkg.pob.typescript !== "check-only");
    const hasReact =
      withTypescript &&
      (this.options.monorepo
        ? (yoConfigPobMonorepo.react ?? packageUtils.hasReact(pkg))
        : packageUtils.hasReact(pkg));
    const testRunner = globalTesting
      ? inMonorepo.pobConfig.monorepo.testRunner
      : this.options.runner;

    const tsTestUtil = (() => {
      if (testRunner === "vitest") return undefined;
      if (!withTypescript) return undefined;
      if (testRunner === "jest") {
        throw new Error("jest is no longer supported. Migrate to vitest.");
      }
      return "node";
    })();

    const dependenciesForTestUtil = {};

    Object.entries(dependenciesForTestUtil).forEach(
      ([key, { devDependenciesShared, devDependenciesWithNode }]) => {
        const sharedCondition =
          this.options.enable &&
          (!inMonorepo || inMonorepo.root) &&
          this.options.typescript &&
          key === tsTestUtil;
        packageUtils.addOrRemoveDevDependencies(
          pkg,
          sharedCondition &&
            (testRunner === "node" || (withTypescript && !transpileWithBabel)),
          devDependenciesShared,
        );
        if (devDependenciesWithNode) {
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            sharedCondition &&
              withTypescript &&
              !transpileWithBabel &&
              testRunner === "node",
            devDependenciesWithNode,
          );
        }
      },
    );

    if (!this.options.enable || (globalTesting && !enableForMonorepo)) {
      packageUtils.removeDevDependencies(pkg, [
        "jest",
        "@types/jest",
        "vitest",
        "@vitest/coverage-v8",
      ]);

      delete pkg.jest;
      this.fs.delete(this.destinationPath("jest.config.js"));
      this.fs.delete(this.destinationPath("jest.config.mjs"));
      this.fs.delete(this.destinationPath("jest.config.cjs"));
      this.fs.delete(this.destinationPath("jest.config.json"));
    }

    const tsTestLoaderOption = (() => {
      switch (tsTestUtil) {
        case "node":
          return "";
        // no default
      }
    })();

    const hasTestFolder =
      !this.options.monorepo && fs.existsSync(this.destinationPath("test"));

    const createTestCommand = ({
      coverage,
      watch,
      workspacesPattern,
      hasReact,
    }) => {
      switch (testRunner) {
        case "node": {
          if (this.options.packageManager === "bun") {
            throw new Error(
              "'node' test runner is configured with the 'bun' package manager. Please set to 'bun' instead.",
            );
          }
          if (!workspacesPattern && this.options.monorepo) {
            throw new Error("Invalid workspacesPattern");
          }
          const experimentalTestCoverage =
            pkg.name === "check-package-dependencies";
          return `TZ=UTC ${
            coverage && !experimentalTestCoverage
              ? `npx c8${
                  coverage === "generate"
                    ? ` --reporter=${coverage === "generate" ? "json" : "lcov"}`
                    : ""
                } --all --src ./${this.options.srcDirectory} `
              : ""
          }node ${
            this.options.typescript
              ? `${tsTestLoaderOption ? `${tsTestLoaderOption} ` : ""}`
              : ""
          }${this.fs.exists("src/test-setup.ts") ? "--import ./src/test-setup.ts " : ""}--test${experimentalTestCoverage && coverage ? ` --experimental-test-coverage${coverage === "generate" ? " --test-reporter=spec --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=docs/coverage.lcov" : ""} --test-coverage-include="${this.options.srcDirectory}/**/*.ts"` : ""} '${this.options.monorepo ? `${workspacesPattern}/*/` : ""}${`${
            hasTestFolder ? "test/*" : `${this.options.srcDirectory}/**/*.test`
          }.${this.options.typescript ? "ts" : "js"}`}'`;
        }
        case "bun": {
          if (this.options.packageManager !== "bun") {
            throw new Error(
              "'bun' test runner cannot be set without bun as packageManager.",
            );
          }

          return `TZ=UTC bun test${watch ? " --watch" : ""}${
            coverage
              ? ` --coverage ${coverage === "generate" ? "--coverage-report=json" : ""}`
              : ""
          }`;
        }
        case "vitest": {
          return `TZ=UTC ${
            coverage
              ? `POB_VITEST_COVERAGE=${`json${coverage === "generate" ? "" : ",text"} `}`
              : ""
          }vitest${watch ? " --watch" : ""}${coverage ? " run --coverage" : ""}`;
        }
        default: {
          throw new Error(`Invalid runner: "${testRunner}"`);
        }
      }
    };

    const jestConfigPath = this.destinationPath("jest.config.json");
    const vitestConfigPath = this.destinationPath("vite.config.js");

    const isVitestUsed =
      this.options.enable &&
      (enableForMonorepo || !globalTesting) &&
      testRunner === "vitest";
    packageUtils.addOrRemoveDevDependencies(pkg, isVitestUsed, [
      "vitest",
      "@vitest/coverage-v8",
    ]);
    if (isVitestUsed) {
      packageUtils.addDevDependencies(pkg, ["vite"]);
    }

    packageUtils.removeScripts(pkg, ["generate:test-coverage"]);

    if (!this.options.enable) {
      // if (inMonorepo) {
      //   if (pkg.scripts.test === 'echo "No tests"') {
      //     delete pkg.scripts.test;
      //   }
      // }
      packageUtils.removeScripts([
        "test",
        "test:coverage",
        "test:watch",
        "test:coverage",
        "test:coverage:json",
        "test:coverage:lcov",
      ]);

      await writeAndFormatJson(
        this.fs,
        this.destinationPath("package.json"),
        pkg,
      );
    } else {
      let workspacesPattern;
      if (this.options.monorepo) {
        const workspacesWithoutStar = pkg.workspaces.map((workspace) => {
          if (!workspace.endsWith("/*")) {
            throw new Error(`Invalid workspace format: ${workspace}`);
          }
          return workspace.slice(0, -2);
        });
        workspacesPattern =
          workspacesWithoutStar.length === 1
            ? workspacesWithoutStar[0]
            : `@(${workspacesWithoutStar.join("|")})`;
      }

      if (this.options.monorepo && !globalTesting) {
        packageUtils.addScripts(pkg, {
          test: workspacesRun(this.options.packageManager, "test"),
        });
      } else {
        if (this.testRunner === "vitest") {
          await copyAndFormatTpl(
            this.fs,
            this.templatePath("vite.config.js.ejs"),
            vitestConfigPath,
            {
              srcDirectory: this.options.srcDirectory,
            },
          );
        }

        packageUtils.removeScripts(pkg, [
          "test:coverage:lcov",
          "test:coverage:json",
        ]);

        if (this.options.monorepo) {
          packageUtils.addScripts(pkg, {
            test: createTestCommand({
              workspacesPattern,
            }),
            "test:watch": createTestCommand({
              workspacesPattern,
              watch: true,
            }),
            "test:coverage": createTestCommand({
              workspacesPattern,
              coverage: true,
            }),
            "test:coverage:generate": createTestCommand({
              workspacesPattern,
              coverage: "generate",
            }),
          });
        } else {
          const tsconfigTestPath = this.destinationPath("tsconfig.test.json");
          this.fs.delete(tsconfigTestPath);

          if (globalTesting) {
            if (pkg.scripts) {
              delete pkg.scripts["test:watch"];
              delete pkg.scripts["test:coverage"];
            }
            packageUtils.addScripts(pkg, {
              test: `${packageManagerRunWithCwd(
                this.options.packageManager,
                "../..",
                "test",
              )} -- ${quoteArg(path.relative("../..", "."))}`,
            });
          } else {
            const withTypescript =
              pkg.pob?.envs?.length > 0 ||
              pkg.pob?.bundler === "rollup-babel" ||
              pkg.pob?.typescript;

            packageUtils.removeScripts(pkg, ["test:coverage:lcov"]);
            packageUtils.addScripts(pkg, {
              test: createTestCommand({}),
              "test:watch": createTestCommand({
                watch: true,
              }),
              "test:coverage": createTestCommand({
                coverage: true,
              }),
              "test:coverage:generate": createTestCommand({
                coverage: "generate",
              }),
            });

            // TODO migrate some config to vitest. Keeping this if until then.
            if (testRunner === "jest") {
              const srcDirectory = this.options.build
                ? this.options.srcDirectory
                : "lib";

              const jestConfig = this.fs.readJSON(
                jestConfigPath,
                pkg.jest ?? {},
              );
              delete pkg.jest;
              Object.assign(jestConfig, {
                cacheDirectory: "./node_modules/.cache/jest",
                testMatch: [
                  `<rootDir>/${srcDirectory}/**/__tests__/**/*.${
                    withTypescript ? "ts" : "?(m)js"
                  }${hasReact ? "?(x)" : ""}`,
                  `<rootDir>/${srcDirectory}/**/*.test.${
                    withTypescript ? "ts" : "?(m)js"
                  }${hasReact ? "?(x)" : ""}`,
                ],
                collectCoverageFrom: [
                  `${srcDirectory}/**/*.${withTypescript ? "ts" : "?(m)js"}${
                    hasReact ? "?(x)" : ""
                  }`,
                ],
                moduleFileExtensions: [
                  withTypescript && "ts",
                  withTypescript && hasReact && "tsx",
                  "js",
                  // 'jsx',
                  "json",
                ].filter(Boolean),
                // transform: {
                //   [`^.+\\.ts${hasReact ? 'x?' : ''}$`]: 'babel-jest',
                // },
              });
              if (transpileWithEsbuild) {
                jestConfig.transform = {
                  [hasReact ? "^.+\\.tsx?$" : "^.+\\.ts$"]: [
                    "jest-esbuild",
                    {
                      // format: shouldUseExperimentalVmModules ? "esm" : "cjs",
                    },
                  ],
                };
              } else if (!transpileWithBabel && !withTypescript) {
                delete jestConfig.transform;
              } else if (jestConfig.transform) {
                jestConfig.transform = Object.fromEntries(
                  Object.entries(jestConfig.transform).filter(
                    ([key, value]) =>
                      !(
                        value &&
                        Array.isArray(value) &&
                        value[0] === "jest-esbuild"
                      ),
                  ),
                );
                if (Object.keys(jestConfig.transform).length === 0) {
                  delete jestConfig.transform;
                }
              }

              if (
                !pkg.pob?.envs ||
                pkg.pob?.envs.length === 0 ||
                pkg.pob?.envs.some((env) => env.target === "node")
              ) {
                // jestConfig.testEnvironment = 'node'; this is the default now
                delete jestConfig.testEnvironment;
              } else {
                delete jestConfig.testEnvironment;
              }

              await writeAndFormatJson(this.fs, jestConfigPath, jestConfig);
            }
          }
        }
      }
    }

    // legacy jest babel config
    this.fs.delete("babel.config.cjs");

    return writeAndFormatJson(
      this.fs,
      this.destinationPath("package.json"),
      pkg,
    );
  }
}
