'use strict';

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

    this.option('withBabel', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Babel enabled.',
    });

    this.option('paths', {
      type: String,
      required: false,
      defaults: '',
      desc: 'Paths ignored.',
    });
  }

  writing() {
    const dest = this.destinationPath('.gitignore');
    if (
      !this.options.root &&
      !this.options.documentation &&
      !this.options.paths &&
      !this.options.withBabel
    ) {
      this.fs.delete(dest);
    } else {
      this.fs.copyTpl(this.templatePath('gitignore.ejs'), dest, {
        root: this.options.root,
        documentation: this.options.documentation,
        withBabel: this.options.withBabel,
        paths: this.options.paths,
      });
    }
  }
};
