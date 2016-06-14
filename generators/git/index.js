const generators = require('yeoman-generator');
const remoteUrl = require('git-remote-url');
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

        this.option('githubAccount', {
            type: String,
            required: true,
            desc: 'User github account'
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
            this.templatePath('pre-commit'),
            this.destinationPath(this.options.destination, 'git-hooks/pre-commit')
        );

        return remoteUrl(this.destinationPath(this.options.destination), 'origin')
            .then(url => this.originUrl = url)
            .catch(url => this.originUrl = '');
    },

    writing() {
        this.pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        var repository = '';
        if (this.originUrl) {
            repository = this.originUrl.replace(/^git@github.com:(.*)\.git$/, '$1');
        } else {
            repository = this.options.githubAccount + '/' + this.options.name;
        }

        if (this.pkg.repository !== repository) {
            this.pkg.repository = repository;
            packageUtils.sort(this.pkg);
            this.fs.writeJSON(
                this.destinationPath(this.options.destination, 'package.json'),
                this.pkg
            );
        }
    },

    end() {
        const cwd = this.destinationPath(this.options.destination);

        try {
            accessSync(this.destinationPath(this.options.destination, '.git'));
        } catch (err) {
            this.spawnCommandSync('git', ['init'], { cwd });

            if (!this.originUrl) {
                var repoSSH = this.pkg.repository;
                if (this.pkg.repository && this.pkg.repository.indexOf('.git') === -1) {
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

                    repoSSH = 'git@github.com:' + this.pkg.repository + '.git';
                }

                this.spawnCommandSync('git', ['remote', 'add', 'origin', repoSSH], { cwd });
            }
        }
    }
});
