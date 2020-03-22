'use strict';

const Generator = require('yeoman-generator');
const inLerna = require('../../../utils/inLerna');

module.exports = class NpmGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (!pkg.private) {
      const babelEnvs = pkg.pob.babelEnvs || [];
      const withBabel = !!babelEnvs.length;

      this.fs.copyTpl(
        this.templatePath('npmignore.ejs'),
        this.destinationPath('.npmignore'),
        {
          inLerna,
          babel: withBabel,
          typedoc: pkg.devDependencies && pkg.devDependencies.typedoc,
        }
      );
    } else if (this.fs.exists(this.destinationPath('.npmignore'))) {
      this.fs.delete(this.destinationPath('.npmignore'));
    }
  }
};
