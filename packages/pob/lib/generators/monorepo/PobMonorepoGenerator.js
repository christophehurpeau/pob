import { execSync } from "node:child_process";
import fs from "node:fs";
import { platform } from "node:process";
import Generator from "yeoman-generator";
import * as packageUtils from "../../utils/package.js";
import { packageManagerRun } from "../../utils/packageManagerUtils.js";
import { workspacesRun } from "../../utils/packageManagerWorkspacesUtils.js";
import {
  buildDependenciesMaps,
  buildTopologicalOrderBatches,
  discoverWorkspaces,
  getWorkspaceName,
} from "../../utils/workspaceUtils.js";
import { copyAndFormatTpl } from "../../utils/writeAndFormat.js";

const getAppTypes = (configs) => {
  const appConfigs = configs.filter(
    (config) => config && config.project && config.project.type === "app",
  );

  const appTypes = new Set();
  appConfigs.forEach((config) => {
    appTypes.add(config.app.type);
  });

  return [...appTypes];
};

const hasDist = (packages, configs) =>
  configs.some(
    (config, index) =>
      !!(config && config.project && config.project.type === "lib") &&
      !!(
        packages[index].pob?.babelEnvs?.length > 0 ||
        packages[index].pob?.envs?.length > 0
      ),
  );

const hasBuild = (packages, configs) =>
  configs.some(
    (config, index) =>
      !!(
        config &&
        config.project &&
        config.project.type === "app" &&
        config.app.type === "alp-node"
      ),
  );

const hasData = (packages, configs) =>
  configs.some(
    (config, index) =>
      !!(
        config &&
        config.project &&
        config.project.type === "app" &&
        config.app.type === "alp-node"
      ),
  );

const hasTamagui = (packages, configs) =>
  packages.some(
    (pkg) =>
      !!(pkg.dependencies?.tamagui || pkg.dependencies?.["@tamagui/core"]),
  );

export default class PobMonorepoGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("updateOnly", {
      type: Boolean,
      required: false,
      default: false,
      description: "Avoid asking questions",
    });

    this.option("isAppProject", {
      type: Boolean,
      required: false,
      default: false,
      description: "app project, no pusblishing on npm",
    });

    this.option("packageManager", {
      type: String,
      default: "yarn",
      description: "yarn, npm, bun, or pnpm",
    });

    this.option("yarnNodeLinker", {
      type: String,
      required: false,
      default: "pnp",
      description:
        "Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.",
    });

    this.option("onlyLatestLTS", {
      type: Boolean,
      required: true,
      description: "only latest lts",
    });

    this.option("disableYarnGitCache", {
      type: Boolean,
      required: false,
      default: false,
      description:
        "Disable git cache. See https://yarnpkg.com/features/caching#offline-mirror.",
    });
  }

  async initializing() {
    const workspaces = await discoverWorkspaces(this.destinationPath());
    const batches = buildTopologicalOrderBatches(
      workspaces,
      buildDependenciesMaps(workspaces),
    );

    this.packages = [];
    this.packageLocations = [];

    for (const batch of batches) {
      // sort by name to ensure consistent ordering
      batch.sort((a, b) =>
        getWorkspaceName(a).localeCompare(getWorkspaceName(b), "en"),
      );

      batch.forEach((workspace) => {
        if (workspace.isRoot) {
          return;
        }
        this.packages.push(workspace.manifest.raw);
        this.packageLocations.push(workspace.relativeCwd.toString());
      });
    }

    this.packageNames = this.packages.map((pkg) => pkg.name);
    this.packageConfigs = this.packageLocations.map((location) => {
      try {
        return JSON.parse(fs.readFileSync(`${location}/.yo-rc.json`)).pob;
      } catch {
        console.warn(`warn: could not read pob config in ${location}`);
        return {};
      }
    });
  }

  async prompting() {
    const config = this.config.get("monorepo");

    if (this.options.updateOnly && config) {
      this.pobMonorepoConfig = config;
      this.pobMonorepoConfig.packageNames = this.packageNames;
      this.config.set("monorepo", this.pobMonorepoConfig);
      return;
    }

    if (this.pobMonorepoConfig.ciPushWorkflow) {
      throw new Error(
        "ciPushWorkflow is deprecated, use disablePushWorkflow instead",
      );
    }

    this.pobMonorepoConfig = await this.prompt([
      {
        type: "confirm",
        name: "ci",
        message: "Would you like ci with github actions ?",
        default: config
          ? config.ci
          : this.fs.exists(this.destinationPath(".circleci/config.yml")) ||
            this.fs.exists(this.destinationPath(".github/workflows")),
      },
      {
        type: "confirm",
        name: "disablePushWorkflow",
        message: "Would you like to DISABLE push workflow ?",
        when: (answers) => answers.ci,
        default: config.disablePushWorkflow,
      },
      {
        type: "confirm",
        name: "testing",
        message: "Would you like testing ?",
        when: (answers) => answers.ci,
        default: config ? config.testing : true,
      },
      {
        type: "list",
        name: "testRunner",
        message: "What testing runner would you like ?",
        when: (answers) => answers.testing,
        default: config ? config.testRunner : "node",
        choices: ["node", "vitest"],
      },
      {
        type: "confirm",
        name: "e2eTesting",
        message: "Would you like e2e testing ?",
        when: (answers) => answers.ci,
        default: config ? config.e2eTesting : true,
      },
      {
        type: "confirm",
        name: "codecov",
        message: "Would you like code coverage ?",
        when: (answers) => answers.ci && answers.testing,
        default: config ? config.codecov : true,
      },
      {
        type: "confirm",
        name: "documentation",
        message: "Would you like documentation ?",
        when: (answers) => answers.ci && !this.options.isAppProject,
        default: config ? config.documentation : true,
      },
      {
        type: "confirm",
        name: "typescript",
        message: "Would you like typescript monorepo ?",
        default: config ? config.typescript : true,
      },
      {
        type: "confirm",
        name: "eslint",
        message: "Would you like eslint in monorepo ?",
        default: config ? config.eslint : true,
      },
    ]);
    this.pobMonorepoConfig.packageNames = this.packageNames;
    this.config.set("monorepo", this.pobMonorepoConfig);
    this.config.delete("pob-config");
  }

  default() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});

    const packageNames = this.packageNames;
    const packagePaths = this.packageLocations.filter(
      this.pobMonorepoConfig.typescript
        ? (packagePath) => fs.existsSync(`${packagePath}/tsconfig.json`)
        : Boolean,
    );

    if (packagePaths.length === 0 && packageNames.length > 0) {
      console.log(packageNames, packagePaths);
      throw new Error("packages should not be empty");
    }

    this.composeWith("pob:common:husky", {});

    const splitCIJobs = this.packageNames.length > 8;

    this.composeWith("pob:common:testing", {
      monorepo: true,
      enable: this.pobMonorepoConfig.testing,
      runner: this.pobMonorepoConfig.testRunner,
      disableYarnGitCache: this.options.disableYarnGitCache,
      testing: this.pobMonorepoConfig.testing,
      e2eTesting: this.pobMonorepoConfig.e2eTesting,
      build: this.pobMonorepoConfig.typescript === true,
      typescript: this.pobMonorepoConfig.typescript,
      documentation: !!this.pobMonorepoConfig.documentation,
      codecov: this.pobMonorepoConfig.testing && this.pobMonorepoConfig.codecov,
      ci: this.pobMonorepoConfig.ci,
      disablePushWorkflow: this.pobMonorepoConfig.disablePushWorkflow,
      packageManager: this.options.packageManager,
      isApp: this.options.isAppProject,
      onlyLatestLTS: this.options.onlyLatestLTS,
      splitCIJobs,
    });

    const rootIgnorePaths = [
      this.pobMonorepoConfig.e2eTesting &&
        `${this.pobMonorepoConfig.e2eTesting === "." || this.pobMonorepoConfig.e2eTesting === true ? "" : `/${this.pobMonorepoConfig.e2eTesting}`}/playwright-report/`,
      this.pobMonorepoConfig.e2eTesting &&
        `${this.pobMonorepoConfig.e2eTesting === "." || this.pobMonorepoConfig.e2eTesting === true ? "" : `/${this.pobMonorepoConfig.e2eTesting}`}/test-results/`,
    ].filter(Boolean);

    if (hasTamagui(this.packages, this.packageConfigs)) {
      throw new Error(
        "Tamagui is no longer supported. Please migrate to native-wind.",
      );
    }

    const gitignorePaths = [].filter(Boolean);

    this.composeWith("pob:common:format-lint", {
      monorepo: true,
      documentation: this.pobMonorepoConfig.documentation,
      storybook: pkg?.devDependencies?.storybook,
      typescript: this.pobMonorepoConfig.typescript,
      build: this.pobMonorepoConfig.typescript === true,
      testing: this.pobMonorepoConfig.testing,
      testRunner: this.pobMonorepoConfig.testRunner,
      packageManager: this.options.packageManager,
      yarnNodeLinker: this.options.yarnNodeLinker,
      appTypes: JSON.stringify(getAppTypes(this.packageConfigs)),
      ignorePaths: [
        ...gitignorePaths.map((path) => `/${path}`),
        hasDist(this.packages, this.packageConfigs) && "/dist",
        hasBuild(this.packages, this.packageConfigs) && "/build",
        hasData(this.packages, this.packageConfigs) && "/data",
      ]
        .filter(Boolean)
        .join("\n"),
      rootIgnorePaths: rootIgnorePaths.join("\n"),
    });

    this.composeWith("pob:lib:doc", {
      enabled: this.pobMonorepoConfig.documentation,
      testing: this.pobMonorepoConfig.testing,
      packageNames: JSON.stringify(packageNames),
      packagePaths: JSON.stringify(packagePaths),
      packageManager: this.options.packageManager,
    });

    this.composeWith("pob:core:vscode", {
      root: true,
      monorepo: true,
      packageManager: this.options.packageManager,
      yarnNodeLinker: this.options.yarnNodeLinker,
      typescript: this.pobMonorepoConfig.typescript,
      testing: this.pobMonorepoConfig.testing,
      testRunner: this.pobMonorepoConfig.testRunner,
      packageNames: JSON.stringify(packageNames),
      packageLocations: JSON.stringify(this.packageLocations),
    });

    // Always add a gitignore, because npm publish uses it.
    this.composeWith("pob:core:gitignore", {
      root: true,
      typescript: this.pobMonorepoConfig.typescript,
      documentation: this.pobMonorepoConfig.documentation,
      testing: this.pobMonorepoConfig.testing,
      // TODO add workspaces paths like we do in format-lint
      paths: [
        // TODO remove gitignorePaths
        ...gitignorePaths,
        ...rootIgnorePaths,
      ].join("\n"),
      // todo: fix this using workspaces
      // buildDirectory: this.pobMonorepoConfig.typescript ? `/*/build` : "",
    });

    this.composeWith("pob:common:remove-old-dependencies");

    this.composeWith("pob:common:release", {
      enable: true,
      packageManager: this.options.packageManager,
      enablePublish: !this.options.isAppProject,
      withBabel: this.pobMonorepoConfig.typescript,
      isMonorepo: true,
      ci: this.pobMonorepoConfig.ci,
      disableYarnGitCache: this.options.disableYarnGitCache,
      updateOnly: this.options.updateOnly,
    });

    this.composeWith("pob:monorepo:typescript", {
      enable: this.pobMonorepoConfig.typescript,
      checkOnly: this.pobMonorepoConfig.typescript === "check-only",
      isAppProject: this.options.isAppProject,
      packageNames: JSON.stringify(packageNames),
      packagePaths: JSON.stringify(packagePaths),
      testRunner: this.pobMonorepoConfig.testRunner,
      onlyLatestLTS: this.options.onlyLatestLTS,
      packageManager: this.options.packageManager,
    });

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);

    if (platform !== "win32") {
      execSync(
        `rm -Rf ${["lib-*", "coverage", "docs"].filter(Boolean).join(" ")}`,
      );
    }
  }

  async writing() {
    if (!this.options.isAppProject) {
      const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
      const rollupKinds = new Set();

      this.packages.forEach((pkg) => {
        if (pkg.pob?.bundler && pkg.pob.bundler.startsWith("rollup-")) {
          rollupKinds.add(pkg.pob.bundler.slice("rollup-".length));
        }
      });

      const rollupConfigs = [];
      this.packageLocations.forEach((location) => {
        const rollupPath = `${location}/rollup.config.mjs`;
        const rollupConfig = this.fs.read(this.destinationPath(rollupPath), {
          defaults: null,
        });
        if (rollupConfig) {
          rollupConfigs.push(rollupPath);
        }
      });

      if (rollupConfigs.length > 0) {
        await copyAndFormatTpl(
          this.fs,
          this.templatePath("monorepo.rollup.config.mjs.ejs"),
          this.destinationPath("rollup.config.mjs"),
          {
            configLocations: rollupConfigs,
          },
        );
      } else {
        this.fs.delete("rollup.config.mjs");
      }
      packageUtils.addOrRemoveScripts(pkg, rollupConfigs.length > 0, {
        "clean:build": workspacesRun(
          this.options.packageManager,
          "clean:build",
        ),
        build: `${packageManagerRun(this.options.packageManager, "clean:build")} && rollup --config rollup.config.mjs`,
        watch: `${packageManagerRun(this.options.packageManager, "clean:build")} && rollup --config rollup.config.mjs --watch`,
      });

      packageUtils.addOrRemoveDevDependencies(pkg, rollupKinds.has("esbuild"), [
        "@pob/rollup-esbuild",
      ]);
      if (rollupKinds.has("esbuild")) {
        packageUtils.removeDevDependencies(pkg, ["rollup"]);
      }
      this.fs.writeJSON(this.destinationPath("package.json"), pkg);
    }

    this.composeWith("pob:core:sort-package");
  }

  end() {
    console.log("save config");
    this.config.save();
  }
}
