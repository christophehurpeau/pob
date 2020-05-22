'use strict';

const Generator = require('yeoman-generator');
const inLerna = require('../../../utils/inLerna');

module.exports = class RenovateGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('disable', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'disable',
    });

    this.option('app', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'is app (instead of lib)',
    });

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });
  }

  initializing() {
    if (inLerna && !inLerna.root) {
      this.enableRenovate = false;
      this.config.delete('renovate');
      return;
    }

    this.enableRenovateConfig = this.config.get('renovate');
  }

  async prompting() {
    if (inLerna && !inLerna.root) {
      return;
    }

    if (this.options.updateOnly && this.enableRenovateConfig) {
      this.enableRenovate = this.enableRenovateConfig.enable;
      return;
    }

    this.enableRenovateConfig = await this.prompt({
      type: 'confirm',
      name: 'enable',
      message: 'Enable renovate ?',
    });
    this.config.set('renovate', this.enableRenovateConfig);
    this.enableRenovate = this.enableRenovateConfig.enable;
  }

  writing() {
    if (this.enableRenovate) {
      this.fs.copy(
        this.templatePath(
          this.options.app ? 'renovate.app.json' : 'renovate.lib.json',
        ),
        this.destinationPath('renovate.json'),
      );
    } else if (this.fs.exists(this.destinationPath('renovate.json'))) {
      this.fs.delete(this.destinationPath('renovate.json'));
    }
  }
};
