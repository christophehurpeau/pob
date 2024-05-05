import fs from "node:fs";
import path from "node:path";
import Generator from "yeoman-generator";
import inMonorepo from "../../../utils/inMonorepo.js";
import * as packageUtils from "../../../utils/package.js";
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
      desc: "is root monorepo",
    });

    this.option("enable", {
      type: Boolean,
      default: true,
      desc: "enable testing",
    });

    this.option("runner", {
      type: String,
      default: "jest",
      desc: "test runner (jest or node)",
    });

    this.option("enableReleasePlease", {
      type: Boolean,
      default: true,
      desc: "enable release-please",
    });

    this.option("enableYarnVersion", {
      type: Boolean,
      default: true,
      desc: "enable yarn version conventional commits",
    });

    this.option("ci", {
      type: Boolean,
      required: true,
      desc: "ci",
    });

    this.option("typescript", {
      type: Boolean,
      required: true,
      desc: "typescript",
    });

    this.option("build", {
      type: Boolean,
      required: true,
      desc: "build (with babel or typescript)",
    });

    this.option("codecov", {
      type: Boolean,
      required: true,
      desc: "Include codecov report",
    });

    this.option("documentation", {
      type: Boolean,
      required: true,
      desc: "Include documentation generation",
    });

    this.option("packageManager", {
      type: String,
      default: "yarn",
      desc: "yarn or npm",
    });

    this.option("isApp", {
      type: Boolean,
      required: true,
      desc: "is app",
    });

    this.option("e2eTesting", {
      type: String,
      default: "",
      desc: "e2e testing package path",
    });

    this.option("splitCIJobs", {
      type: Boolean,
      required: true,
      desc: "split CI jobs for faster result",
    });

    this.option("onlyLatestLTS", {
      type: Boolean,
      required: true,
      desc: "only latest lts",
    });

    this.option("srcDirectory", {
      type: String,
      default: "src",
      desc: 'customize srcDirectory, default to "src"',
    });

    this.option("disableYarnGitCache", {
      type: Boolean,
      required: false,
      default: false,
      desc: "Disable git cache. See https://yarnpkg.com/features/caching#offline-mirror.",
    });

    this.option("swc", {
      type: Boolean,
      required: false,
      default: false,
      desc: "Use swc to transpile code.",
    });
  }

  default() {
    if (!inMonorepo || inMonorepo.root) {
      this.composeWith("pob:core:ci", {
        enable: this.options.ci,
        enableReleasePlease: this.options.enableReleasePlease,
        enableYarnVersion: this.options.enableYarnVersion,
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

  writing() {
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
      ? yoConfigPobMonorepo.typescript
      : packageUtils.transpileWithBabel(pkg);
    const withTypescript = transpileWithBabel || pkg.pob?.typescript;
    let hasReact =
      withTypescript &&
      (this.options.monorepo
        ? yoConfigPobMonorepo.react ?? packageUtils.hasReact(pkg)
        : packageUtils.hasReact(pkg));
    const testRunner = globalTesting
      ? inMonorepo.pobConfig.monorepo.testRunner || "jest"
      : this.options.runner;

    const isJestRunner = testRunner === "jest";

    const tsTestUtil = (() => {
      if (testRunner === "vitest") return undefined;
      if (this.options.swc || isJestRunner) return "swc";
      return "ts-node";
    })();

    const dependenciesForTestUtil = {
      "ts-node": { devDependenciesShared: ["ts-node"] },
      swc: {
        devDependenciesShared: ["@swc/core"],
        devDependenciesWithJest: ["@swc/jest"],
        devDependenciesWithNode: ["@swc-node/register"],
      },
    };

    Object.entries(dependenciesForTestUtil).forEach(
      ([
        key,
        {
          devDependenciesShared,
          devDependenciesWithJest,
          devDependenciesWithNode,
        },
      ]) => {
        const sharedCondition =
          this.options.enable &&
          (!inMonorepo || inMonorepo.root) &&
          this.options.typescript &&
          key === tsTestUtil;
        packageUtils.addOrRemoveDevDependencies(
          pkg,
          sharedCondition &&
            (testRunner === "node" || (withTypescript && !transpileWithBabel)),
          devDependenciesShared
        );
        if (devDependenciesWithJest) {
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            sharedCondition &&
              withTypescript &&
              !transpileWithBabel &&
              testRunner === "jest",
            devDependenciesWithJest
          );
        }
        if (devDependenciesWithNode) {
          packageUtils.addOrRemoveDevDependencies(
            pkg,
            sharedCondition &&
              withTypescript &&
              !transpileWithBabel &&
              testRunner === "node",
            devDependenciesWithNode
          );
        }
      }
    );

    if (
      !this.options.enable ||
      !isJestRunner ||
      (globalTesting && !enableForMonorepo)
    ) {
      packageUtils.removeDevDependencies(pkg, ["jest", "@types/jest"]);

      delete pkg.jest;
      this.fs.delete(this.destinationPath("jest.config.js"));
      this.fs.delete(this.destinationPath("jest.config.mjs"));
      this.fs.delete(this.destinationPath("jest.config.cjs"));
      this.fs.delete(this.destinationPath("jest.config.json"));
    }

    const tsTestLoaderOption = (() => {
      switch (tsTestUtil) {
        case "ts-node":
          return "--loader=ts-node/esm --experimental-specifier-resolution=node";
        case "swc":
          return "--import=@swc-node/register/esm";

        // no default
      }
    })();

    const hasTestFolder =
      !this.options.monorepo && fs.existsSync(this.destinationPath("test"));

    const createTestCommand = ({
      coverage,
      coverageLcov,
      coverageJson,
      watch,
      shouldUseExperimentalVmModules,
      workspacesPattern,
      hasReact,
    }) => {
      switch (testRunner) {
        case "jest": {
          return `${
            shouldUseExperimentalVmModules
              ? "NODE_OPTIONS=--experimental-vm-modules "
              : ""
          }jest${watch ? " --watch" : ""}${
            coverage || coverageJson || coverageLcov
              ? ` --coverage ${
                  coverageLcov
                    ? "--coverageReporters=lcov"
                    : `--coverageReporters=json${
                        coverageJson ? "" : " --coverageReporters=text"
                      }`
                }`
              : ""
          }`;
        }
        case "node": {
          if (!workspacesPattern && this.options.monorepo) {
            throw new Error("Invalid workspacesPattern");
          }
          return `${
            tsTestUtil === "ts-node"
              ? "TS_NODE_PROJECT=tsconfig.test.json "
              : ""
          }${
            coverage || coverageJson || coverageLcov
              ? `npx c8${
                  coverageLcov || coverageJson
                    ? ` --reporter=${coverageJson ? "json" : "lcov"}`
                    : ""
                } --src ./${this.options.srcDirectory} `
              : ""
          }node ${
            this.options.typescript ? `${tsTestLoaderOption} ` : ""
          }--test ${this.options.monorepo ? `${workspacesPattern}/` : ""}${`${
            hasTestFolder ? "test/*" : `${this.options.srcDirectory}/**/*.test`
          }.${this.options.typescript ? "ts" : "js"}`}`;
        }
        case "vitest": {
          return `${
            coverage || coverageJson || coverageLcov
              ? `POB_VITEST_COVERAGE=${
                  coverageLcov ? "lcov" : `json${coverageJson ? "" : ",text"} `
                }`
              : ""
          }vitest${watch ? " --watch" : ""}${
            coverage || coverageJson || coverageLcov ? " run --coverage" : ""
          }`;
        }
        default: {
          throw new Error(`Invalid runner: "${testRunner}"`);
        }
      }
    };

    const jestConfigPath = this.destinationPath("jest.config.json");
    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.options.enable &&
        (enableForMonorepo || !globalTesting) &&
        testRunner === "jest",
      ["jest", "@types/jest"]
    );

    if (!this.options.enable) {
      // if (inMonorepo) {
      //   if (pkg.scripts.test === 'echo "No tests"') {
      //     delete pkg.scripts.test;
      //   }
      //   delete pkg.scripts['generate:test-coverage'];
      // }
      packageUtils.removeScripts([
        "test",
        "test:coverage",
        "generate:test-coverage",
        "test:watch",
        "test:coverage",
        "test:coverage:json",
        "test:coverage:lcov",
      ]);

      writeAndFormatJson(this.fs, this.destinationPath("package.json"), pkg);
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
          test: "yarn workspaces foreach --parallel -Av run test",
        });
      } else if (this.options.monorepo) {
        const shouldUseExperimentalVmModules = pkg.type === "module";

        packageUtils.addScripts(pkg, {
          test: createTestCommand({
            workspacesPattern,
            shouldUseExperimentalVmModules,
          }),
          "test:watch": createTestCommand({
            workspacesPattern,
            shouldUseExperimentalVmModules,
            watch: true,
          }),
          "test:coverage": createTestCommand({
            workspacesPattern,
            shouldUseExperimentalVmModules,
            coverage: true,
          }),
          "test:coverage:lcov": createTestCommand({
            workspacesPattern,
            shouldUseExperimentalVmModules,
            coverageLcov: true,
          }),
          "test:coverage:json": createTestCommand({
            workspacesPattern,
            shouldUseExperimentalVmModules,
            coverageJson: true,
          }),
        });

        if (isJestRunner) {
          hasReact = yoConfigPobMonorepo.packageNames.some((pkgName) =>
            pkgName.startsWith("react-")
          );

          const jestConfig = this.fs.readJSON(jestConfigPath, pkg.jest ?? {});
          delete pkg.jest;

          const srcDirectory = this.options.srcDirectory;
          Object.assign(jestConfig, {
            cacheDirectory: "./node_modules/.cache/jest",
            testEnvironment: "node",
            testMatch: [
              `<rootDir>/${workspacesPattern}/*/@(${srcDirectory}|lib)/**/__tests__/**/*.${
                transpileWithBabel ? "(ts|js|cjs|mjs)" : "(js|cjs|mjs)"
              }${hasReact ? "?(x)" : ""}`,
              `<rootDir>/${workspacesPattern}/*/@(${srcDirectory}|lib)/**/*.test.${
                transpileWithBabel ? "(ts|js|cjs|mjs)" : "(js|cjs|mjs)"
              }${hasReact ? "?(x)" : ""}`,
            ],
          });

          if (shouldUseExperimentalVmModules) {
            jestConfig.extensionsToTreatAsEsm = [
              transpileWithBabel && ".ts",
              transpileWithBabel && hasReact && ".tsx",
            ].filter(Boolean);
          } else {
            delete jestConfig.extensionsToTreatAsEsm;
          }

          if (tsTestUtil === "swc" && !transpileWithBabel && withTypescript) {
            jestConfig.transform = {
              [hasReact ? "^.+\\.tsx?$" : "^.+\\.ts$"]: ["@swc/jest"],
            };
          } else if (jestConfig.transform) {
            jestConfig.transform = Object.fromEntries(
              Object.entries(jestConfig.transform).filter(
                ([key, value]) =>
                  value !== "@swc/jest" &&
                  !(Array.isArray(value) && value[0] === "@swc/jest")
              )
            );
            if (Object.keys(jestConfig.transform).length === 0) {
              delete jestConfig.transform;
            }
          }

          writeAndFormatJson(this.fs, jestConfigPath, jestConfig);
        }
      } else {
        const tsconfigTestPath = this.destinationPath("tsconfig.test.json");
        if (testRunner === "node" && withTypescript) {
          const nodeVersion = this.options.onlyLatestLTS ? "20" : "18";
          copyAndFormatTpl(
            this.fs,
            this.templatePath("tsconfig.test.json.ejs"),
            tsconfigTestPath,
            {
              nodeVersion,
            }
          );
        } else {
          this.fs.delete(tsconfigTestPath);
        }

        if (globalTesting) {
          if (pkg.scripts) {
            delete pkg.scripts["generate:test-coverage"];
            delete pkg.scripts["test:watch"];
            delete pkg.scripts["test:coverage"];
          }
          packageUtils.addScripts(pkg, {
            test: `yarn ../../ run test -- ${path
              .relative("../..", ".")
              .replace("\\", "/")}`,
          });
        } else {
          const babelEnvs = pkg.pob?.babelEnvs || [];
          const transpileWithBabel = packageUtils.transpileWithBabel(pkg);
          const withTypescript = babelEnvs.length > 0 || pkg.pob?.typescript;

          const shouldUseExperimentalVmModules =
            pkg.type === "module" && !inMonorepo;

          packageUtils.addScripts(pkg, {
            test: createTestCommand({ shouldUseExperimentalVmModules }),
            "test:watch": createTestCommand({
              shouldUseExperimentalVmModules,
              watch: true,
            }),
            "test:coverage": createTestCommand({
              shouldUseExperimentalVmModules,
              coverage: true,
            }),
            "test:coverage:lcov": createTestCommand({
              shouldUseExperimentalVmModules,
              coverageLcov: true,
            }),
            "test:coverage:json": createTestCommand({
              shouldUseExperimentalVmModules,
              coverageJson: true,
            }),
          });

          if (testRunner === "jest") {
            const srcDirectory =
              transpileWithBabel || withTypescript
                ? this.options.srcDirectory
                : "lib";

            const jestConfig = this.fs.readJSON(jestConfigPath, pkg.jest ?? {});
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
                    format: shouldUseExperimentalVmModules ? "esm" : "cjs",
                  },
                ],
              };
            } else if (!transpileWithBabel && !withTypescript) {
              delete jestConfig.transform;
            } else {
              if (
                tsTestUtil === "swc" &&
                !transpileWithBabel &&
                withTypescript
              ) {
                jestConfig.transform = {
                  [hasReact ? "^.+\\.tsx?$" : "^.+\\.ts$"]: ["@swc/jest"],
                };
              } else if (jestConfig.transform) {
                jestConfig.transform = Object.fromEntries(
                  Object.entries(jestConfig.transform).filter(
                    ([key, value]) =>
                      value !== "@swc/jest" &&
                      !(Array.isArray(value) && value[0] === "@swc/jest")
                  )
                );
                if (Object.keys(jestConfig.transform).length === 0) {
                  delete jestConfig.transform;
                }
              }

              if (jestConfig.transform) {
                jestConfig.transform = Object.fromEntries(
                  Object.entries(jestConfig.transform).filter(
                    ([key, value]) =>
                      !(
                        value &&
                        Array.isArray(value) &&
                        value[0] === "jest-esbuild"
                      )
                  )
                );
                if (Object.keys(jestConfig.transform).length === 0) {
                  delete jestConfig.transform;
                }
              }
            }

            if (shouldUseExperimentalVmModules) {
              jestConfig.extensionsToTreatAsEsm = [
                withTypescript && ".ts",
                withTypescript && hasReact && ".tsx",
              ].filter(Boolean);
            } else {
              delete jestConfig.extensionsToTreatAsEsm;
            }

            if (
              babelEnvs.length === 0 ||
              babelEnvs.some((env) => env.target === "node")
            ) {
              // jestConfig.testEnvironment = 'node'; this is the default now
              delete jestConfig.testEnvironment;
            } else {
              delete jestConfig.testEnvironment;
            }

            writeAndFormatJson(this.fs, jestConfigPath, jestConfig);
          }
        }
      }
    }

    if (
      transpileWithBabel &&
      ((this.options.monorepo && globalTesting) || !globalTesting) &&
      testRunner === "jest"
    ) {
      // cjs for jest compat
      copyAndFormatTpl(
        this.fs,
        this.templatePath("babel.config.cjs.ejs"),
        this.destinationPath("babel.config.cjs"),
        {
          only: !this.options.monorepo
            ? `'${this.options.srcDirectory}'`
            : pkg.workspaces
                .flatMap((workspace) => [
                  `'${workspace}/${this.options.srcDirectory}'`,
                  `'${workspace}/lib'`,
                ])
                .join(", "),
          hasReact,
          hasLinaria:
            !!pkg.devDependencies?.["@linaria/babel-preset"] ||
            !!pkg.devDependencies?.["alp-dev"],
          testing: this.options.testing,
          jestExperimentalESM: pkg.type === "module",
        }
      );
    } else {
      this.fs.delete("babel.config.cjs");
    }

    writeAndFormatJson(this.fs, this.destinationPath("package.json"), pkg);
  }
}
