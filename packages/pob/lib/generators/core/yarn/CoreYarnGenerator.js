import fs from 'fs';
import yml from 'js-yaml';
import Generator from 'yeoman-generator';
import ensureJsonFileFormatted from '../../../utils/ensureJsonFileFormatted.js';
import inLerna from '../../../utils/inLerna.js';
import * as packageUtils from '../../../utils/package.js';
import { writeAndFormat } from '../../../utils/writeAndFormat.js';

export default class CoreYarnGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('type', {
      type: String,
      required: false,
      defaults: 'app',
      desc: 'Project type',
    });

    this.option('enable', {
      type: Boolean,
      required: true,
      desc: 'Enable yarn',
    });

    this.option('yarnNodeLinker', {
      type: String,
      required: false,
      defaults: 'node-modules',
      desc: 'Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.',
    });
  }

  initializing() {
    if (this.options.enable) {
      // dont use this.fs here, as it will cache the result
      if (!fs.existsSync('.yarnrc.yml')) {
        // yarn 2 not yet installed
        // https://yarnpkg.com/getting-started/install
        this.spawnCommandSync('yarn', ['set', 'version', 'stable']);
      } else {
        this.spawnCommandSync('yarn', ['set', 'version', 'stable']);
        ensureJsonFileFormatted(this.destinationPath('package.json'));
      }
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (this.options.enable) {
      this.fs.copyTpl(
        this.templatePath('yarn_gitignore.ejs'),
        this.destinationPath('.yarn/.gitignore'),
        {},
      );

      const { stdout } = this.spawnCommandSync(
        'yarn',
        ['plugin', 'runtime', '--json'],
        { stdio: 'pipe' },
      );
      const installedPlugins = stdout.split('\n').map(JSON.parse);

      const isPluginInstalled = (name) =>
        installedPlugins.some((plugin) => plugin.name === name);

      const installPlugin = (nameOrUrl) => {
        this.spawnCommandSync('yarn', ['plugin', 'import', nameOrUrl]);
      };
      const removePlugin = (name) => {
        this.spawnCommandSync('yarn', ['plugin', 'remove', name]);
      };

      const postinstallDevPluginName = '@yarnpkg/plugin-postinstall-dev';
      const workspacesPluginName = '@yarnpkg/plugin-workspace-tools';

      if (!inLerna && !pkg.private) {
        if (!isPluginInstalled(postinstallDevPluginName)) {
          installPlugin(
            'https://raw.githubusercontent.com/sachinraja/yarn-plugin-postinstall-dev/main/bundles/%40yarnpkg/plugin-postinstall-dev.js',
          );
        }
      } else if (isPluginInstalled(postinstallDevPluginName)) {
        removePlugin(postinstallDevPluginName);
      }

      if (pkg.workspaces) {
        if (!isPluginInstalled(workspacesPluginName)) {
          installPlugin(workspacesPluginName);
        }
      } else if (isPluginInstalled(workspacesPluginName)) {
        removePlugin(workspacesPluginName);
      }

      // must be done after plugins installed
      const configString = this.fs.read('.yarnrc.yml');
      const config = yml.load(configString, {
        schema: yml.FAILSAFE_SCHEMA,
        json: true,
      });
      config.defaultSemverRangePrefix = this.options.type === 'app' ? '' : '^';
      config.enableMessageNames = false;
      config.nodeLinker = this.options.yarnNodeLinker;
      writeAndFormat(this.fs, '.yarnrc.yml', yml.dump(config, {}));
    } else {
      this.fs.delete('.yarn');
      this.fs.delete('.yarnrc.yml');
      this.fs.delete('.yarn.lock');
    }

    packageUtils.removeDevDependencies(pkg, ['@yarnpkg/pnpify']);
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  end() {
    this.fs.delete(this.destinationPath('.yarn/build-state.yml'));
    if (this.options.enable) {
      if (this.options.yarnNodeLinker === 'pnp') {
        this.spawnCommandSync('yarn', ['dlx', '@yarnpkg/sdks', 'vscode']);
      } else {
        this.spawnCommandSync('rm', ['-Rf', '.yarn/sdks']);
      }
      this.spawnCommandSync('yarn', ['install']);
      this.spawnCommandSync('yarn', ['dedupe']);

      this.spawnCommandSync('yarn', ['prettier', '--write', '.vscode']);

      const pkg = this.fs.readJSON(this.destinationPath('package.json'));

      if (pkg.scripts.preversion) {
        try {
          this.spawnCommandSync('yarn', ['run', 'preversion']);
        } catch {}
      } else if (pkg.scripts.build) {
        try {
          this.spawnCommandSync('yarn', ['run', 'build']);
        } catch {}
      }
    }
  }
}
