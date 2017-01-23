const Generator = require('yeoman-generator');
const camelCase = require('lodash.camelcase');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.option('destination', {
            type: String,
            required: false,
            defaults: '',
            desc: 'Destination of the generated files.'
        });

        this.option('privatePackage', {
            type: Boolean,
            required: true,
            desc: 'If the project is private'
        });

        this.option('name', {
            type: String,
            required: true,
            desc: 'Project name'
        });

        this.option('description', {
            type: String,
            required: true,
            desc: 'Project description'
        });

        this.option('authorName', {
            type: String,
            required: true,
            desc: 'Author name'
        });

        this.option('authorUrl', {
            type: String,
            required: true,
            desc: 'Author url'
        });


        this.option('documentation', {
            type: Boolean,
            required: true,
            desc: 'Include documentation'
        });

        this.option('testing', {
            type: Boolean,
            required: true,
            desc: 'Include testing badge'
        });

        this.option('doclets', {
            type: Boolean,
            required: true,
            desc: 'Include doclets.io link'
        });

        this.option('circleci', {
            type: Boolean,
            required: true,
            desc: 'circleci badge and documentation link'
        });

        this.option('travisci', {
            type: Boolean,
            required: true,
            desc: 'travisci badge'
        });

        this.option('codecov', {
            type: Boolean,
            required: true,
            desc: 'Include codecov badge'
        });

        this.option('content', {
            type: String,
            required: false,
            desc: 'Readme content'
        });
    }

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        const readmePath = this.destinationPath(this.options.destination, 'README.md');
        let content = this.options.content;

        if (this.fs.exists(readmePath)) {
            const readmeFullContent = this.fs.read(readmePath);
            content = readmeFullContent.match(/^#(?:[^#]+)([^]+)(?:\[npm-image]:)/);
            if (!content) content = readmeFullContent.match(/^#(?:[^#]+)([^]+)$/);
            content = content ? content[1].trim() : readmeFullContent;
        }

        const repository = pkg.repository;
        const match = repository && repository.match(
            /^(?:git@)?(?:([^:/.]+)(?:\.com)?:)?([^:/]+)\/([^:/.]+)(?:.git)?/
        );
        const [, gitHost, gitAccount, gitName] = match || [];
        try {
            this.fs.copyTpl(
                this.templatePath('README.md.ejs'),
                readmePath,
                {
                    privatePackage: this.options.privatePackage,
                    projectName: this.options.name,
                    camelCaseProjectName: camelCase(this.options.name),
                    description: this.options.description,
                    gitHost: gitHost,
                    gitAccount: gitAccount,
                    gitName: gitName,
                    author: {
                        name: this.options.authorName,
                        url: this.options.authorUrl
                    },
                    license: pkg.license,
                    doclets: this.options.doclets,
                    codecov: this.options.codecov,
                    documentation: this.options.documentation,
                    testing: this.options.testing,
                    circleci: this.options.circleci,
                    travisci: this.options.travisci,
                    content: content
                }
            );
        } catch (err) {
            console.log(err.stack || err.message || err);
            throw err;
        }
    }
};
