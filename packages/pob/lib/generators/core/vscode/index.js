'use strict';

const Generator = require('yeoman-generator');
const { copyAndFormatTpl } = require('../../../utils/copyAndFormat');

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
      type: Boolean,
      required: false,
      defaults: '',
      desc: 'Uses yarn 2.',
    });

    this.option('npm', {
      type: Boolean,
      required: false,
      defaults: '',
      desc: 'Uses npm.',
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
      copyAndFormatTpl(
        this.fs,
        this.templatePath('extensions.json.ejs'),
        this.destinationPath('.vscode/extensions.json'),
        {
          yarn2: this.options.yarn2,
        },
      );
      copyAndFormatTpl(
        this.fs,
        this.templatePath('settings.json.ejs'),
        this.destinationPath('.vscode/settings.json'),
        {
          yarn2: this.options.yarn2,
          npm: this.options.npm,
          typescript: this.options.typescript,
        },
      );
      copyAndFormatTpl(
        this.fs,
        this.templatePath('tasks.json.ejs'),
        this.destinationPath('.vscode/tasks.json'),
        {
          typescript: this.options.typescript,
        },
      );
    } else {
      this.fs.delete('.vscode');
    }
  }
};
