'use strict';

const Generator = require('yeoman-generator');

module.exports = class VscodeGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('root', {
      type: Boolean,
      required: false,
      defaults: '',
      desc: 'Is root',
    });

    this.option('yarn2', {
      type: String,
      required: false,
      defaults: '',
      desc: 'Uses yarn 2.',
    });

    this.option('typescript', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Typescript enabled',
    });
  }

  writing() {
    if (this.options.root) {
      this.fs.copyTpl(
        this.templatePath('extensions.json.ejs'),
        this.destinationPath('.vscode/extensions.json'),
        {
          yarn2: this.options.yarn2,
        },
      );
      this.fs.copyTpl(
        this.templatePath('settings.json.ejs'),
        this.destinationPath('.vscode/settings.json'),
        {
          yarn2: this.options.yarn2,
          typescript: this.options.typescript,
        },
      );
    } else {
      this.fs.delete('.vscode');
    }
  }
};
