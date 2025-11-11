import fs from "node:fs";
import Generator from "yeoman-generator";
import inMonorepo from "../../../utils/inMonorepo.js";
import { latestLTS, maintenanceLTS } from "../../../utils/nodeVersions.js";
import * as packageUtils from "../../../utils/package.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

export const ciContexts = [];

export default class CoreCIGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("enable", {
      type: Boolean,
      default: true,
      description: "enable ci",
    });

    this.option("build", {
      type: Boolean,
      default: true,
      description: "enable build",
    });

    this.option("typescript", {
      type: Boolean,
      default: true,
      description: "enable typescript",
    });

    this.option("testing", {
      type: Boolean,
      default: true,
      description: "enable testing",
    });
    this.option("testRunner", {
      type: String,
      required: false,
      default: "jest",
      description: "test runner: jest | node",
    });

    this.option("e2eTesting", {
      type: String,
      default: "",
      description: "e2e testing package path",
    });

    this.option("ci", {
      type: Boolean,
      required: true,
      description: "ci with github actions",
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

    this.option("isApp", {
      type: Boolean,
      required: true,
      description: "is app",
    });

    this.option("onlyLatestLTS", {
      type: Boolean,
      required: true,
      description: "only latest lts",
    });

    this.option("splitJobs", {
      type: Boolean,
      required: true,
      description: "split CI jobs for faster result",
    });

    this.option("disableYarnGitCache", {
      type: Boolean,
      required: false,
      default: false,
      description:
        "Disable git cache. See https://yarnpkg.com/features/caching#offline-mirror.",
    });
  }

  default() {
    if (fs.existsSync(this.destinationPath(".circleci"))) {
      fs.rmdirSync(this.destinationPath(".circleci"), { recursive: true });
    }

    if (this.options.enable) {
      const pkg = this.fs.readJSON(this.destinationPath("package.json"));

      const checks = !!pkg.scripts && !!pkg.scripts.checks;
      const testing =
        this.options.testing && !!pkg.scripts && !!pkg.scripts.test;
      const build = this.options.build;

      copyAndFormatTpl(
        this.fs,
        this.templatePath(
          this.options.splitJobs
            ? "github-action-push-workflow-split.yml.ejs"
            : "github-action-push-workflow.yml.ejs",
        ),
        this.destinationPath(".github/workflows/push.yml"),
        {
          packageManager: this.options.packageManager,
          disableYarnGitCache: this.options.disableYarnGitCache,
          testing,
          e2eTesting:
            this.options.e2eTesting && this.options.e2eTesting !== "false"
              ? this.options.e2eTesting
              : false,
          checks,
          documentation: this.options.documentation,
          build,
          typescript: this.options.typescript,
          codecov: this.options.codecov,
          onlyLatestLTS: this.options.onlyLatestLTS,
          isReleasePleaseEnabled: this.isReleasePleaseEnabled,
          publishSinglePackage: this.isReleasePleaseEnabled && !pkg.private,
          publishMonorepo:
            this.isReleasePleaseEnabled &&
            inMonorepo &&
            inMonorepo.root &&
            inMonorepo.pobConfig?.project?.type === "lib",
          nodeLatestMajorVersion: latestLTS,
          nodeMaintenanceMajorVersion: maintenanceLTS,
        },
      );

      ciContexts.push(
        "reviewflow",
        ...(this.options.splitJobs
          ? [
              checks && "checks",
              build && "build",
              "lint",
              testing && !this.options.onlyLatestLTS && `test (${latestLTS})`,
              testing && `test (${maintenanceLTS})`,
            ].filter(Boolean)
          : [
              !this.options.onlyLatestLTS && `build (${latestLTS}.x)`,
              `build (${maintenanceLTS}.x)`,
            ].filter(Boolean)),
      );
    } else {
      this.fs.delete(this.destinationPath(".github/workflows/push.yml"));
    }

    if (
      this.options.enable &&
      !this.options.isApp &&
      this.options.documentation
    ) {
      copyAndFormatTpl(
        this.fs,
        this.templatePath("github-action-documentation-workflow.yml.ejs"),
        this.destinationPath(".github/workflows/gh-pages.yml"),
        {
          packageManager: this.options.packageManager,
          disableYarnGitCache: this.options.disableYarnGitCache,
          testing: this.options.testing,
          testRunner: this.options.testRunner,
          typedoc: this.options.documentation && this.options.typescript,
          nodeLatestMajorVersion: latestLTS,
        },
      );
    } else {
      this.fs.delete(this.destinationPath(".github/workflows/gh-pages.yml"));
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    this.fs.delete(this.destinationPath(".travis.yml"));
    this.fs.delete(this.destinationPath("circle.yml"));

    if (!this.options.enable) {
      packageUtils.removeDevDependencies(pkg, ["jest-junit-reporter"]);
    } else {
      packageUtils.removeDevDependencies(pkg, ["jest-junit-reporter"]);
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
