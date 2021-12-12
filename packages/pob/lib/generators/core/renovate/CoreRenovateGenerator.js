import Generator from 'yeoman-generator';
import inLerna from '../../../utils/inLerna.js';
import { writeAndFormatJson } from '../../../utils/writeAndFormat.js';

export default class CoreRenovateGenerator extends Generator {
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
      const renovateConfig = this.fs.readJSON(
        this.destinationPath('renovate.json'),
        {},
      );

      if (this.options.app) {
        renovateConfig.extends = ['config:js-app', '@pob'];
      } else {
        renovateConfig.extends = ['config:js-lib', '@pob'];
      }

      writeAndFormatJson(
        this.fs,
        this.destinationPath('renovate.json'),
        renovateConfig,
      );
    } else if (this.fs.exists(this.destinationPath('renovate.json'))) {
      this.fs.delete(this.destinationPath('renovate.json'));
    }
  }
}
