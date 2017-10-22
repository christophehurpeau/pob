const Generator = require('yeoman-generator');
const packageUtils = require('../../utils/package');
const inLerna = require('../../utils/inLerna');

module.exports = class PobGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('type', {
      type: String,
      required: true,
      desc: 'Type of generator',
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

  async initializing() {
    if (this.options.type === 'lerna') {
      this.useLerna = true;
      this.inLerna = false;
    } else {
      this.useLerna = false;
      this.inLerna = inLerna;
    }

    this.composeWith(require.resolve('../core/package'), {
      private: this.useLerna,
    });

    if (this.useLerna) {
      this.composeWith(require.resolve('../core/lerna'));
    }
  }

  // async prompting() {
  // }

  default() {
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

    this.composeWith(require.resolve('../core/editorconfig'), {});

    if (!this.inLerna) {
      this.composeWith(require.resolve('../core/git'));
    }

    if (this.options.type === 'lib') {
      this.composeWith(require.resolve('../lib/'));
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    packageUtils.sort(pkg);
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  installing() {
    return this.yarnInstall();
  }

  end() {
    if (this.useLerna) {
      console.log('To create a new lerna package: ');
      console.log(' pob add <packageName>');
    }
  }
};

