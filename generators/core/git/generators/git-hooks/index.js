const { execSync } = require('child_process');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../../../utils/package');
const inLerna = require('../../../../../utils/inLerna');

module.exports = class extends Generator {
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

    ['pre-commit', 'post-checkout', 'post-merge', 'prepare-commit-msg'].forEach(filename =>
      this.fs.copy(
        this.templatePath(filename),
        this.destinationPath(`.git-hooks/${filename}`),
      ),
    );

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.addDevDependency(pkg, 'husky', '^0.14.3');
    packageUtils.addDevDependency(pkg, 'lint-staged', '^4.0.4');

    packageUtils.addScripts(pkg, {
      postcheckout: './.git-hooks/post-checkout',
      postmerge: './.git-hooks/post-merge',
      precommit: './.git-hooks/pre-commit',
      // eslint-disable-next-line no-template-curly-in-string
      preparecommitmsg: './.git-hooks/prepare-commit-msg ${GIT_PARAMS}',
    });

    delete pkg.scripts.prepublish;
    delete pkg.scripts.prepare;

    pkg['lint-staged'] = {
      [`package.json${inLerna ? ',packages/*/package.json' : ''}`]: [
        'prettier --write',
        'git add',
      ],
      [`${inLerna ? 'packages/*/' : ''}src/**/*.json`]: [
        'prettier --write',
        'git add',
      ],
      [`${inLerna ? 'packages/*/' : ''}src/**/*.{js,jsx}`]: [
        'eslint --fix --quiet',
        'git add',
      ],
    };

    if (packageUtils.hasLerna(pkg)) {
      packageUtils.addScript(pkg, 'postinstall', 'pob-repository-check-clean && lerna bootstrap');
    }

    if (this.pkgName !== 'komet') {
      packageUtils.addDevDependency(pkg, 'komet', '^0.1.4');
      packageUtils.addDevDependency(pkg, 'komet-karma', '^0.2.5');
    }

    packageUtils.sort(pkg);
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
                    ], { cwd });*/

          repoSSH = pkg.repository;
        }

        this.spawnCommandSync('git', ['remote', 'add', 'origin', repoSSH], {
          cwd,
        });
      }
    }
  }
};
