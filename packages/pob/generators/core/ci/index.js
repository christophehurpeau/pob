const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');
const inLerna = require('../../../utils/inLerna');

module.exports = class CiGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
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

  async prompting() {
    if (this.fs.exists(this.destinationPath('lerna.json'))) {
      const {
        ci, testing, codecov, documentation,
      } = await this.prompt([
        {
          type: 'confirm',
          name: 'ci',
          message: 'Would you like ci ?',
          default: this.fs.exists(this.destinationPath('.circleci/config.yml')),
        },
        {
          type: 'confirm',
          name: 'testing',
          message: 'Would you like testing ?',
          when: answers => answers.ci,
          default: true,
        },
        {
          type: 'confirm',
          name: 'codecov',
          message: 'Would you like code coverage ?',
          when: answers => answers.ci,
          default: true,
        },
        {
          type: 'confirm',
          name: 'documentation',
          message: 'Would you like documentation ?',
          when: answers => answers.ci,
          default: true,
        },
      ]);

      this.ci = ci;
      this.testing = testing;
      this.codecov = codecov;
      this.documentation = documentation;
    } else {
      this.ci = this.options.enable;
      this.testing = this.options.enable;
      this.codecov = this.options.codecov;
      this.documentation = this.options.documentation;
    }
  }

  default() {
    if (this.ci) {
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
            testing: this.testing,
            documentation: this.documentation,
            codecov: this.codecov,
            node10: true,
            node8: true, // Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '8')),
            node6: true, // Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '6')),
          },
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

    if (!this.ci) {
      packageUtils.removeDevDependencies(pkg, [
        'jest-junit-reporter',
      ]);
      this.fs.delete(this.destinationPath('.circleci/config.yml'));
    } else {
      // this.babelEnvs = JSON.parse(this.options.babelEnvs);

      packageUtils.addOrRemoveDevDependencies(pkg, this.options.circleci && pkg.jest, { 'jest-junit-reporter': '1.1.0' });
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
