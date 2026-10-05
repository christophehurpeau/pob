import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";
import { packageManagerRun } from "../../../utils/packageManagerUtils.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

const viteConfigFileNames = [
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.ts",
  "vite.config.mts",
];

export default class AppViteGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option("enableServer", {
      type: Boolean,
      default: false,
    });

    this.option("packageManager", {
      type: String,
      default: "yarn",
    });
  }

  async writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));
    const run = (script) =>
      packageManagerRun(this.options.packageManager, script);

    packageUtils.addDevDependencies(pkg, ["vite"]);

    if (this.options.enableServer) {
      packageUtils.addScripts(pkg, {
        build: `${run("build:client")} && ${run("build:server")}`,
        "build:client": "vite build --outDir dist/client",
        "build:server":
          "vite build --ssr src/entry-server.tsx --outDir dist/server",
        preview: `${run("build")} && ${run("start:prod")}`,
        start: "node server.js",
        "start:prod": "NODE_ENV=production node server.js",
      });
    } else {
      packageUtils.addScripts(pkg, {
        "build:analyze": "ENABLE_ANALYZER=true vite build",
        build: "vite build",
        start: "vite",
        serve: "vite preview",
      });

      // a new app: the files are never overwritten
      const hasViteConfig = viteConfigFileNames.some((fileName) =>
        this.fs.exists(this.destinationPath(fileName)),
      );
      if (!hasViteConfig) {
        await copyAndFormatTpl(
          this.fs,
          this.templatePath("vite.config.js.ejs"),
          this.destinationPath("vite.config.js"),
          {},
        );
        if (!this.fs.exists(this.destinationPath("src/index.html"))) {
          await copyAndFormatTpl(
            this.fs,
            this.templatePath("index.html.ejs"),
            this.destinationPath("src/index.html"),
            { name: pkg.name },
          );
        }
        if (!this.fs.exists(this.destinationPath("src/index.ts"))) {
          await copyAndFormatTpl(
            this.fs,
            this.templatePath("index.ts.ejs"),
            this.destinationPath("src/index.ts"),
            { name: pkg.name },
          );
        }
      }
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
