import Generator from "yeoman-generator";
import inMonorepo from "../../../utils/inMonorepo.js";
import * as packageUtils from "../../../utils/package.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

export default class LibDocGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("enabled", {
      type: Boolean,
      required: false,
      default: true,
      desc: "Enabled.",
    });

    this.option("testing", {
      type: Boolean,
      required: false,
      default: false,
      desc: "Coverage.",
    });

    this.option("packageManager", {
      type: String,
      default: "yarn",
      desc: "yarn or npm",
    });

    this.option("packageNames", {
      type: String,
      required: false,
      default: "{}",
    });
  }

  writing() {
    if (this.fs.exists(this.destinationPath("jsdoc.conf.json"))) {
      this.fs.delete(this.destinationPath("jsdoc.conf.json"));
    }
    if (this.fs.exists(this.destinationPath("jsdoc.conf.js"))) {
      this.fs.delete(this.destinationPath("jsdoc.conf.js"));
    }

    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (this.options.enabled) {
      const jsx =
        pkg.pob && pkg.pob.jsx !== undefined
          ? pkg.pob.jsx
          : packageUtils.hasReact(pkg);

      if (inMonorepo && inMonorepo.root) {
        const existingConfig = this.fs.readJSON(
          this.destinationPath("tsconfig.doc.json"),
          { typedocOptions: {} },
        );
        // "external-modulemap": ".*packages/([^/]+)/.*",
        const packagePaths = JSON.parse(this.options.packagePaths);

        const filteredPackages = packagePaths
          .filter((pkgPath) => !pkgPath.endsWith("-example"))
          .map((pkgPath) => {
            return {
              path: pkgPath,
              packageJSON: this.fs.readJSON(
                this.destinationPath(`${pkgPath}/package.json`),
              ),
            };
          });

        const entryPoints = [];
        for (const { path, packageJSON } of filteredPackages) {
          if (!packageJSON) {
            throw new Error(`Invalid package.json in ${path}`);
          }
          const entries = packageJSON.pob && packageJSON.pob.entries;
          if (entries) {
            // unshift:https://typedoc.org/guides/project-references/
            entryPoints.unshift(
              // `${path}/src/`,
              ...entries.map((entry) => `${path}/src/${entry}.ts`),
            );
          }
        }
        copyAndFormatTpl(
          this.fs,
          this.templatePath("tsconfig.doc.json.lerna.ejs"),
          this.destinationPath("tsconfig.doc.json"),
          {
            jsx,
            workspaces: pkg.workspaces,
            entryPoints,
            packagePaths: filteredPackages.map((p) => p.path),
            repositoryUrl: pkg.homepage, // or pkg.repository.replace(/\.git$/, '')
            packageManager: this.options.packageManager,
            readme: existingConfig.typedocOptions.readme || "README.md",
          },
        );
      } else {
        const entryPoints = ((pkg.pob && pkg.pob.entries) || []).map(
          (entryName) => `src/${entryName}.ts`,
        );
        copyAndFormatTpl(
          this.fs,
          this.templatePath("tsconfig.doc.json.ejs"),
          this.destinationPath("tsconfig.doc.json"),
          { jsx, readme: "README.md", entryPoints },
        );
      }
    } else {
      // this.fs.delete(this.destinationPath('jsdoc.conf.js'));
      if (this.fs.exists(this.destinationPath("docs"))) {
        this.fs.delete(this.destinationPath("docs"));
      }

      if (this.fs.exists(this.destinationPath("tsconfig.doc.json"))) {
        this.fs.delete(this.destinationPath("tsconfig.doc.json"));
      }
    }

    packageUtils.removeDevDependencies(pkg, [
      "jsdoc",
      "minami",
      "jaguarjs-jsdoc",
      "typedoc-plugin-lerna-packages",
      "@chrp/typedoc-plugin-lerna-packages",
    ]);

    packageUtils.addOrRemoveDevDependencies(pkg, this.options.enabled, [
      "typedoc",
    ]);

    // packageUtils.addOrRemoveDevDependencies(
    //   pkg,
    //   this.options.enabled && inMonorepo && inMonorepo.root,
    //   ['@chrp/typedoc-plugin-lerna-packages'],
    // );
    // packageUtils.addOrRemoveDependenciesMeta(
    //   pkg,
    //   this.options.enabled && inMonorepo && inMonorepo.root,
    //   {
    //     'typedoc-neo-theme': {
    //       unplugged: true,
    //     },
    //   },
    // );

    if (pkg.scripts) {
      delete pkg.scripts["generate:docs"];
    }

    if (this.options.enabled) {
      packageUtils.addScripts(pkg, {
        "generate:api": "typedoc --tsconfig tsconfig.doc.json",
      });
    } else {
      delete pkg.scripts["generate:api"];
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
