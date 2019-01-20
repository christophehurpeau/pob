const fs = require('fs');
const Generator = require('yeoman-generator');
const packageUtils = require('../../utils/package');
const inLerna = require('../../utils/inLerna');
const ensureJsonFileFormatted = require('../../utils/ensureJsonFileFormatted');

module.exports = class PobBaseGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('lerna', {
      type: Boolean,
      required: false,
      desc: 'Lerna monorepo',
    });

    this.option('type', {
      type: String,
      required: true,
      desc: 'Type of generator',
    });

    this.option('updateOnly', {
      type: Boolean,
      required: true,
      desc: 'Don\'t ask questions if we already have the answers',
    });

    this.option('fromPob', {
      type: Boolean,
      required: true,
      desc: 'Don\'t run yarn or build',
    });

    this.option('force', {
      type: Boolean,
      required: true,
      desc: 'Don\'t check diff',
    });

    this.option('license', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Include a license',
    });

    this.option('babel', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Use babel',
    });
  }

  initializing() {
    // prettier package.json to ensure diff is correct
    ensureJsonFileFormatted(this.destinationPath('package.json'));

    if (this.options.lerna) {
      this.useLerna = true;
      this.inLerna = false;
    } else {
      this.useLerna = false;
      this.inLerna = inLerna;
    }


    this.composeWith(require.resolve('../core/package'), {
      updateOnly: this.options.updateOnly,
      private: this.useLerna,
    });

    if (this.useLerna) {
      this.composeWith(require.resolve('../monorepo/lerna'), {
        force: this.options.force,
      });
    }
  }

  default() {
    this.fs.delete('Makefile');
    if (this.options.license && !this.fs.exists(this.destinationPath('LICENSE'))) {
      const pkg = this.fs.readJSON(this.destinationPath('package.json'));
      const author = packageUtils.parsePkgAuthor(pkg);
      this.composeWith(require.resolve('generator-license/app'), {
        name: author.name,
        email: author.email,
        website: author.url,
        defaultLicense: 'ISC',
      });
    }


    this.fs.delete(this.destinationPath('.commitrc.js'));

    this.composeWith(require.resolve('../core/editorconfig'));

    this.composeWith(require.resolve('../core/clean'), { root: !this.useLerna || !this.inLerna });

    if (!this.inLerna) {
      this.composeWith(require.resolve('../core/git'));
    }

    if (this.options.lerna) {
      this.composeWith(require.resolve('../monorepo'), {
        updateOnly: this.options.updateOnly,
      });
    } else {
      switch (this.options.type) {
        case 'lib':
          this.composeWith(require.resolve('../lib/'), {
            updateOnly: this.options.updateOnly,
            fromPob: this.options.fromPob,
          });
          break;
        case 'app':
          this.composeWith(require.resolve('../app/'), {
            updateOnly: this.options.updateOnly,
            fromPob: this.options.fromPob,
          });
          break;
        default:
          throw new Error(`Invalid type: ${this.options.type}`);
      }
    }
  }

  writing() {
    this.composeWith(require.resolve('../core/sort-package'));
  }

  install() {
    if (this.options.fromPob) return;
    return this.spawnCommandSync('yarn', 'install', '--prefer-offline');
  }

  end() {
    if (this.useLerna && !this.options.updateOnly) {
      console.log('To create a new lerna package: ');
      console.log(' pob add <packageName>');
    }
  }
};
