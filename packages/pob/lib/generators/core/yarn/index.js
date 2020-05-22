'use strict';

const fs = require('fs');
const Generator = require('yeoman-generator');
const yarnParsers = require('@yarnpkg/parsers');
const packageUtils = require('../../../utils/package');

module.exports = class YarnGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('type', {
      type: String,
      required: false,
      defaults: 'app',
      desc: 'Project type',
    });

    this.option('yarn2', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Use yarn 2',
    });
  }

  initializing() {
    if (this.options.yarn2) {
      // dont use this.fs here, as it will cache the result
      if (!fs.existsSync('.yarnrc.yml')) {
        // yarn 2 not yet installed
        // https://yarnpkg.com/getting-started/install
        this.spawnCommandSync('yarn', ['set', 'version', 'berry']);
      }

      const configString = this.fs.read('.yarnrc.yml');
      const config = yarnParsers.parseSyml(configString);
      config.defaultSemverRangePrefix = this.options.type === 'app' ? '' : '^';
      this.fs.write('.yarnrc.yml', yarnParsers.stringifySyml(config));
    } else {
      this.fs.delete('.yarn');
    }
  }

  writing() {
    if (this.options.yarn2) {
      this.fs.copyTpl(
        this.templatePath('yarn_gitignore.ejs'),
        this.destinationPath('.yarn/.gitignore'),
        {},
      );
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    packageUtils.removeDevDependencies(pkg, ['@yarnpkg/pnpify']);
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  end() {
    if (this.options.yarn2) {
      this.spawnCommandSync('yarn', ['set', 'version', 'latest']);
      this.spawnCommandSync('yarn', ['dlx', '@yarnpkg/pnpify', '--sdk']);
    }
  }
};
