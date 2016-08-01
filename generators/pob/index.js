const generators = require('yeoman-generator');
const askName = require('inquirer-npm-name');
const parseAuthor = require('parse-author');
const githubUsername = require('github-username');
const kebabCase = require('lodash.kebabcase');
const path = require('path');
const packageUtils = require('../../utils/package');

module.exports = generators.Base.extend({
    constructor: function() {
        generators.Base.apply(this, arguments);

        /* this.option('boilerplate', {
            type: Boolean,
            required: true,
            desc: 'boilerplate: node-lib or browser-lib or isomorphic-lib'
        }); */

        this.option('babel', {
            type: Boolean,
            required: false,
            defaults: true,
            desc: 'Use babel'
        });

        this.option('license', {
            type: Boolean,
            required: false,
            defaults: true,
            desc: 'Include a license'
        });

        this.option('name', {
            type: String,
            required: false,
            desc: 'Project name'
        });

        this.option('githubAccount', {
            type: String,
            required: false,
            desc: 'GitHub username or organization'
        });

        this.option('projectRoot', {
            type: String,
            required: false,
            defaults: 'lib',
            desc: 'Relative path to the project code root'
        });
    },

    initializing() {
        this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

        // Pre set the default props from the information we have at this point
        this.props = {
            name: this.pkg.name,
            description: this.pkg.description,
            version: this.pkg.version,
            homepage: this.pkg.homepage,
        };

        if (typeof this.pkg.author === 'object') {
            this.props.authorName = this.pkg.author.name;
            this.props.authorEmail = this.pkg.author.email;
            this.props.authorUrl = this.pkg.author.url;
        } else if (typeof this.pkg.author === 'string') {
            const parsedAuthor = parseAuthor(this.pkg.author);
            this.props.authorName = parsedAuthor.name;
            this.props.authorEmail = parsedAuthor.email;
            this.props.authorUrl = parsedAuthor.url;
        }
    },

    prompting: {
        askForModuleName() {
            if (this.pkg.name || this.options.name) {
                this.props.name = this.pkg.name || this.options.name;
                return;
            }

            return askName({
                name: 'name',
                message: 'Module Name',
                default: path.basename(process.cwd()),
                filter: kebabCase,
                validate: str => str.length > 0,
            }, this).then(({ name }) => {
                this.props.name = name;
            });
        },

        askFor() {
            var prompts = [{
                name: 'description',
                message: 'Description',
                when: !this.props.description,
            }, {
                name: 'authorName',
                message: 'Author\'s Name',
                when: !this.props.authorName,
                default: this.user.git.name(),
                store: true,
            }, {
                name: 'authorEmail',
                message: 'Author\'s Email',
                when: !this.props.authorEmail,
                default: this.user.git.email(),
                store: true,
            }, {
                name: 'authorUrl',
                message: 'Author\'s Homepage',
                when: !this.props.authorUrl,
                store: true,
            }, {
                type: 'checkbox',
                name: 'babelEnvs',
                message: 'Babel envs:',
                when: this.options.babel,
                choices: [{
                    name: 'Node6',
                    value: 'node6',
                    checked: true,
                }, {
                    name: 'Node < 6',
                    value: 'olderNode',
                    checked: false,
                }, {
                    name: 'Webpack: Modern browsers (latest version of firefox and chrome)',
                    value: 'webpackModernBrowsers',
                    checked: false,
                }, {
                    name: 'Webpack: All Browsers',
                    value: 'webpackAllBrowsers',
                    checked: false,
                }, {
                    name: 'Browsers',
                    value: 'browsers',
                    checked: false,
                }, ]
            }, {
                type: 'confirm',
                name: 'react',
                message: 'Would you like React syntax ?',
                default: false,
            }, {
                type: 'confirm',
                name: 'includeDocumentation',
                message: 'Would you like documentation (manually generated) ?',
                default: true,
            }, {
                type: 'confirm',
                name: 'includeDoclets',
                message: 'Would you like doclets ?',
                default: false,
            }, {
                type: 'confirm',
                name: 'includeTesting',
                message: 'Would you like testing ?',
                default: true,
            }];

            return this.prompt(prompts).then(props => {
                Object.assign(this.props, props);

                if (!props.includeTesting) {
                    return;
                }

                const testingPrompts = [{
                    type: 'confirm',
                    name: 'circleci',
                    message: 'Would you like circleci ?',
                }, {
                    type: 'confirm',
                    name: 'includeCoveralls',
                    message: 'Would you like coveralls badge ?',
                }];

                return this.prompt(testingPrompts).then(props => {
                    Object.assign(this.props, props);
                });
            });
        },

        askForGithubAccount() {
            if (this.options.githubAccount) {
                this.props.githubAccount = this.options.githubAccount;
                return;
            }

            return new Promise((resolve) => {
                githubUsername(this.props.authorEmail, (err, username) => {
                    if (err) {
                        username = username || '';
                    }

                    this.prompt({
                        name: 'githubAccount',
                        message: 'GitHub username or organization',
                        default: username
                    }).then(prompt => {
                        this.props.githubAccount = prompt.githubAccount;
                        resolve();
                    });
                });
            });
        },
    },

    default() {
        if (!this.props.homepage && this.props.githubAccount) {
            this.props.homepage = `https://github.com/${this.props.githubAccount}/${this.props.name}`;
        }

        if (this.options.license && !this.fs.exists(this.destinationPath('LICENSE'))) {
            this.composeWith('license', {
                options: {
                    name: this.props.authorName,
                    email: this.props.authorEmail,
                    website: this.props.authorUrl,
                    defaultLicense: 'ISC',
                }
            }, {
                local: require.resolve('generator-license/app'),
            });
        }

        this.composeWith('pob:git', {
            options: {
                name: this.props.name,
                githubAccount: this.props.githubAccount,
            }
        }, {
            local: require.resolve('../git'),
        });

        this.composeWith('pob:editorconfig', {}, {
            local: require.resolve('../editorconfig'),
        });

        this.composeWith('pob:eslint', {
            options: {
                babel: this.options.babel,
                react: this.props.react,
                testing: this.props.includeTesting,
            },
        }, {
            local: require.resolve('../eslint'),
        });

        if (this.options.babel && this.props.babelEnvs.length) {
            this.composeWith('pob:babel', {
                options: {
                    react: this.props.react,
                    documentation: this.props.includeDocumentation,
                    testing: this.props.includeTesting,
                    env_node6: this.props.babelEnvs.includes('node6'),
                    env_olderNode: this.props.babelEnvs.includes('olderNode'),
                    env_webpack_modernBrowsers: this.props.babelEnvs.includes('webpackModernBrowsers'),
                    env_webpack_allBrowsers: this.props.babelEnvs.includes('webpackAllBrowsers'),
                    env_browsers: this.props.babelEnvs.includes('browsers'),
                },
            }, {
                local: require.resolve('../babel'),
            });
        }

        /* if (this.options.boilerplate) {
            this.composeWith(`pob:boilerplate`, {
                options: {
                    babelEnvs: this.props.babelEnvs,
                    name: this.props.name,
                }
            }, {
                local: require.resolve(`./boilerplate-${this.options.boilerplate}`),
            });
        } */

        if (!this.fs.exists(this.destinationPath('README.md'))) {
            this.composeWith('pob:readme', {
                options: {
                    name: this.props.name,
                    description: this.props.description,
                    githubAccount: this.props.githubAccount,
                    authorName: this.props.authorName,
                    authorEmail: this.props.authorEmail,
                    authorUrl: this.props.authorUrl,
                    documentation: this.props.includeDocumentation,
                    doclets: this.props.includeDoclets,
                    testing: this.props.includeTesting,
                    coveralls: this.props.includeCoveralls,
                    circleci: this.props.circleci,
                    content: this.options.readme
                }
            }, {
                local: require.resolve('../readme')
            });
        }

        if (this.props.includeTesting) {
            this.composeWith('pob:testing', {
                options: {
                    babel: this.options.babel,
                    react: this.props.react,
                    documentation: this.props.includeDocumentation,
                    coveralls: this.props.includeCoveralls,
                    circleci: this.props.circleci,
                }
            }, {
                local: require.resolve('../testing'),
            });
        }

        if (this.props.includeDocumentation) {
            this.composeWith('pob:doc', {
                options: {
                    name: this.props.name,
                    testing: this.props.includeTesting,
                    doclets: this.props.includeDoclets,
                }
            }, {
                local: require.resolve('../doc'),
            });
        }
    },

    writing() {
        // Re-read the content at this point because a composed generator might modify it.
        const currentPkg = this.fs.readJSON(this.destinationPath('package.json'), {});

        const pkg = packageUtils.extend(currentPkg, {
            name: kebabCase(this.props.name),
            version: '0.0.0',
            description: this.props.description,
            homepage: this.props.homepage,
            author: `${this.props.authorName} <${this.props.authorEmail}>${
                this.props.authorUrl && ` (${this.props.authorUrl})`}`,
            keywords: []
        });

        packageUtils.addScripts(pkg, {
            release: 'pob-repository-check-clean && pob-release',
            preversion: 'npm run lint && npm run build && pob-repository-check-clean',
            version: 'pob-version',
            clean: 'rm -Rf docs dist test/node6 coverage',
            prepublish: 'ln -s ../../git-hooks/pre-commit .git/hooks/pre-commit || echo',
        });

        packageUtils.addDevDependency(pkg, 'pob-release', '^2.0.5');

        this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    },

    installing() {
        return this.npmInstall();
    },

    configuring() {
        return this.mkdir('src');
    },

    end() {
    }
});
