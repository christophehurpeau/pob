import fs from 'fs';
import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

export default class CoreCIGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable ci',
    });

    this.option('typescript', {
      type: Boolean,
      defaults: true,
      desc: 'enable typescript',
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

    this.option('ci', {
      type: Boolean,
      required: true,
      desc: 'ci with github actions',
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
    fs.rmdirSync(this.destinationPath('.circleci'), { recursive: true });

    if (this.options.enable) {
      const pkg = this.fs.readJSON(this.destinationPath('package.json'));

      // this.fs.copyTpl(
      //   this.templatePath('circle.yml.ejs'),
      //   this.destinationPath('circle.yml'),
      //   {
      //     testing: this.ci,
      //     documentation: this.options.documentation,
      //     codecov: this.options.codecov,
      //   },
      // );

      copyAndFormatTpl(
        this.fs,
        this.templatePath('github-action-node-workflow.yml.ejs'),
        this.destinationPath('.github/workflows/push.yml'),
        {
          packageManager: this.options.packageManager,
          testing: this.options.testing && !!pkg.scripts.test,
          checks: !!pkg.scripts && !!pkg.scripts.checks,
          documentation: this.options.documentation,
          typescript: this.options.typescript,
          codecov: this.options.codecov,
        },
      );
    } else {
      this.fs.delete(this.destinationPath('.github/workflows/push.yml'));
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

      packageUtils.removeDevDependencies(pkg, ['jest-junit-reporter']);
      // packageUtils.addOrRemoveDevDependencies(
      //   pkg,
      //   this.options.circleci && pkg.jest,
      //   ['jest-junit-reporter'],
      // );
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
