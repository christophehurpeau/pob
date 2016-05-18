const generators = require('yeoman-generator');
const camelCase = require('lodash.camelcase');

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

        this.option('description', {
            type: String,
            required: true,
            desc: 'Project description'
        });

        this.option('githubAccount', {
            type: String,
            required: true,
            desc: 'User github account'
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

        this.option('testing', {
            type: Boolean,
            required: true,
            desc: 'Include testing badge'
        });

        this.option('coveralls', {
            type: Boolean,
            required: true,
            desc: 'Include coveralls badge'
        });

        this.option('content', {
            type: String,
            required: false,
            desc: 'Readme content'
        });
    },

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        this.fs.copyTpl(
            this.templatePath('README.md.ejs'),
            this.destinationPath(this.options.destination, 'README.md'),
            {
                projectName: this.options.name,
                camelCaseProjectName: camelCase(this.options.name),
                description: this.options.description,
                githubAccount: this.options.githubAccount,
                author: {
                    name: this.options.authorName,
                    url: this.options.authorUrl
                },
                license: pkg.license,
                coveralls: this.options.coveralls,
                testing: this.options.testing,
                content: this.options.content
            }
        );
    },
});
