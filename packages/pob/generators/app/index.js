const Generator = require('yeoman-generator');
const packageUtils = require('../../utils/package');
const inLerna = require('../../utils/inLerna');
const inNpmLerna = require('../../utils/inNpmLerna');

module.exports = class PobAppGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });

    this.option('fromPob', {
      type: Boolean,
      required: false,
      defaults: false,
    });
  }


  default() {
    const withBabel = true;
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const withReact = packageUtils.hasReact(pkg);


    this.composeWith(require.resolve('../common/typescript'), {
      enable: withBabel,
      withReact,
      updateOnly: this.options.updateOnly,
    });

    this.composeWith(require.resolve('../common/format-lint'), {
      babelEnvs: JSON.stringify([{ target: 'browser' }, { target: 'node' }]),
    });

    this.composeWith(require.resolve('../common/old-dependencies'));

    this.composeWith(require.resolve('../core/gitignore'), {
      root: !inLerna,
      documentation: false,
    });
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (inNpmLerna) {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = '< 0.0.0';
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
