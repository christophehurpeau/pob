const Generator = require('yeoman-generator');
const askName = require('inquirer-npm-name');
const kebabCase = require('lodash.kebabcase');
const path = require('path');
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
    console.log('package: initializing');
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (!this.options.updateOnly) {
      if (this.options.private) {
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

    if (!pkg.name) {
      const prompt = {
        name: 'name',
        message: 'Module Name',
        default: path.basename(process.cwd()),
        filter: kebabCase,
        validate: str => str.length > 0,
      };

      const { name } = await (pkg.private
        ? this.prompt([prompt])
        : askName(prompt, this));
      pkg.name = name;
    }

    let author = packageUtils.parsePkgAuthor(pkg);

    const props = await this.prompt([
      !this.options.updateOnly && {
        name: 'description',
        message: 'Description',
        default: pkg.description,
      },
      {
        name: 'authorName',
        message: "Author's Name",
        when: !author || !author.name,
        default: this.user.git.name(),
        store: true,
      },
      {
        name: 'authorEmail',
        message: "Author's Email",
        when: !author || !author.email,
        default: this.user.git.email(),
        store: true,
      },
      {
        name: 'authorUrl',
        message: "Author's Homepage",
        when: !author || !author.url,
        store: true,
      },
    ].filter(Boolean));

    pkg.description = this.options.updateOnly ? pkg.description : props.description;

    if (inLerna) {
      const lernaPackage = this.fs.readJSON(path.resolve(path.dirname(inLerna), 'package.json'));
      pkg.repository = lernaPackage.repository;
      pkg.homepage = lernaPackage.homepage;
    }

    author = {
      name: props.authorName || author.name,
      email: props.authorEmail || author.email,
      url: props.authorUrl || (author && author.url),
    };

    Object.assign(pkg, {
      version: '0.0.0',
      author: `${author.name} <${author.email}>${author.url ? ` (${author.url})` : ''}`,
      keywords: [],
    }, Object.assign({}, pkg));

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
