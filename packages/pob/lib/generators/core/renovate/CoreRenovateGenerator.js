import Generator from 'yeoman-generator';
import inMonorepo from '../../../utils/inMonorepo.js';
import { writeAndFormatJson } from '../../../utils/writeAndFormat.js';

export default class CoreRenovateGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('disable', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'disable',
    });

    this.option('app', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'is app (instead of lib)',
    });

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'Avoid asking questions',
    });
  }

  initializing() {
    if (inMonorepo && !inMonorepo.root) {
      this.enableRenovate = false;
      this.config.delete('renovate');
      return;
    }

    this.enableRenovateConfig = this.config.get('renovate');
  }

  async prompting() {
    if (inMonorepo && !inMonorepo.root) {
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
      const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
      const renovateConfig = this.fs.readJSON(
        this.destinationPath('renovate.json'),
        {},
      );

      if (this.options.app) {
        renovateConfig.extends = [
          'config:js-app',
          'github>christophehurpeau/renovate-presets',
        ];
      } else {
        renovateConfig.extends = [
          'config:js-lib',
          pkg.name === 'pob-monorepo'
            ? undefined
            : 'github>christophehurpeau/renovate-presets',
        ].filter(Boolean);
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
