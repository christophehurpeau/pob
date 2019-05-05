'use strict';

const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class CiGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable ci',
    });

    this.option('testing', {
      type: Boolean,
      defaults: true,
      desc: 'enable testing',
    });

    // this.option('babelEnvs', {
    //   type: String,
    //   required: true,
    //   desc: 'Babel Envs',
    // });

    this.option('circleci', {
      type: Boolean,
      required: true,
      desc: 'circleci',
    });

    this.option('codecov', {
      type: Boolean,
      required: true,
      desc: 'Include codecov report',
    });

    this.option('documentation', {
      type: Boolean,
      required: true,
      desc: 'Include documentation generation',
    });
  }

  default() {
    if (this.options.enable) {
      try {
        // this.fs.copyTpl(
        //   this.templatePath('circle.yml.ejs'),
        //   this.destinationPath('circle.yml'),
        //   {
        //     testing: this.ci,
        //     documentation: this.options.documentation,
        //     codecov: this.options.codecov,
        //   },
        // );
        this.fs.copyTpl(
          this.templatePath('circleci2.yml.ejs'),
          this.destinationPath('.circleci/config.yml'),
          {
            testing: this.options.testing,
            documentation: this.options.documentation,
            codecov: this.options.codecov,
            node12: true,
            node10: true, // Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '10')),
            node8: true, // Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '8')),
          }
        );
      } catch (err) {
        console.log(err.stack || err.message || err);
        throw err;
      }
    } else {
      this.fs.delete(this.destinationPath('.circleci/config.yml'));
      this.fs.delete(this.destinationPath('.circleci'));
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    this.fs.delete(this.destinationPath('.travis.yml'));
    this.fs.delete(this.destinationPath('circle.yml'));

    if (!this.options.enable) {
      packageUtils.removeDevDependencies(pkg, ['jest-junit-reporter']);
    } else {
      // this.babelEnvs = JSON.parse(this.options.babelEnvs);

      packageUtils.addOrRemoveDevDependencies(
        pkg,
        this.options.circleci && pkg.jest,
        ['jest-junit-reporter']
      );
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
