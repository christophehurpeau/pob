'use strict';

const { readlinkSync } = require('fs');
const { execSync } = require('child_process');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class GitHooksGenerator extends Generator {
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
    } catch (err) {
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

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.addDevDependencies(pkg, ['husky']);
    if (pkg.name !== 'pob-monorepo') {
      packageUtils.removeDevDependencies(pkg, [
        '@pob/repo-config',
        'repository-check-dirty',
      ]);
      packageUtils.addDevDependencies(pkg, ['@pob/root']);
      // packageUtils.addOrRemoveDevDependencies(pkg, inLerna, {
      //   '@commitlint/config-lerna-scopes': '6.1.3',
      // });

      if (this.fs.exists(this.destinationPath('.huskyrc.js'))) {
        this.fs.delete(this.destinationPath('.huskyrc.js'));
      }
      this.fs.copy(
        this.templatePath('husky.config.js.txt'),
        this.destinationPath('husky.config.js'),
      );

      this.fs.copy(
        this.templatePath('lint-staged.config.js.txt'),
        this.destinationPath('lint-staged.config.js'),
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

    delete pkg.scripts.commitmsg;
    delete pkg.scripts.precommit;
    delete pkg.scripts.prepublish;
    delete pkg.scripts.prepare;
    delete pkg.scripts.preparecommitmsg;
    delete pkg.scripts.postcheckout;
    delete pkg.scripts.postmerge;
    delete pkg.scripts.postrewrite;
    delete pkg.scripts.postpublish;
    delete pkg['lint-staged'];
    delete pkg.husky;

    // if (packageUtils.hasLerna(pkg)) {
    //   packageUtils.addScript(pkg, 'postinstall', 'repository-check-dirty && lerna bootstrap');
    // }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    const cwd = this.destinationPath();

    if (this.spawnCommandSync('git', ['status'], { cwd }).status === 128) {
      this.spawnCommandSync('git', ['init'], { cwd });

      if (!this.originUrl) {
        let repoSSH = pkg.repository;
        if (pkg.repository && !pkg.repository.includes('.git')) {
          /* this.spawnCommandSync('curl', [
                        '--silent',
                        '--write-out',
                        '"%{http_code}"',
                        '--output',
                        '/dev/null',
                        '-i',
                        '-u',
                        this.options.githubAccount,
                        `-d "{"name": "${this.options.name}", "auto_init": true}`,
                        'https://api.github.com/user/repos',
                    ], { cwd }); */

          repoSSH = pkg.repository;
        }

        this.spawnCommandSync('git', ['remote', 'add', 'origin', repoSSH], {
          cwd,
        });
      }
    }
  }

  // end() {
  //   this.spawnCommandSync(
  //     'node',
  //     ['node_modules/husky/lib/installer/bin.js', 'install'],
  //   );
  // }
};
