const generators = require('yeoman-generator');
const askName = require('inquirer-npm-name');
const parseAuthor = require('parse-author');
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

        this.option('bitbucketAccount', {
            type: String,
            required: false,
            desc: 'Bitbucket username or organization'
        });

        this.option('gitlabAccount', {
            type: String,
            required: false,
            desc: 'GitLab username or organization'
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
        this.pobjson = this.fs.readJSON(this.destinationPath('.pob.json'), null);
        if (!this.pobjson) {
            this.pobjson = this.fs.readJSON(this.destinationPath('.pobrc.json'), null);
            if (this.pobjson) this.fs.delete(this.destinationPath('.pobrc.json'));
        }
        if (!this.pobjson) this.pobjson = {};

        // Pre set the default props from the information we have at this point
        this.props = {
            name: this.pkg.name,
            private: this.pkg.private,
            description: this.pkg.description,
            version: this.pkg.version,
            babelEnvs: this.pobjson.envs || [],
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
                type: 'confirm',
                name: 'private',
                message: 'Private package ?',
                default: this.props.private === true,
            }, {
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
                    checked: this.props.babelEnvs.includes('node6'),
                }, {
                    name: 'Node < 6',
                    value: 'olderNode',
                    checked: this.props.babelEnvs.includes('older-node'),
                }, {
                    name: 'Webpack: Modern browsers (latest version of firefox and chrome)',
                    value: 'webpackModernBrowsers',
                    checked: this.props.babelEnvs.includes('webpack-modern-browsers'),
                }, {
                    name: 'Webpack: All Browsers',
                    value: 'webpackAllBrowsers',
                    checked: this.props.babelEnvs.includes('webpack'),
                }, {
                    name: 'Browsers',
                    value: 'browsers',
                    checked: this.props.babelEnvs.includes('browsers'),
                }, ]
            }, {
                type: 'confirm',
                name: 'react',
                message: 'Would you like React syntax ?',
                default: this.pobjson.react || false,
            }, {
                type: 'confirm',
                name: 'includeDocumentation',
                message: 'Would you like documentation (manually generated) ?',
                default: this.pobjson.documentation != null ? this.pobjson.documentation : true,
            }, {
                type: 'confirm',
                name: 'includeDoclets',
                message: 'Would you like doclets ?',
                default: false,
            }, {
                type: 'confirm',
                name: 'includeTesting',
                message: 'Would you like testing ?',
                default: this.pobjson.testing,
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
                    default: true,
                }, {
                    type: 'confirm',
                    name: 'travisci',
                    message: 'Would you like travisci ?',
                    default: true,
                }, {
                    type: 'confirm',
                    name: 'includeCodecov',
                    message: 'Would you like codecov ?',
                }];

                return this.prompt(testingPrompts).then(props => {
                    Object.assign(this.props, props);
                });
            });
        },
    },

    default() {
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
                authorEmail: this.props.authorEmail,
                githubAccount: this.props.githubAccount,
                bitbucketAccount: this.props.bitbucketAccount,
                gitlabAccount: this.props.gitlabAccount,
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
        } else {
            this.mkdir('lib');
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
                    authorName: this.props.authorName,
                    authorEmail: this.props.authorEmail,
                    authorUrl: this.props.authorUrl,
                    documentation: this.props.includeDocumentation,
                    doclets: this.props.includeDoclets,
                    testing: this.props.includeTesting,
                    codecov: this.props.includeCodecov,
                    circleci: this.props.circleci,
                    travisci: this.props.travisci,
                    content: this.options.readme,
                }
            }, {
                local: require.resolve('../readme')
            });
        }

        if (this.props.includeTesting) {
            this.composeWith('pob:testing', {
                options: {
                    private: this.props.private,
                    babel: this.options.babel,
                    react: this.props.react,
                    documentation: this.props.includeDocumentation,
                    codecov: this.props.includeCodecov,
                    circleci: this.props.circleci,
                    travisci: this.props.travisci,
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
            author: `${this.props.authorName} <${this.props.authorEmail}>${
                this.props.authorUrl && ` (${this.props.authorUrl})`}`,
            keywords: []
        });

        if (this.props.private) {
            pkg.private = true;
        }

        packageUtils.addScripts(pkg, {
            release: 'pob-repository-check-clean && pob-release',
            preversion: 'npm run lint && npm run build && pob-repository-check-clean',
            version: 'pob-version',
            clean: 'rm -Rf docs dist test/node6 coverage',
        });

        packageUtils.addDevDependency(pkg, 'pob-release', '^2.0.5');
        delete pkg.devDependencies['springbokjs-library'];

        packageUtils.sort(pkg);
        this.fs.writeJSON(this.destinationPath('package.json'), pkg);


        const pobjson = this.pobjson;

        pobjson.envs = [
            this.props.babelEnvs.includes('node6') && "node6",
            this.props.babelEnvs.includes('olderNode') && "older-node",
            this.props.babelEnvs.includes('webpackModernBrowsers') && "webpack-modern-browsers",
            this.props.babelEnvs.includes('webpackAllBrowsers') && "webpack",
            this.props.babelEnvs.includes('browsers') && "browsers",
        ].filter(Boolean);

        pobjson.react = this.props.react;
        pobjson.documentation = this.props.includeDocumentation;
        pobjson.testing = this.props.includeTesting;

        this.fs.writeJSON(this.destinationPath('.pob.json'), pobjson);
    },

    installing() {
        return this.npmInstall();
    },

    end() {
    }
});
