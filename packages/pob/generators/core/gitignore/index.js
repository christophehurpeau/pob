const Generator = require('yeoman-generator');

module.exports = class GitignoreGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('root', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Root package.',
    });

    this.option('documentation', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Documentation enabled.',
    });
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath('gitignore.ejs'),
      this.destinationPath('.gitignore'),
      {
        root: this.options.root,
        documentation: this.options.documentation,
      },
    );
  }
};
