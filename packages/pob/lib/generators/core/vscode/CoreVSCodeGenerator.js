import { fileURLToPath } from "node:url";
import Generator from "yeoman-generator";
import { readJSON5 } from "../../../utils/json5.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

export default class CoreVSCodeGenerator extends Generator {
  static path = fileURLToPath(import.meta.url);

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
      description: "yarn|npm.",
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
      description: "Test runner (jest, vitest, ...)",
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

  writing() {
    if (this.options.root) {
      const pkg = this.fs.readJSON(this.destinationPath("package.json"));
      copyAndFormatTpl(
        this.fs,
        this.templatePath("extensions.json.ejs"),
        this.destinationPath(".vscode/extensions.json"),
        {
          yarn: this.options.packageManager === "yarn",
          pnp: this.options.yarnNodeLinker === "pnp",
        },
      );
      copyAndFormatTpl(
        this.fs,
        this.templatePath("settings.json.ejs"),
        this.destinationPath(".vscode/settings.json"),
        {
          yarn: this.options.packageManager === "yarn",
          pnp: this.options.yarnNodeLinker === "pnp",
          npm: this.options.packageManager === "npm",
          typescript: this.options.typescript,
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

      copyAndFormatTpl(
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
