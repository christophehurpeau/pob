import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";

export default class AppViteGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option("enableServer", {
      type: Boolean,
      default: false,
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    if (this.options.enableServer) {
      packageUtils.addScripts(pkg, {
        build: "yarn run build:client && yarn run build:server",
        "build:client": "vite build --outDir dist/client",
        "build:server":
          "vite build --ssr src/entry-server.tsx --outDir dist/server",
        preview: "yarn run build && yarn run start:prod",
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
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }
}
