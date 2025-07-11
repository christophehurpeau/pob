import fs from "node:fs";
import { isDeepStrictEqual } from "node:util";
import sortObject from "@pob/sort-object";
import yml from "js-yaml";
import { lt } from "semver";
import Generator from "yeoman-generator";
import ensureJsonFileFormatted from "../../../utils/ensureJsonFileFormatted.js";
import inMonorepo from "../../../utils/inMonorepo.js";
import * as packageUtils from "../../../utils/package.js";
import { writeAndFormat } from "../../../utils/writeAndFormat.js";

export default class CoreYarnGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("type", {
      type: String,
      required: false,
      default: "app",
      description: "Project type",
    });

    this.option("enable", {
      type: Boolean,
      required: true,
      description: "Enable yarn",
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
    if (this.options.enable) {
      // dont use this.fs here, as it will cache the result
      if (!fs.existsSync(".yarnrc.yml")) {
        // yarn 2 not yet installed
        // https://yarnpkg.com/getting-started/install
        this.spawnSync("yarn", ["set", "version", "stable"]);
        ensureJsonFileFormatted(this.destinationPath("package.json"));
      } else {
        // disabled now that corepack is supposed to set the version used
        // this.spawnSync('yarn', ['set', 'version', 'stable']);)
      }
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (this.options.enable) {
      this.fs.copyTpl(
        this.templatePath("yarn_gitignore.ejs"),
        this.destinationPath(".yarn/.gitignore"),
        {
          disableYarnGitCache: this.options.disableYarnGitCache,
        },
      );

      const { stdout } = this.spawnSync(
        "yarn",
        ["plugin", "runtime", "--json"],
        { stdio: "pipe" },
      );
      const installedPlugins = stdout.split("\n").map(JSON.parse);

      const isPluginInstalled = (name) =>
        installedPlugins.some((plugin) => plugin.name === name);

      // const installPlugin = (nameOrUrl) => {
      //   this.spawnSync("yarn", ["plugin", "import", nameOrUrl]);
      // };
      const removePlugin = (name) => {
        this.spawnSync("yarn", ["plugin", "remove", name]);
      };

      // const installPluginIfNotInstalled = (
      //   name,
      //   nameOrUrl = name,
      //   forceInstallIfInstalled = () => false,
      // ) => {
      //   if (!isPluginInstalled(name)) {
      //     installPlugin(nameOrUrl);
      //   } else if (forceInstallIfInstalled()) {
      //     installPlugin(nameOrUrl);
      //   }
      // };

      const removePluginIfInstalled = (name) => {
        if (isPluginInstalled(name)) {
          removePlugin(name);
        }
      };

      const postinstallDevPluginName = "@yarnpkg/plugin-postinstall-dev";
      const legacyVersionPluginName = "@yarnpkg/plugin-conventional-version";

      removePluginIfInstalled(postinstallDevPluginName);
      if (!inMonorepo && !pkg.private) {
        packageUtils.addDevDependencies(pkg, ["pinst"]);
        packageUtils.addScripts(pkg, {
          prepack: "pinst --disable",
          postpack: "pinst --enable",
        });
      } else {
        if (pkg.scripts.prepack === "pinst --disable") {
          delete pkg.scripts.prepack;
        }
        if (pkg.scripts.postpack === "pinst --enable") {
          delete pkg.scripts.postpack;
        }
      }

      if (pkg.name !== "yarn-plugin-conventional-version") {
        removePluginIfInstalled(legacyVersionPluginName);
        //   installPluginIfNotInstalled(
        //     versionPluginName,
        //     "https://raw.githubusercontent.com/christophehurpeau/yarn-plugin-conventional-version/main/bundles/%40yarnpkg/plugin-conventional-version.cjs",
        //     () => {
        //       const content = fs.readFileSync(
        //         ".yarn/plugins/@yarnpkg/plugin-conventional-version.cjs",
        //         "utf8",
        //       );
        //       return !content.includes("Lifecycle script: preversion");
        //     },
        //   );
      }

      if (
        !pkg.packageManager ||
        !pkg.packageManager.startsWith("yarn@") ||
        lt(pkg.packageManager.slice("yarn@".length), "4.9.2")
      ) {
        pkg.packageManager = "yarn@4.9.2";
      }

      // must be done after plugins installed
      const configString = this.fs.read(".yarnrc.yml", { defaults: "" });
      const config =
        yml.load(configString, {
          schema: yml.FAILSAFE_SCHEMA,
          json: true,
        }) || {};
      const previousConfig = { ...config };
      if (this.options.disableYarnGitCache) {
        // leave default compressionLevel instead of this next line
        delete config.compressionLevel;
        // config.compressionLevel = "mixed"; // optimized for size
        config.enableGlobalCache = "true";
        delete config.supportedArchitectures;
      } else {
        config.compressionLevel = 0; // optimized for github config
        config.enableGlobalCache = "false";
        // https://yarnpkg.dev/releases/3-1/
        // make sure all supported architectures are in yarn cache
        config.supportedArchitectures = {
          cpu: ["x64", "arm64"],
          os: ["linux", "darwin"],
          libc: ["glibc", "musl"],
        };
      }
      config.defaultSemverRangePrefix = this.options.type === "app" ? "" : "^";
      delete config.enableMessageNames; // was a config for yarn < 4
      config.nodeLinker = this.options.yarnNodeLinker;

      if (config.yarnPath) {
        this.fs.delete(config.yarnPath);
        delete config.yarnPath;
      }

      if (!isDeepStrictEqual(config, previousConfig)) {
        writeAndFormat(
          this.fs,
          ".yarnrc.yml",
          yml.dump(sortObject(config), {
            lineWidth: 9999,
          }),
        );
      }
    } else {
      if (pkg.packageManager?.startsWith("yarn@")) {
        delete pkg.packageManager;
      }
      this.fs.delete(".yarn");
      this.fs.delete(".yarnrc.yml");
      this.fs.delete("yarn.lock");
    }

    packageUtils.removeDevDependencies(pkg, ["@yarnpkg/pnpify"]);
    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  end() {
    this.fs.delete(this.destinationPath(".yarn/build-state.yml"));
    if (this.options.enable) {
      if (this.options.yarnNodeLinker === "pnp") {
        this.spawnSync("yarn", ["dlx", "@yarnpkg/sdks", "vscode"]);
      } else {
        this.fs.delete(".yarn/sdks");
      }
      if (this.options.disableYarnGitCache) {
        try {
          this.spawnSync("rm", ["-rf", ".yarn/cache"]);
        } catch {}
      }
      this.spawnSync("yarn", ["install"], {
        env: {
          YARN_ENABLE_IMMUTABLE_INSTALLS: "false",
        },
      });
      this.fs.delete("package-lock.json");
      this.spawnSync("yarn", ["dedupe"]);

      this.spawnSync("yarn", ["prettier", "--write", ".vscode", ".yarnrc.yml"]);

      const pkg = this.fs.readJSON(this.destinationPath("package.json"));

      if (pkg.scripts.preversion) {
        try {
          this.spawnSync("yarn", ["run", "preversion"]);
        } catch {}
      } else if (pkg.scripts.build) {
        try {
          this.spawnSync("yarn", ["run", "build"]);
        } catch {}
      }
    }
  }
}
