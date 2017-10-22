const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  async prompting() {
    const hasFlowConfig = this.fs.exists(this.destinationPath('.flowconfig'));
    const { flow } = await this.prompt({
      type: 'confirm',
      name: 'flow',
      message: 'Would you like flowtype ?',
      default: hasFlowConfig,
    });
    this.flow = flow;
  }

  writing() {
    const flowConfigPath = this.destinationPath('.flowconfig');
    if (this.flow) {
      this.fs.copy(this.templatePath('flowconfig'), flowConfigPath);
    } else {
      this.fs.delete(flowConfigPath);
    }
  }
};
