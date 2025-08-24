import Generator from "yeoman-generator";
import { latestLTS, maintenanceLTS } from "../../../utils/nodeVersions.js";
import * as packageUtils from "../../../utils/package.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

/** @deprecated */
export default class CommonBabelGenerator extends Generator {
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

  initializing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (
      pkg.pob &&
      (pkg.pob.babelEnvs ||
        (pkg.pob.envs &&
          ((!pkg.pob.bundler && pkg.pob.typescript !== true) ||
            pkg.pob.bundler === "rollup-babel")))
    ) {
      const babelEnvs = pkg.pob.babelEnvs || pkg.pob.envs;
      delete pkg.pob.babelEnvs;
      pkg.pob.bundler = "rollup-babel";
      pkg.pob.envs = babelEnvs;
      this.fs.writeJSON(this.destinationPath("package.json"), pkg);
    }
  }

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    const hasInitialPkgPob = !!pkg.pob;
    if (!hasInitialPkgPob) pkg.pob = {};

    const babelEnvs =
      pkg.pob.babelEnvs ||
      ((!pkg.pob.bundler && pkg.pob.typescript !== true) ||
      pkg.pob.bundler === "rollup-babel"
        ? pkg.pob.envs
        : []) ||
      [];

    const targets = [
      babelEnvs.some((env) => env.target === "node") ? "node" : undefined,
      babelEnvs.some((env) => env.target === "browser") ? "browser" : undefined,
    ].filter(Boolean);
    const nodeVersions = [
      ...new Set(
        babelEnvs
          .filter((env) => env.target === "node")
          .map((env) => {
            if (
              env.version === "14" ||
              env.version === "16" ||
              env.version === "18" ||
              env.version === "20" ||
              env.version === "22" ||
              (this.options.onlyLatestLTS &&
                maintenanceLTS !== latestLTS &&
                env.version === `${maintenanceLTS}`)
            ) {
              return this.options.onlyLatestLTS
                ? `${latestLTS}`
                : `${maintenanceLTS}`;
            }
            return env.version;
          }),
      ),
    ];
    const browserVersions = babelEnvs
      .filter((env) => env.target === "browser")
      .map((env) => (env.version === undefined ? "supported" : env.version));
    const formats = [
      babelEnvs.some((env) => env.formats?.includes("cjs")) ? "cjs" : undefined,
      babelEnvs.some((env) => !env.formats || env.formats.includes("es"))
        ? "es"
        : undefined,
    ].filter(Boolean);
    const jsx =
      (pkg.pob.jsx || pkg.pob.withReact) === undefined
        ? packageUtils.hasReact(pkg)
        : pkg.pob.jsx || pkg.pob.withReact;

    let babelConfig = { targets, nodeVersions, browserVersions, formats, jsx };

    if (!hasInitialPkgPob || !this.options.updateOnly) {
      babelConfig = await this.prompt([
        {
          type: "checkbox",
          name: "targets",
          message:
            "Babel targets: (don't select anything if you don't want babel)",
          default: targets,
          choices: [
            {
              name: "Node",
              value: "node",
            },
            {
              name: "Browser",
              value: "browser",
            },
          ],
        },

        {
          type: "checkbox",
          name: "nodeVersions",
          message: "Babel node versions: (https://github.com/nodejs/Release)",
          when: ({ targets = [] }) => targets.includes("node"),
          validate: (versions) => versions.length > 0,
          default: nodeVersions,
          choices: [
            {
              name: `${latestLTS} (Active LTS)`,
              value: `${latestLTS}`,
            },
            latestLTS !== maintenanceLTS && {
              name: `${maintenanceLTS} (Maintenance LTS)`,
              value: `${maintenanceLTS}`,
            },
          ].filter(Boolean),
        },

        // {
        //   type: 'checkbox',
        //   name: 'browserVersions',
        //   message: 'Babel browser versions',
        //   when: ({ targets = [] }) => targets.includes('browser'),
        //   validate: (versions) => versions.length > 0,
        //   default: browserVersions,
        //   choices: [
        //     {
        //       name: 'Modern',
        //       value: 'modern',
        //     },
        //     {
        //       name: 'Supported',
        //       value: 'supported',
        //     },
        //   ],
        // },

        {
          type: "confirm",
          name: "jsx",
          message: "Enable JSX ?",
          when: ({ targets = [] }) => targets.length > 0,
          default: jsx,
        },
      ]);
    }

    if (babelConfig.targets.includes("browser")) {
      babelConfig.browserVersions = ["supported"];
    }

    const newBabelEnvs = [
      ...(babelConfig.nodeVersions || []).map((version) => ({
        target: "node",
        version,
        formats:
          babelConfig.formats && babelConfig.formats.includes("cjs")
            ? // eslint-disable-next-line unicorn/no-nested-ternary
              version === `${latestLTS}` || version === `${maintenanceLTS}`
              ? babelConfig.formats
              : undefined
            : undefined,
        omitVersionInFileName:
          // todo add `|| babelConfig.nodeVersions.length === 1` in next major
          version === `${latestLTS}` && this.options.onlyLatestLTS
            ? true
            : undefined,
      })),
      ...(babelConfig.browserVersions || []).map((version) => ({
        target: "browser",
        version: version === "supported" ? undefined : version,
        formats:
          babelConfig.formats && babelConfig.formats.includes("cjs")
            ? // eslint-disable-next-line unicorn/no-nested-ternary
              version === "supported"
              ? babelConfig.formats
              : undefined
            : undefined,
      })),
    ];

    if (newBabelEnvs.length === 0) {
      if (
        (!pkg.pob.bundler && pkg.pob.typescript !== true) ||
        pkg.pob.bundler === "rollup-babel"
      ) {
        delete pkg.pob.babelEnvs;
        if (!pkg.pob.typescript) {
          delete pkg.pob.envs;
          delete pkg.pob.entries;
          delete pkg.pob.jsx;
        }
      }
    } else {
      pkg.pob.bundler = "rollup-babel";
      pkg.pob.envs = newBabelEnvs;
      pkg.pob.entries = pkg.pob.entries || ["index"];
      if (pkg.pob.jsx) {
        pkg.pob.jsx = jsx;
      } else {
        delete pkg.pob.jsx;
      }
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  configuring() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    this.entries = pkg.pob.entries;
    this.babelEnvs =
      pkg.pob.babelEnvs ||
      (((!pkg.pob.bundler && pkg.pob.typescript !== true) ||
        pkg.pob.bundler === "rollup-babel") &&
        pkg.pob.envs) ||
      [];

    if (this.entries) {
      this.entries.forEach((entry) => {
        const entryDestPath = this.destinationPath(`${entry}.js`);
        // TODO check nightingale before uncomment this
        // if (this.options.isApp && entry !== 'index') {
        //   this.fs.write(
        //     entryDestPath,
        //     `// resolution for eslint-plugin-import\nexport * from './src/${entry}/index.ts';\n`,
        //   );
        // } else {
        this.fs.delete(entryDestPath);
        // }
      });
    }
    //
    // const indexSrcDestPath = this.destinationPath('src/index.js');
    // if (!this.fs.exists(indexSrcDestPath)
    // && !this.fs.exists(this.destinationPath('src/index.jsx'))
    // && !this.fs.exists(this.destinationPath('src/index.ts'))
    // && !this.fs.exists(this.destinationPath('src/index.tsx'))) {
    //   this.fs.copy(this.templatePath('src/index.ts'), indexSrcDestPath);
    // }
  }

  default() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    const useBabel = this.babelEnvs && this.babelEnvs.length > 0;
    const hasTargetBrowser = this.babelEnvs.find(
      (env) => env.target === "browser",
    );

    /* dependencies */

    if (
      useBabel ||
      (pkg.peerDependencies && pkg.peerDependencies["@babel/core"])
    ) {
      packageUtils.addDevDependencies(pkg, ["@babel/core"]);
    } else if (pkg.dependencies && pkg.dependencies["pob-babel"] && !useBabel) {
      packageUtils.removeDevDependencies(pkg, ["@babel/core"]);
    }
    if (!useBabel && pkg.devDependencies && pkg.devDependencies["pob-babel"]) {
      packageUtils.removeDevDependencies(pkg, ["pob-babel", "@babel/core"]);
      packageUtils.removeDependencies(pkg, ["@babel/runtime"]);
    } else {
      packageUtils.addOrRemoveDevDependencies(pkg, useBabel, ["pob-babel"]);
    }

    if (pkg.dependencies && pkg.dependencies["pob-babel"]) {
      // update pob-babel in alp-dev
      packageUtils.addDependencies(pkg, ["pob-babel"], "^");
    }
    if (pkg.dependencies && pkg.dependencies["@babel/runtime"]) {
      // update pob-babel in alp-dev
      packageUtils.addDependencies(pkg, ["@babel/runtime"], "^");
    }

    const isLibraryRollupPlugin = pkg.name.includes("rollup-plugin");

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      (useBabel && pkg.pob.jsx) ||
        (pkg.devDependencies?.["@babel/preset-react"] &&
          (isLibraryRollupPlugin || pkg.name === "alouette-icons")),
      ["@babel/preset-react"],
    );

    packageUtils.removeDevDependencies(pkg, [
      "babel-preset-env", // now @babel/preset-env
      "babel-preset-jsdoc",
      "babel-plugin-add-jsdoc-annotations",
      "babel-preset-modern-browsers",
    ]);

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(
        (env) => env.target === "browser" && env.version === undefined,
      ) ||
        (pkg.devDependencies?.["@babel/preset-env"] && isLibraryRollupPlugin),
      ["@babel/preset-env"],
    );

    /* browserslist */

    if (hasTargetBrowser) {
      if (pkg.browserslist && pkg.browserslist.modern) {
        delete pkg.browserslist.modern;
      }
      pkg.browserslist = {
        ...(Array.isArray(pkg.browserslist) ? {} : pkg.browserslist),
        production: [
          "defaults",
          "> 0.2%",
          "not ie < 12",
          "not safari < 10",
          "not ios_saf < 10",
        ],
        // configured in babel preset
        // modern: ['defaults and >1% and supports es6-module'],
      };
    } else if (
      this.options.isApp &&
      !this.options.isAppLibrary &&
      pkg.browserslist
    ) {
      pkg.browserslist = {
        ...pkg.browserslist,
        production: [
          "defaults",
          "> 0.2%",
          "not ie < 12",
          "not safari < 10",
          "not ios_saf < 10",
        ],
      };
    } else {
      delete pkg.browserslist;
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  writing() {
    this.fs.delete("types.js");

    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    const useBabel = this.babelEnvs && this.babelEnvs.length > 0;
    const entries = pkg.pob.entries || ["index"];

    /* pob-babel config */

    packageUtils.removeDevDependencies(pkg, ["@rollup/plugin-run"]);
    // packageUtils.removeDependencies(pkg, ["alp-rollup-plugin-config"]); see TranspilerGenerator

    this.fs.delete("rollup.config.js");
    if (useBabel) {
      if (this.options.isApp) {
        copyAndFormatTpl(
          this.fs,
          this.templatePath("app.rollup.config.mjs.ejs"),
          this.destinationPath("rollup.config.mjs"),
          {
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
            outDirectory: this.options.buildDirectory,
          },
        );
      }
    } else if (pkg.pob.typescript !== true && pkg.pob.rollup !== false) {
      this.fs.delete("rollup.config.mjs");
    }

    /* jest babel config */

    this.fs.delete(".babelrc");
    this.fs.delete("babel.config.json");
    this.fs.delete("babel.config.mjs");
    if (this.fs.exists(this.destinationPath("babel.config.js"))) {
      this.fs.move(
        this.destinationPath("babel.config.js"),
        this.destinationPath("babel.config.cjs"),
      );
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
