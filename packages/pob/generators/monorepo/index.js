const { readdirSync, existsSync } = require('fs');
const Generator = require('yeoman-generator');

module.exports = class PobMonorepoGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });
  }

  initializing() {
    this.packageNames = existsSync('packages/') ? readdirSync('packages/').filter(packageName => existsSync(`packages/${packageName}/package.json`)) : [];
  }

  async prompting() {
    const config = this.config.get('monorepo');
    if (this.updateOnly && config) {
      this.pobLernaConfig.packageNames = this.packageNames;
      this.pobLernaConfig.typescript = false; // doesn't work for now
      this.config.set('monorepo', this.pobLernaConfig);
      return;
    }

    this.pobLernaConfig = await this.prompt([
      {
        type: 'confirm',
        name: 'ci',
        message: 'Would you like ci ?',
        default: config ? config.ci : this.fs.exists(this.destinationPath('.circleci/config.yml')),
      },
      {
        type: 'confirm',
        name: 'testing',
        message: 'Would you like testing ?',
        when: answers => answers.ci,
        default: config ? config.testing : true,
      },
      {
        type: 'confirm',
        name: 'codecov',
        message: 'Would you like code coverage ?',
        when: answers => answers.ci,
        default: config ? config.codecov : true,
      },
      {
        type: 'confirm',
        name: 'documentation',
        message: 'Would you like documentation ?',
        when: answers => answers.ci,
        default: config ? config.documentation : true,
      },
      // {
      //   type: 'confirm',
      //   name: 'typescript',
      //   message: 'Would you like typescript monorepo ?',
      //   default: config ? config.typescript : true,
      // },
    ]);
    this.pobLernaConfig.packageNames = this.packageNames;
    this.pobLernaConfig.typescript = false; // doesn't work for now
    this.config.set('monorepo', this.pobLernaConfig);
    this.config.delete('pob-config');
  }

  default() {
    console.log(this.pobLernaConfig);
    this.composeWith(require.resolve('../core/ci'), {
      enable: this.pobLernaConfig.ci,
      testing: this.pobLernaConfig.testing,
      codecov: this.pobLernaConfig.codecov,
      documentation: this.pobLernaConfig.documentation,
      updateOnly: this.options.updateOnly,
    });

    // Always add a gitignore, because npm publish uses it.
    this.composeWith(require.resolve('../core/gitignore'), { root: true });

    this.composeWith(require.resolve('./typescript'), {
      enable: this.pobLernaConfig.typescript,
      packageNames: JSON.stringify(this.packageNames),
    });
  }

  end() {
    console.log('save config');
    this.config.save();
  }
};
