'use strict';

const Generator = require('yeoman-generator');
const packageUtils = require('../../utils/package');
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
      desc: "Don't ask questions if we already have the answers",
    });

    this.option('fromPob', {
      type: Boolean,
      required: true,
      desc: "Don't run yarn or build",
    });

    this.option('force', {
      type: Boolean,
      required: true,
      desc: "Don't check diff",
    });

    this.option('license', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Include a license',
    });
  }

  initializing() {
    // prettier package.json to ensure diff is correct
    ensureJsonFileFormatted(this.destinationPath('package.json'));

    if (this.options.lerna) {
      this.useLerna = true;
      this.inLerna = false;
    } else {
      // only require if not specified in options
      // eslint-disable-next-line global-require
      const inLerna = require('../../utils/inLerna');
      this.useLerna = inLerna && inLerna.root;
      this.inLerna = inLerna && !inLerna.root;
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

  async prompting() {
    if (this.options.lerna) return;

    const config = this.config.get('project') || this.config.get('type');
    if (config) {
      this.projectConfig = config;
      return;
    }

    this.projectConfig = await this.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What kind of project is this ?',
        default: (config && config.type) || this.options.type || 'lib',
        choices: ['lib', 'app'],
      },
    ]);

    this.config.delete('project', this.projectConfig);
    this.config.set('project', this.projectConfig);
  }

  default() {
    this.fs.delete('Makefile');
    if (
      this.options.license &&
      !this.fs.exists(this.destinationPath('LICENSE'))
    ) {
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

    this.composeWith(require.resolve('../core/clean'), {
      root: !this.useLerna || !this.inLerna,
    });

    this.composeWith(require.resolve('../core/renovate'), {
      updateOnly: this.options.updateOnly,
      app: !this.options.lerna && this.projectConfig.type === 'app',
    });

    if (!this.inLerna) {
      this.composeWith(require.resolve('../core/git'));
    } else {
      if (this.fs.exists('.git-hooks')) this.fs.delete('.git-hooks');
      if (this.fs.exists('git-hooks')) this.fs.delete('git-hooks');
      if (this.fs.exists('.commitrc.js')) this.fs.delete('.commitrc.js');
      const pkg = this.fs.readJSON(this.destinationPath('package.json'));
      packageUtils.removeDevDependencies(pkg, [
        'pob-release',
        'repository-check-dirty',
        'husky',
        'yarnhook',
        'lerna',
      ]);
      delete pkg.commitlint;
      delete pkg.husky;
      delete pkg['lint-staged'];
      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    }

    if (this.useLerna) {
      this.composeWith(require.resolve('../monorepo'), {
        updateOnly: this.options.updateOnly,
      });
    } else {
      switch (this.projectConfig.type) {
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
