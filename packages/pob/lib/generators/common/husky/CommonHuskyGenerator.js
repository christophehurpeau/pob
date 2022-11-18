import { readlinkSync, rmSync } from 'fs';
import Generator from 'yeoman-generator';
import inLerna from '../../../utils/inLerna.js';
import * as packageUtils from '../../../utils/package.js';

export default class CommonHuskyGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('destination', {
      type: String,
      required: false,
      defaults: '',
      desc: 'Destination of the generated files.',
    });
  }

  writing() {
    rmSync('git-hooks', { recursive: true, force: true });

    const gitHookDestination = this.destinationPath('.git/hooks/pre-commit');
    let isSymlink;

    try {
      readlinkSync(gitHookDestination);
      isSymlink = true;
    } catch {
      isSymlink = false;
    }

    if (isSymlink) {
      this.fs.delete('.git/hooks/prepare-commit-msg');
      this.fs.delete('.git/hooks/post-checkout');
      this.fs.delete('.git/hooks/post-merge');
      this.fs.delete('.git/hooks/pre-commit');
    }

    this.fs.delete('.git-hooks/prepare-commit-msg');
    this.fs.delete('.git-hooks/post-checkout');
    this.fs.delete('.git-hooks/post-merge');
    this.fs.delete('.git-hooks/pre-commit');
    if (this.fs.exists('.git-hooks')) this.fs.delete('.git-hooks');

    if (this.fs.exists(this.destinationPath('.huskyrc.js'))) {
      this.fs.delete(this.destinationPath('.huskyrc.js'));
    }
    if (this.fs.exists(this.destinationPath('husky.config.js'))) {
      this.fs.delete(this.destinationPath('husky.config.js'));
    }

    if (this.fs.exists(this.destinationPath('lint-staged.config.cjs'))) {
      this.fs.move(
        this.destinationPath('lint-staged.config.cjs'),
        this.destinationPath('lint-staged.config.js'),
      );
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    packageUtils.removeDevDependencies(pkg, ['husky']);

    if (!inLerna || inLerna.root) {
      if (pkg.name !== 'pob-monorepo') {
        packageUtils.removeDevDependencies(pkg, [
          '@pob/repo-config',
          'repository-check-dirty',
        ]);
        packageUtils.addDevDependencies(pkg, ['@pob/root']);
        // packageUtils.addOrRemoveDevDependencies(pkg, inLerna, {
        //   '@commitlint/config-lerna-scopes': '6.1.3',
        // });

        if (pkg.type !== 'module') {
          this.fs.copy(
            this.templatePath('lint-staged.config.cjs.txt'),
            this.destinationPath('lint-staged.config.js'),
          );
        } else {
          this.fs.copy(
            this.templatePath('lint-staged.config.js.txt'),
            this.destinationPath('lint-staged.config.js'),
          );
        }
      }

      pkg.commitlint = {
        extends: [
          '@pob/commitlint-config',
          // '@commitlint/config-lerna-scopes',
        ].filter(Boolean),
      };

      if (pkg.name !== 'pob-monorepo') {
        packageUtils.addDevDependencies(pkg, ['@pob/commitlint-config']);
      }

      // if (packageUtils.hasLerna(pkg)) {
      //   packageUtils.addScripts(pkg, {
      //  'postinstall': 'repository-check-dirty && lerna bootstrap'
      // });
      // }

      // this.fs.delete('.git/hooks/husky.sh');
      // this.fs.delete('.git/hooks/husky.local.sh');
    } else {
      packageUtils.removeDevDependencies(pkg, [
        pkg.name !== 'pob' && '@pob/root',
        '@pob/commitlint-config',
      ]);
      this.fs.delete(this.destinationPath('lint-staged.config.cjs'));

      delete pkg.commitlint;
    }

    if (pkg.scripts) {
      delete pkg.scripts.commitmsg;
      delete pkg.scripts.precommit;
      delete pkg.scripts.prepublish;
      delete pkg.scripts.prepare;
      delete pkg.scripts.preparecommitmsg;
      delete pkg.scripts.postcheckout;
      delete pkg.scripts.postmerge;
      delete pkg.scripts.postrewrite;
      delete pkg.scripts.postpublish;
    }
    delete pkg['lint-staged'];
    delete pkg.husky;

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  end() {}

  // end() {
  //   this.spawnCommandSync(
  //     'node',
  //     ['node_modules/husky/lib/installer/bin.js', 'install'],
  //   );
  // }
}
