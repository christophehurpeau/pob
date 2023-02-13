import { fileURLToPath } from 'url';
import Generator from 'yeoman-generator';
import ensureJsonFileFormatted from '../../utils/ensureJsonFileFormatted.js';
import inLerna from '../../utils/inLerna.js';
import * as packageUtils from '../../utils/package.js';

export default class PobBaseGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts, { customInstallTask: true });

    /** @deprecated use monorepo option instead */
    this.option('lerna', {
      type: Boolean,
      required: false,
      desc: 'Lerna monorepo',
    });

    this.option('monorepo', {
      type: Boolean,
      required: false,
      desc: 'monorepo',
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
  }

  rootGeneratorName() {
    return 'pob';
  }

  initializing() {
    // prettier package.json to ensure diff is correct
    ensureJsonFileFormatted(this.destinationPath('package.json'));

    if (this.options.monorepo || this.options.lerna) {
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
    if (config && config.type && config.packageManager) {
      this.projectConfig = config;
      return;
    }

    const oldConfigStorage = this._getStorage(super.rootGeneratorName());
    config = oldConfigStorage.get('type') || oldConfigStorage.get('project');
    if (config) {
      oldConfigStorage.delete('type');
      oldConfigStorage.delete('project');
    } else {
      config = {};
    }

    if ('yarn2' in config) {
      if (config.yarn2) {
        config.yarnNodeLinker = 'node-modules';
      }
      delete config.yarn2;
    }

    const responses = await this.prompt([
      {
        when: () => !config.type,
        name: 'type',
        message: 'What kind of project is this ?',
        type: 'list',
        choices: ['lib', 'app'],
        default: (config && config.type) || this.options.type || 'lib',
      },
      {
        when: () => this.isRoot && !config.packageManager,
        name: 'packageManager',
        message: 'Witch package manager do you want to use ?',
        type: 'list',
        choices: ['yarn', 'npm'],
        default: config.packageManager || 'yarn',
      },
      {
        when: ({ packageManager = config.packageManager }) =>
          this.isRoot && packageManager === 'yarn' && !config.yarnNodeLinker,
        name: 'yarnNodeLinker',
        message: 'Witch Linker do you want to use ?',
        type: 'list',
        choices: ['node-modules', 'pnp'],
        default: config.yarnNodeLinker || 'node-modules',
      },
    ]);

    this.projectConfig = { ...config, ...responses };
    this.config.set('project', this.projectConfig);
  }

  default() {
    this.composeWith('pob:core:package', {
      updateOnly: this.options.updateOnly,
      private: this.useLerna,
      monorepo: this.useLerna,
      isRoot: this.isRoot,
    });

    if (this.useLerna) {
      this.composeWith('pob:monorepo:lerna', {
        force: this.options.force,
        isAppProject: this.projectConfig.type === 'app',
        packageManager: this.projectConfig.packageManager,
      });
    }

    this.fs.delete('Makefile');
    this.fs.delete(this.destinationPath('.commitrc.js'));

    this.composeWith('pob:core:editorconfig');

    this.composeWith('pob:core:clean', {
      root: this.isRoot,
    });

    this.composeWith('pob:core:renovate', {
      updateOnly: this.options.updateOnly,
      app: this.projectConfig.type === 'app',
    });

    this.composeWith('pob:core:yarn', {
      type: this.projectConfig.type,
      enable: this.isRoot && this.projectConfig.packageManager === 'yarn',
      yarnNodeLinker: this.projectConfig.yarnNodeLinker,
    });

    const onlyLatestLTS =
      this.projectConfig.type === 'app' ||
      (inLerna &&
        (inLerna.pobConfig?.project?.supportsNode14 === false ||
          inLerna.pobConfig?.project?.onlyLatestLTS === true));

    if (!this.inLerna) {
      const splitCIJobs =
        inLerna && inLerna.pobMonorepoConfig.packageNames.length > 8;
      this.composeWith('pob:core:git', {
        onlyLatestLTS,
        splitCIJobs,
      });
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
        pkg.name !== 'pob' && '@pob/root',
      ]);
      delete pkg.commitlint;
      delete pkg.husky;
      delete pkg['lint-staged'];
      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    }

    if (this.useLerna) {
      this.composeWith(
        // pob:monorepo <= for searching PobMonorepoGenerator.js
        fileURLToPath(
          new URL('../monorepo/PobMonorepoGenerator.js', import.meta.url),
        ),
        {
          updateOnly: this.options.updateOnly,
          isAppProject: this.projectConfig.type === 'app',
          packageManager: this.projectConfig.packageManager,
          yarnNodeLinker: this.projectConfig.yarnNodeLinker,
          onlyLatestLTS,
        },
      );
    } else {
      switch (this.projectConfig.type) {
        case 'lib':
          this.composeWith('pob:lib', {
            monorepo: this.useLerna,
            isRoot: this.isRoot,
            updateOnly: this.options.updateOnly,
            fromPob: this.options.fromPob,
            packageManager: this.projectConfig.packageManager,
            yarnNodeLinker: this.projectConfig.yarnNodeLinker,
          });
          break;
        case 'app':
          this.composeWith('pob:app', {
            monorepo: this.useLerna,
            isRoot: this.isRoot,
            updateOnly: this.options.updateOnly,
            fromPob: this.options.fromPob,
            packageManager: this.projectConfig.packageManager,
            yarnNodeLinker: this.projectConfig.yarnNodeLinker,
          });
          break;
        default:
          throw new Error(`Invalid type: ${this.options.type}`);
      }
    }
  }

  writing() {
    this.composeWith('pob:core:sort-package');
  }

  install() {
    if (this.options.fromPob) return;

    switch (this.projectConfig.packageManager) {
      case 'npm':
        this.spawnCommandSync('npm', ['install']);
        break;
      case 'yarn':
        // see CoreYarnGenerator
        break;
    }
  }

  end() {
    if (this.useLerna && !this.options.updateOnly) {
      console.log('To create a new lerna package: ');
      console.log(' pob add <packageName>');
    }
  }
}
