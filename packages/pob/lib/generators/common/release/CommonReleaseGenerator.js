import Generator from "yeoman-generator";
import { latestLTS } from "../../../utils/nodeVersions.js";
import * as packageUtils from "../../../utils/package.js";

export default class CommonReleaseGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("enable", {
      type: Boolean,
      required: true,
      description: "If releasing is enabled",
    });

    this.option("enablePublish", {
      type: Boolean,
      required: true,
      description: "If publish on npm is enabled",
    });

    this.option("withBabel", {
      type: Boolean,
      required: false,
      default: undefined,
      description: "Babel enabled.",
    });

    this.option("withTypescript", {
      type: Boolean,
      required: false,
      default: undefined,
      description: "Typescript enabled.",
    });
    this.option("isMonorepo", {
      type: Boolean,
      default: false,
      description: "is monorepo",
    });

    this.option("ci", {
      type: Boolean,
      required: true,
      description: "ci with github actions",
    });

    this.option("disableYarnGitCache", {
      type: Boolean,
      required: false,
      default: false,
      description:
        "Disable git cache. See https://yarnpkg.com/features/caching#offline-mirror.",
    });

    this.option("updateOnly", {
      type: Boolean,
      required: false,
      default: false,
      description: "Avoid asking questions",
    });

    this.option("packageManager", {
      type: String,
      required: true,
      description: "Package manager",
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (this.options.enable && this.options.ci) {
      this.fs.delete(this.destinationPath(".github/workflows/publish.yml"));

      this.fs.copyTpl(
        this.templatePath("workflow-release.yml.ejs"),
        this.destinationPath(".github/workflows/release.yml"),
        {
          packageManager: this.options.packageManager,
          enablePublish: this.options.enablePublish,
          disableYarnGitCache: this.options.disableYarnGitCache,
          isMonorepo: this.options.isMonorepo,
          isMonorepoIndependent:
            this.options.isMonorepo &&
            (!pkg.version || pkg.version === "0.0.0"),
          nodeLatestMajorVersion: latestLTS,
        },
      );
    } else {
      this.fs.delete(this.destinationPath(".github/workflows/publish.yml"));
      this.fs.delete(this.destinationPath(".github/workflows/release.yml"));
    }

    packageUtils.removeDevDependencies(pkg, ["standard-version"]);
    packageUtils.removeScripts(pkg, [
      "release",
      pkg.name === "pob-dependencies" ? null : "preversion",
    ]);

    if (pkg.scripts.version === "pob-version") {
      delete pkg.scripts.version;
    }

    if (this.options.enable && !this.options.ci) {
      packageUtils.addScripts(pkg, {
        preversion: [
          "yarn run lint",
          this.options.withBabel ||
            (this.options.withTypescript && "yarn run build"),
          "repository-check-dirty",
        ]
          .filter(Boolean)
          .join(" && "),
      });
    }

    if (
      this.fs.exists(
        this.destinationPath(".github/workflows/release-please.yml"),
      )
    ) {
      this.fs.delete(
        this.destinationPath(".github/workflows/release-please.yml"),
      );
    }

    this.fs.delete(this.destinationPath(".release-please-manifest.json"));

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
