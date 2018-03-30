const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class FlowGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });
  }

  async prompting() {
    const hasFlowConfig = this.fs.exists(this.destinationPath('.flowconfig'));
    if (this.options.updateOnly) {
      this.flow = hasFlowConfig;
    } else {
      const { flow } = await this.prompt({
        type: 'confirm',
        name: 'flow',
        message: 'Would you like flowtype ?',
        default: hasFlowConfig,
      });
      this.flow = flow;
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    if (this.flow) {
      packageUtils.addDevDependency(pkg, 'flow-bin', '^0.69.0');
      packageUtils.addScript(pkg, 'flow', 'flow');
    } else if (pkg.scripts) {
      delete pkg.scripts.flow;
    }
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);


    const flowConfigPath = this.destinationPath('.flowconfig');
    if (this.flow) {
      this.fs.copy(this.templatePath('flowconfig'), flowConfigPath);
    } else {
      this.fs.delete(flowConfigPath);
    }
  }
};
