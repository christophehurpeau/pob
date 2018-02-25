const { realpathSync } = require('fs');
const { execSync } = require('child_process');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../../../utils/package');
const inLerna = require('../../../../../utils/inLerna');

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

  async writing() {
    execSync('rm -Rf git-hooks/');

    ['pre-commit'].forEach(filename =>
      this.fs.copy(
        this.templatePath(filename),
        this.destinationPath(`.git-hooks/${filename}`),
      ));

    const gitHookDestination = this.destinationPath('.git/hooks/post-checkout');
    try {
      if (realpathSync(gitHookDestination) !== gitHookDestination) {
        this.fs.delete('.git/hooks/prepare-commit-msg');
        this.fs.delete('.git/hooks/post-checkout');
        this.fs.delete('.git/hooks/post-merge');
      }
    } catch (err) {
      console.log(err.message, err.stack);
    }

    this.fs.delete('.git-hooks/prepare-commit-msg');
    this.fs.delete('.git-hooks/post-checkout');
    this.fs.delete('.git-hooks/post-merge');

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.removeDevDependencies(pkg, ['komet', 'komet-karma']);

    packageUtils.addDevDependencies(pkg, {
      husky: '^0.14.3',
      yarnhook: '^0.1.1',
      'lint-staged': '^7.0.0',
      '@commitlint/cli': '^6.1.2',
      '@commitlint/config-conventional': '^6.1.2',
    });

    packageUtils.addScripts(pkg, {
      postmerge: 'yarnhook',
      postcheckout: 'yarnhook',
      postrewrite: 'yarnhook',
      precommit: './.git-hooks/pre-commit',
      commitmsg: 'commitlint -x @commitlint/config-conventional -e $GIT_PARAMS',
    });

    delete pkg.scripts.prepublish;
    delete pkg.scripts.prepare;
    delete pkg.scripts.preparecommitmsg;

    const hasBabel = packageUtils.transpileWithBabel(pkg);
    const hasReact = hasBabel && packageUtils.hasReact(pkg);
    const srcDirectory = hasBabel ? 'src' : 'lib';

    pkg['lint-staged'] = {
      [inLerna ? '{package.json,packages/*/package.json}' : 'package.json']: [
        'prettier --write',
        'git add',
      ],
      [`${inLerna ? 'packages/*/' : ''}${srcDirectory}/**/*.json`]: [
        'prettier --write',
        'git add',
      ],
      [`${inLerna ? 'packages/*/' : ''}${srcDirectory}/**/*.${hasReact ? '{js,jsx}' : 'js'}`]: [
        'eslint --fix --quiet',
        'git add',
      ],
    };

    if (packageUtils.hasLerna(pkg)) {
      packageUtils.addScript(pkg, 'postinstall', 'pob-repository-check-clean && lerna bootstrap');
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    const cwd = this.destinationPath();

    if (this.spawnCommandSync('git', ['status'], { cwd }).status === 128) {
      this.spawnCommandSync('git', ['init'], { cwd });

      if (!this.originUrl) {
        let repoSSH = pkg.repository;
        if (pkg.repository && pkg.repository.indexOf('.git') === -1) {
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

  end() {
    this.spawnCommandSync('node', ['node_modules/husky/bin/install.js']);
  }
};
