const Generator = require('yeoman-generator');

module.exports = class CleanGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('root', {
      type: Boolean,
      required: false,
      defaults: true,
      desc: 'Root package.',
    });
  }

  writing() {
    if (!this.options.root) {
      this.fs.delete('.idea');
    }
  }
};
