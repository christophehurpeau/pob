const Generator = require('yeoman-generator');
const remoteUrl = require('git-remote-url');
const githubUsername = require('github-username');
const packageUtils = require('../../../utils/package');

module.exports = class extends Generator {
  async initializing() {
    this.fs.copy(
      this.templatePath('gitignore'),
      this.destinationPath('.gitignore'),
    );

    this.fs.copy(this.templatePath('npmignore'), this.destinationPath('.npmignore'));

    this.fs.copy(this.templatePath('commitrc.js'), this.destinationPath('.commitrc.js'));

    let originUrl = await remoteUrl(this.destinationPath(), 'origin')
      .catch(() => '');

    if (!originUrl) {
      const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
      originUrl = pkg.repository;
    }

    this.originUrl = originUrl;
    const match =
        originUrl &&
        originUrl.match(/^(?:git@)?(?:([^:/.]+)(?:\.com)?:)?([^:/]+)\/([^:/.]+)(?:.git)?/);
    if (!match) return;
    const [, gitHost, gitAccount, pkgName] = match;
    this.gitHost = gitHost || 'github';
    this.gitHostAccount = gitAccount;
    this.pkgName = pkgName;
  }

  async prompting() {
    if (this.options.gitHost) {
      this.gitHost = this.options.gitHost;
      this.gitHostAccount = this.options.gitHostAccount;
    }

    if (this.gitHost) return;

    const { gitHost } = await this.prompt({
      type: 'list',
      name: 'gitHost',
      message: 'Which git host service would you like ?',
      default: this.gitHost || (this.originUrl ? 'none' : 'github'),
      choices: [
        { value: 'none', name: !this.originUrl ? 'none' : "don't change" },
        'github',
        'bitbucket',
        'gitlab',
      ],
    });

    this.gitHost = gitHost;

    if (!this.gitHostAccount) {
      if (this.gitHost === 'github') {
        const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
        const author = packageUtils.parsePkgAuthor(pkg);
        this.gitHostAccount = await githubUsername(author.email).catch(() => '');
      }
    }

    if (this.gitHost !== 'none') {
      const { gitHostAccount } = await this.prompt({
        name: 'gitHostAccount',
        message: 'username or organization',
        default: this.gitHostAccount,
      });

      this.gitHostAccount = gitHostAccount;
    }
  }

  default() {
    this.composeWith(require.resolve('./generators/git-hooks'));
  }

  writing() {
    if (this.gitHost === 'none') return;

    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (!pkg.homepage && this.gitHostAccount) {
      pkg.homepage = `https://${this.gitHost}.com/${this.gitHostAccount}/${pkg.name}`;
    }

    const repository = `git@${this.gitHost}.com:${this.gitHostAccount}/${this.pkgName ||
      this.options.name}.git`;

    if (pkg.repository !== repository) {
      pkg.repository = repository;
      packageUtils.sort(pkg);
    }

    if (this.pkgName !== 'komet') {
      packageUtils.addDevDependency(pkg, 'komet', '^0.1.4');
      packageUtils.addDevDependency(pkg, 'komet-karma', '^0.2.5');
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
