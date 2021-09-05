import fs from 'fs';
import yarnParsers from '@yarnpkg/parsers';
import Generator from 'yeoman-generator';
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
        this.spawnCommandSync('yarn', ['set', 'version', 'berry']);
        this.spawnCommandSync('yarn', ['set', 'version', 'latest']);
      }

      const configString = this.fs.read('.yarnrc.yml');
      const config = yarnParsers.parseSyml(configString);
      config.defaultSemverRangePrefix = this.options.type === 'app' ? '' : '^';
      config.nodeLinker = this.options.yarnNodeLinker;
      writeAndFormat(this.fs, '.yarnrc.yml', yarnParsers.stringifySyml(config));
    }
  }

  writing() {
    if (this.options.enable) {
      this.fs.copyTpl(
        this.templatePath('yarn_gitignore.ejs'),
        this.destinationPath('.yarn/.gitignore'),
        {},
      );
    } else {
      this.fs.delete('.yarn');
      this.fs.delete('.yarnrc.yml');
      this.fs.delete('.yarn.lock');
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    packageUtils.removeDevDependencies(pkg, ['@yarnpkg/pnpify']);
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  end() {
    if (this.options.enable) {
      this.spawnCommandSync('yarn', ['set', 'version', 'latest']);
      if (this.options.yarnNodeLinker === 'pnp') {
        this.spawnCommandSync('yarn', ['dlx', '@yarnpkg/sdks', 'vscode']);
      } else {
        this.fs.delete('.yarn/sdks');
      }
      this.spawnCommandSync('yarn', ['prettier', '--write', '.vscode']);
      this.spawnCommandSync('yarn', ['install']);
      this.spawnCommandSync('yarn', ['dedupe']);

      const pkg = this.fs.readJSON(this.destinationPath('package.json'));

      if (pkg.scripts.preversion) {
        this.spawnCommandSync('yarn', ['run', 'preversion']);
      } else {
        if (pkg.scripts.build) {
          this.spawnCommandSync('yarn', ['run', 'build']);
        }
        if (pkg.scripts['generate:docs']) {
          this.spawnCommandSync('yarn', ['run', 'generate:docs']);
        }
      }
    }
  }
}
