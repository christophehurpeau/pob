const generators = require('yeoman-generator');
const remoteUrl = require('git-remote-url');
const githubUsername = require('github-username');
const accessSync = require('fs').accessSync;
const packageUtils = require('../../utils/package');

module.exports = generators.Base.extend({
    constructor: function() {
        generators.Base.apply(this, arguments);
        this.option('destination', {
            type: String,
            required: false,
            defaults: '',
            desc: 'Destination of the generated files.'
        });

        this.option('name', {
            type: String,
            required: true,
            desc: 'Project name'
        });

        this.option('authorEmail', {
            type: String,
            required: true,
            desc: 'User email'
        });

        this.option('githubAccount', {
            type: String,
            required: true,
            desc: 'User github account'
        });

        this.option('bitbucketAccount', {
            type: String,
            required: true,
            desc: 'User bitbucket account'
        });

        this.option('gitlabAccount', {
            type: String,
            required: true,
            desc: 'User bitbucket account'
        });
    },

    initializing() {
        this.fs.copy(
            this.templatePath('gitignore'),
            this.destinationPath(this.options.destination, '.gitignore')
        );

        this.fs.copy(
            this.templatePath('npmignore'),
            this.destinationPath('.npmignore')
        );

        this.fs.copy(
            this.templatePath('commitrc.js'),
            this.destinationPath('.commitrc.js')
        );

        ['pre-commit', 'post-checkout', 'post-merge', 'prepare-commit-msg'].forEach(filename => (
            this.fs.copy(
                this.templatePath(filename),
                this.destinationPath(this.options.destination, `git-hooks/${filename}`)
            )
        ));

        return remoteUrl(this.destinationPath(this.options.destination), 'origin')
            .catch(url => '')
            .then(originUrl => {
                if (!originUrl) {
                    const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});
                    originUrl = pkg.repository;
                }
                this.originUrl = originUrl;
                const match = originUrl && originUrl.match(/^(?:git@)?(?:([^:/.]+)(?:\.com)?:)?([^:/]+)\/([^:/.]+)(?:.git)?/);
                if (!match) return;
                const [, gitHost, gitAccount, pkgName] = match;
                this.gitHost = gitHost || 'github';
                this.gitHostAccount = gitAccount;
                this.pkgName = pkgName;
            });
    },

    prompting() {
        if (this.options.githubAccount) {
            this.gitHost = 'github';
            this.gitHostAccount = this.options.githubAccount;
        }

        if (this.options.bitbucketAccount) {
            this.gitHost = 'bitbucket';
            this.gitHostAccount = this.options.bitbucketAccount;
        }

        if (this.options.gitlabAccount) {
            this.gitHost = 'gitlab';
            this.gitHostAccount = this.options.gitlabAccount;
        }

        if (this.gitHost) return;

        return this.prompt({
            type: 'list',
            name: 'gitHost',
            message: 'Which git host service would you like ?',
            default: this.gitHost || (this.originUrl ? 'none' : 'github'),
            choices: [
                { value: 'none', name: !this.originUrl ? 'none' : "don't change" },
                'github',
                'bitbucket',
                'gitlab',
            ]
        }).then(prompt => {
            this.gitHost = prompt.gitHost;

            if (this.gitHostAccount) return this.gitHostAccount;

            if (this.gitHost === 'github') {
                return githubUsername(this.options.authorEmail)
                    .catch(err => '');
            }
        }).then(username => this.gitHost !== 'none' && this.prompt({
            name: 'gitHostAccount',
            message: 'username or organization',
            default: username
        })).then(prompt => {
            this.gitHostAccount = prompt && prompt.gitHostAccount;
        });
    },

    writing() {
        if (this.gitHost === 'none') return;

        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        if (!pkg.homepage && this.gitHostAccount) {
            pkg.homepage = `https://${this.gitHost}.com/${this.gitHostAccount}/${pkg.name}`;
        }

        packageUtils.addScripts(pkg, {
            prepublish: [
                'ln -s ../../git-hooks/pre-commit .git/hooks/pre-commit 2>/dev/null || true',
                'ln -s ../../git-hooks/post-checkout .git/hooks/post-checkout 2>/dev/null || true',
                'ln -s ../../git-hooks/post-merge .git/hooks/post-merge 2>/dev/null || true',
                'ln -s ../../git-hooks/prepare-commit-msg .git/hooks/prepare-commit-msg 2>/dev/null || true',
            ].join(' ; '),
        });

        var repository = `git@${this.gitHost}.com:${this.gitHostAccount}/${this.pkgName || this.options.name}.git`;

        if (pkg.repository !== repository) {
            pkg.repository = repository;
            packageUtils.sort(pkg);
        }

        if (this.pkgName !== 'komet') {
            packageUtils.addDevDependency(pkg, 'komet', '^0.1.0');
            packageUtils.addDevDependency(pkg, 'komet-karma', '^0.1.0');
        }

        this.fs.writeJSON(
            this.destinationPath(this.options.destination, 'package.json'),
            pkg
        );

        const cwd = this.destinationPath(this.options.destination);

        if (this.spawnCommandSync('git', ['status'], { cwd }).status === 128) {
            this.spawnCommandSync('git', ['init'], { cwd });

            if (!this.originUrl) {
                var repoSSH = pkg.repository;
                if (pkg.repository && pkg.repository.indexOf('.git') === -1) {
                    /*this.spawnCommandSync('curl', [
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

                this.spawnCommandSync('git', ['remote', 'add', 'origin', repoSSH], { cwd });
            }
        }
    }
});
