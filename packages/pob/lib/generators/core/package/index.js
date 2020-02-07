'use strict';

const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const askName = require('inquirer-npm-name');
const packageUtils = require('../../../utils/package');
const inLerna = require('../../../utils/inLerna');

module.exports = class PackageGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('private', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'private package',
    });
  }

  async initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (!this.options.updateOnly) {
      if (this.options.private || (inLerna && inLerna.root)) {
        pkg.private = true;
      } else {
        const { isPrivate } = await this.prompt({
          type: 'confirm',
          name: 'isPrivate',
          message: 'Private package ?',
          default: pkg.private === true,
        });
        if (isPrivate) {
          pkg.private = isPrivate;
        } else {
          delete pkg.private;
        }
      }
    }

    if (inLerna && inLerna.root) {
      if (!pkg.name) {
        const { name } = await this.prompt({
          name: 'name',
          message: 'Monorepo Name',
          default: path.basename(process.cwd()),
          validate: (str) => str.length > 0,
        });
        pkg.name = name;
      } else if (pkg.name.endsWith('-lerna')) {
        pkg.name = pkg.name.replace('-lerna', '-monorepo');
      }
    } else if (!pkg.name) {
      const prompt = {
        name: 'name',
        message: 'Module Name',
        default: path.basename(process.cwd()),
        validate: (str) => str.length > 0,
      };

      const { name } = await (pkg.private
        ? this.prompt([prompt])
        : askName(prompt, this));
      pkg.name = name;
    }

    let author = packageUtils.parsePkgAuthor(pkg);

    const props = await this.prompt(
      [
        !this.options.updateOnly &&
          !(inLerna && inLerna.root) && {
            name: 'description',
            message: 'Description',
            default: pkg.description,
          },
        {
          name: 'authorName',
          message: "Author's Name",
          when: !author || !author.name,
          default: this.user.git.name(),
        },
        {
          name: 'authorEmail',
          message: "Author's Email",
          when: !author || !author.email,
          default: this.user.git.email(),
        },
        {
          name: 'authorUrl',
          message: "Author's Homepage",
          when: !author || !author.url,
        },
      ].filter(Boolean)
    );

    pkg.description = this.options.updateOnly
      ? pkg.description
      : props.description || pkg.description;

    if (inLerna && !inLerna.root) {
      const lernaPackage = this.fs.readJSON(inLerna.packageJsonPath);
      const rootRepositoryUrl =
        typeof lernaPackage.repository === 'string'
          ? lernaPackage.repository
          : lernaPackage.repository.url;
      pkg.repository = {
        type: 'git',
        url: rootRepositoryUrl,
        directory: process.cwd().slice(inLerna.rootPath.length + 1),
      };
      pkg.homepage = lernaPackage.homepage;

      if (this.fs.exists(this.destinationPath('yarn.lock'))) {
        fs.unlinkSync(this.destinationPath('yarn.lock'));
      }
    }
    if (this.fs.exists(this.destinationPath('yarn-error.log'))) {
      fs.unlinkSync(this.destinationPath('yarn-error.log'));
    }

    author = {
      name: props.authorName || author.name,
      email: props.authorEmail || author.email,
      url: props.authorUrl || (author && author.url),
    };

    pkg.author = `${author.name} <${author.email}>${
      author.url ? ` (${author.url})` : ''
    }`;

    if (pkg.private) {
      if (!pkg.description) delete pkg.description;
      if (!pkg.keywords || pkg.keywords.length === 0) delete pkg.keywords;
    } else if (!pkg.keywords) {
      pkg.keywords = [];
    }

    if (!pkg.private && !pkg.version) {
      // lerna root pkg should not have version
      pkg.version = '0.0.0';
    }

    if (!pkg.private && !pkg.publishConfig && pkg.name[0] === '@') {
      pkg.publishConfig = {
        access: 'public',
      };
    }

    if (pkg.name !== 'pob-monorepo' && (!inLerna || inLerna.root)) {
      packageUtils.addDevDependencies(pkg, ['@pob/version']);
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (!pkg.private) {
      const babelEnvs = pkg.pob.babelEnvs || [];
      const withBabel = !!babelEnvs.length;

      this.fs.copyTpl(
        this.templatePath('npmignore.ejs'),
        this.destinationPath('.npmignore'),
        {
          inLerna,
          babel: withBabel,
          typedoc: pkg.devDependencies && pkg.devDependencies.typedoc,
        }
      );
    } else if (this.fs.exists(this.destinationPath('.npmignore'))) {
      this.fs.delete(this.destinationPath('.npmignore'));
    }
  }
};
