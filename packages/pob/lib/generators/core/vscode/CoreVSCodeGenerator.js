import Generator from "yeoman-generator";
import { readJSON5 } from "../../../utils/json5.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

export default class CoreVSCodeGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("root", {
      type: Boolean,
      required: false,
      default: "",
      description: "Is root",
    });

    this.option("packageManager", {
      type: String,
      required: false,
      default: "yarn",
      description: "yarn|npm|bun",
    });

    this.option("monorepo", {
      type: Boolean,
      required: false,
      default: false,
      description: "is monorepo",
    });

    this.option("testing", {
      type: Boolean,
      required: false,
      default: false,
      description: "Testing enabled",
    });

    this.option("testRunner", {
      type: String,
      required: false,
      description: "Test runner (node, vitest, ...)",
    });

    this.option("yarnNodeLinker", {
      type: String,
      required: false,
      default: "node-modules",
      description:
        "Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.",
    });

    this.option("typescript", {
      type: Boolean,
      required: false,
      default: false,
      description: "Typescript enabled",
    });

    this.option("packageNames", {
      type: String,
      required: false,
    });

    this.option("packageLocations", {
      type: String,
      required: false,
    });
  }

  async writing() {
    if (this.options.root) {
      const pkg = this.fs.readJSON(this.destinationPath("package.json"));
      // the tsdk script runs tsrs from node_modules, which pnp does not have
      const withTsrs =
        this.options.typescript && this.options.yarnNodeLinker !== "pnp";
      const tsdkPath = this.destinationPath(".vscode/tsrs-tsdk/tsgo");

      if (withTsrs) {
        // the extension runs it directly, so it must be executable
        this.fs.write(
          tsdkPath,
          this.fs.read(this.templatePath("tsrs-tsdk-tsgo")),
          {
            stat: /** @type {import("node:fs").Stats} */ ({ mode: 0o755 }),
          },
        );
      } else {
        this.fs.delete(tsdkPath);
      }

      await copyAndFormatTpl(
        this.fs,
        this.templatePath("extensions.json.ejs"),
        this.destinationPath(".vscode/extensions.json"),
        {
          yarn: this.options.packageManager === "yarn",
          pnp: this.options.yarnNodeLinker === "pnp",
          typescript: this.options.typescript,
        },
      );
      await copyAndFormatTpl(
        this.fs,
        this.templatePath("settings.json.ejs"),
        this.destinationPath(".vscode/settings.json"),
        {
          yarn: this.options.packageManager === "yarn",
          pnp: this.options.yarnNodeLinker === "pnp",
          npm: this.options.packageManager === "npm",
          bun: this.options.packageManager === "bun",
          pnpm: this.options.packageManager === "pnpm",
          typescript: this.options.typescript,
          tsrs: withTsrs,
          testing: this.options.testing,
          testRunner: this.options.testRunner,
          module: pkg.type === "module",
        },
      );

      const tasksConfig = readJSON5(
        this.fs,
        this.destinationPath(".vscode/tasks.json"),
        {},
      );
      const tasks = tasksConfig.tasks || [];

      await copyAndFormatTpl(
        this.fs,
        this.templatePath("tasks.json.ejs"),
        this.destinationPath(".vscode/tasks.json"),
        {
          typescript: this.options.typescript,
          tasks: JSON.stringify(tasks, null, 2),
        },
      );

      if (this.options.monorepo) {
        const projectName = pkg.name.replace("/", "-");
        // legacy project code-workspace
        this.fs.delete(
          this.destinationPath(`.vscode/${projectName}.code-workspace`),
        );
      }
    } else {
      this.fs.delete(".vscode");
    }
  }
}
