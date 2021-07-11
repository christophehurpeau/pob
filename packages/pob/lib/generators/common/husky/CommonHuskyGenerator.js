import { execSync } from 'child_process';
import { readlinkSync } from 'fs';
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
    execSync('rm -Rf git-hooks/');

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
    this.fs.delete('.git-hooks');

    this.fs.delete(this.destinationPath('.huskyrc.js'));
    this.fs.delete(this.destinationPath('husky.config.js'));
    this.fs.delete(this.destinationPath('lint-staged.config.js'));

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

        this.fs.copy(
          this.templatePath('lint-staged.config.mjs.txt'),
          this.destinationPath('lint-staged.config.mjs'),
        );
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
        '@pob/root',
        '@pob/commitlint-config',
      ]);
      if (this.fs.exists(this.destinationPath('lint-staged.config.js'))) {
        this.fs.delete(this.destinationPath('lint-staged.config.js'));
      }

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
