/* eslint-disable regexp/match-any */
/* eslint-disable regexp/no-super-linear-backtracking */
import camelCase from "lodash.camelcase";
import Generator from "yeoman-generator";
import inMonorepo from "../../../utils/inMonorepo.js";
import * as packageUtils from "../../../utils/package.js";
import { copyAndFormatTpl } from "../../../utils/writeAndFormat.js";

export default class LibReadmeGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("privatePackage", {
      type: Boolean,
      required: true,
      description: "If the project is private",
    });

    this.option("documentation", {
      type: Boolean,
      required: true,
      description: "Include documentation",
    });

    this.option("testing", {
      type: Boolean,
      required: true,
      description: "Include testing badge",
    });

    this.option("codecov", {
      type: Boolean,
      required: true,
      description: "Include codecov badge",
    });

    this.option("content", {
      type: String,
      required: false,
      description: "Readme content",
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"));

    const readmePath = this.destinationPath("README.md");
    let content = this.options.content;

    if (this.fs.exists(readmePath)) {
      const readmeFullContent = this.fs.read(readmePath);
      content = readmeFullContent.match(
        /^<h1 align="center"[^#*]+([^]+)\[npm-image\]:/,
      );
      if (!content) {
        content = readmeFullContent.match(
          /^<h1 align="center"[^#*]+([^]+)\[daviddm-image\]:/,
        );
      }
      if (!content) {
        content = readmeFullContent.match(
          /^<h3 align="center"[^#*]+([^]+)\[npm-image\]:/,
        );
      }
      if (!content) {
        content = readmeFullContent.match(
          /^<h3 align="center"[^#*]+([^]+)\[daviddm-image\]:/,
        );
      }
      if (!content) {
        content = readmeFullContent.match(/^<h1 align="center"[^#*]+([^]+)$/);
      }
      if (!content) {
        content = readmeFullContent.match(/^<h3 align="center"[^#*]+([^]+)$/);
      }
      if (!content) content = readmeFullContent.match(/^<h3[^#*]+([^]+)$/);
      if (!content) {
        content = readmeFullContent.match(/^#[^#*]+([^]+)\[npm-image\]:/);
      }
      if (!content) {
        content = readmeFullContent.match(/^#[^#*]+([^]+)\[daviddm-image\]:/);
      }
      if (!content) content = readmeFullContent.match(/^#[^#*]+([^]+)$/);
      content = content ? content[1].trim() : readmeFullContent;
    }

    const author = packageUtils.parsePkgAuthor(pkg);

    const repository = (pkg.repository && pkg.repository.url) || pkg.repository;
    const match =
      repository &&
      repository.match(
        /^(?:git@|https?:\/\/)(?:([^./:]+)(?:\.com)?[/:])?([^/:]+)\/([^./:]+)(?:.git)?/,
      );
    const [, gitHost, gitAccount, gitName] = match || [];
    try {
      copyAndFormatTpl(
        this.fs,
        this.templatePath("README.md.ejs"),
        readmePath,
        {
          title: pkg.name.replace(/-monorepo$/, ""),
          privatePackage: pkg.private,
          packageName: pkg.name,
          camelCaseProjectName: camelCase(pkg.name),
          description: pkg.description || undefined,
          inMonorepo,
          gitHost,
          gitAccount,
          gitName,
          author: {
            name: author.name,
            url: author.url,
          },
          license: pkg.license,
          codecov: this.options.codecov,
          documentation: this.options.documentation,
          documentationUrl:
            this.options.documentation && gitHost === "github"
              ? `https://${gitAccount}.github.io/${gitName}/`
              : undefined,
          testing: this.options.testing,
          content,
        },
      );
    } catch (error) {
      console.log(error.stack || error.message || error);
      throw error;
    }
  }
}
