const fs = require('fs');
const Generator = require('yeoman-generator');
const prettier = require('prettier');
const packageUtils = require('../../utils/package');
const inLerna = require('../../utils/inLerna');

module.exports = class PobBaseGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

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
    try {
      const pkgJson = fs.readFileSync(this.destinationPath('package.json'), 'utf-8');
      const formattedPkg = prettier.format(pkgJson, { parser: 'json', printWidth: 100 });
      if (pkgJson !== formattedPkg) {
        console.warn('prettier package.json');
        fs.writeFileSync(this.destinationPath('package.json'), formattedPkg);
      }
    } catch (e) {
    }

    if (this.options.type === 'lerna') {
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
      this.composeWith(require.resolve('../core/lerna'));
    }
  }

  // async prompting() {
  // }

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

    this.composeWith(require.resolve('../core/editorconfig'));

    if (!this.inLerna) {
      this.composeWith(require.resolve('../core/git'));
    }

    switch (this.options.type) {
      case 'lib':
        this.composeWith(require.resolve('../lib/'), {
          updateOnly: this.options.updateOnly,
          fromPob: this.options.fromPob,
        });
        break;
      case 'lerna':
        // TODO create lerna generator
        this.composeWith(require.resolve('../core/ci'), {
          updateOnly: this.options.updateOnly,
        });
        break;
    }
  }

  writing() {
    this.composeWith(require.resolve('../core/sort-package'));
  }

  install() {
    if (this.options.fromPob) return;
    return this.spawnCommandSync('yarn');
  }

  end() {
    if (this.useLerna && !this.options.updateOnly) {
      console.log('To create a new lerna package: ');
      console.log(' pob add <packageName>');
    }
  }
};

