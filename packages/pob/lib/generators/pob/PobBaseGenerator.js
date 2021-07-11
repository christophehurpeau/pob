import fs from 'fs';
import Generator from 'yeoman-generator';
import ensureJsonFileFormatted from '../../utils/ensureJsonFileFormatted.js';
import inLerna from '../../utils/inLerna.js';
import * as packageUtils from '../../utils/package.js';

export default class PobBaseGenerator extends Generator {
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

  rootGeneratorName() {
    return 'pob';
  }

  initializing() {
    // prettier package.json to ensure diff is correct
    ensureJsonFileFormatted(this.destinationPath('package.json'));

    if (this.options.lerna) {
      this.useLerna = true;
      this.inLerna = false;
      this.isRoot = true;
    } else {
      this.useLerna = inLerna && inLerna.root;
      this.inLerna = inLerna && !inLerna.root;
      this.isRoot = !inLerna || this.useLerna;
    }
  }

  async prompting() {
    let config = this.config.get('project');
    if (config && config.type) {
      this.projectConfig = config;
      return;
    }

    const oldConfigStorage = this._getStorage(super.rootGeneratorName());
    config = oldConfigStorage.get('type') || oldConfigStorage.get('project');
    if (config) {
      oldConfigStorage.delete('type');
      oldConfigStorage.delete('project');
    }
    this.projectConfig = await this.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What kind of project is this ?',
        default: (config && config.type) || this.options.type || 'lib',
        choices: ['lib', 'app'],
      },
      {
        type: 'confirm',
        name: 'yarn2',
        message: 'Use yarn 2 ?',
        when: () => this.isRoot,
        default:
          config && config.yarn2 !== undefined
            ? config.yarn2
            : fs.existsSync('.yarnrc.yml'),
      },
    ]);

    this.config.set('project', this.projectConfig);
  }

  default() {
    this.composeWith('pob:core:package', {
      updateOnly: this.options.updateOnly,
      private: this.useLerna,
    });

    if (this.useLerna) {
      this.composeWith('pob:monorepo:lerna', {
        force: this.options.force,
        isAppProject: this.projectConfig.type === 'app',
        useYarn2: this.projectConfig.yarn2,
      });
    }

    this.fs.delete('Makefile');
    this.fs.delete(this.destinationPath('.commitrc.js'));

    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    if (
      this.options.license &&
      !this.fs.exists(this.destinationPath('LICENSE'))
    ) {
      const author = packageUtils.parsePkgAuthor(pkg) || {};
      this.composeWith('generator-license/app', {
        name: author.name,
        email: author.email,
        website: author.url,
        defaultLicense: 'ISC',
      });
    }

    this.composeWith('pob:core:editorconfig');

    this.composeWith('pob:core:clean', {
      root: this.isRoot,
    });

    this.composeWith('pob:core:renovate', {
      updateOnly: this.options.updateOnly,
      app: this.projectConfig.type === 'app',
    });

    this.npm = this.fs.exists('package-lock.json');

    this.composeWith('pob:core:vscode', {
      root: this.isRoot,
      yarn2: this.projectConfig.yarn2,
      npm: this.npm,
      typescript: !!(pkg.devDependencies && pkg.devDependencies.typescript),
    });

    if (this.isRoot && !this.npm) {
      this.composeWith('pob:core:yarn', {
        type: this.projectConfig.type,
        yarn2: this.projectConfig.yarn2,
      });
    }

    if (!this.inLerna) {
      this.composeWith('pob:core:git');
    } else {
      if (this.fs.exists('.git-hooks')) this.fs.delete('.git-hooks');
      if (this.fs.exists('git-hooks')) this.fs.delete('git-hooks');
      if (this.fs.exists('.commitrc.js')) this.fs.delete('.commitrc.js');
      const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
      packageUtils.removeDevDependencies(pkg, [
        'standard-version',
        'repository-check-dirty',
        'husky',
        'yarnhook',
        'lerna',
        '@pob/lerna-light',
      ]);
      delete pkg.commitlint;
      delete pkg.husky;
      delete pkg['lint-staged'];
      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    }

    if (this.useLerna) {
      this.composeWith('pob:monorepo', {
        updateOnly: this.options.updateOnly,
        isAppProject: this.projectConfig.type === 'app',
        useYarn2: this.projectConfig.yarn2,
      });
    } else {
      switch (this.projectConfig.type) {
        case 'lib':
          this.composeWith('pob:lib', {
            updateOnly: this.options.updateOnly,
            fromPob: this.options.fromPob,
            useYarn2: this.projectConfig.yarn2,
          });
          break;
        case 'app':
          this.composeWith('pob:app', {
            updateOnly: this.options.updateOnly,
            fromPob: this.options.fromPob,
            useYarn2: this.projectConfig.yarn2,
          });
          break;
        default:
          throw new Error(`Invalid type: ${this.options.type}`);
      }
    }

    this.composeWith('pob:core:npm');
  }

  writing() {
    this.composeWith('pob:core:sort-package');
  }

  install() {
    if (this.options.fromPob) return;
    if (this.npm) {
      this.spawnCommandSync('npm', ['install']);
    } else {
      this.spawnCommandSync('yarn', ['install']);
      if (this.projectConfig.yarn2) {
        this.spawnCommandSync('yarn', ['dedupe']);
      } else if (!inLerna || inLerna.root) {
        this.spawnCommandSync('yarn', ['yarn-deduplicate', '-s', 'fewer']);
        this.spawnCommandSync('yarn', ['yarn-deduplicate']);
        this.spawnCommandSync('yarn', ['install']);
      }
    }
  }

  end() {
    if (this.useLerna && !this.options.updateOnly) {
      console.log('To create a new lerna package: ');
      console.log(' pob add <packageName>');
    }
  }
}
