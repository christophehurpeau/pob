import fs from 'node:fs';
import Generator from 'yeoman-generator';
import inLerna from '../../../utils/inLerna.js';
import * as packageUtils from '../../../utils/package.js';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

export const ciContexts = [];

export default class CoreCIGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      default: true,
      desc: 'enable ci',
    });

    this.option('enableReleasePlease', {
      type: Boolean,
      default: true,
      desc: 'enable release-please',
    });

    this.option('build', {
      type: Boolean,
      default: true,
      desc: 'enable build',
    });

    this.option('typescript', {
      type: Boolean,
      default: true,
      desc: 'enable typescript',
    });

    this.option('testing', {
      type: Boolean,
      default: true,
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

    this.option('isApp', {
      type: Boolean,
      required: true,
      desc: 'is app',
    });

    this.option('onlyLatestLTS', {
      type: Boolean,
      required: true,
      desc: 'only latest lts',
    });

    this.option('splitJobs', {
      type: Boolean,
      required: true,
      desc: 'split CI jobs for faster result',
    });
  }

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    this.isReleasePleaseEnabled =
      this.options.enableReleasePlease &&
      !pkg.devDependencies?.['standard-version'];

    if (
      this.options.enableReleasePlease &&
      !process.env.CI &&
      !this.isReleasePleaseEnabled
    ) {
      const { enableReleasePlease } = await this.prompt({
        type: 'confirm',
        name: 'enableReleasePlease',
        message: 'Would you like to enable release please ?',
        default: true,
      });
      this.isReleasePleaseEnabled = enableReleasePlease;
    }
  }

  default() {
    if (fs.existsSync(this.destinationPath('.circleci'))) {
      fs.rmdirSync(this.destinationPath('.circleci'), { recursive: true });
    }

    if (this.options.enable) {
      const pkg = this.fs.readJSON(this.destinationPath('package.json'));

      const checks = !!pkg.scripts && !!pkg.scripts.checks;
      const testing =
        this.options.testing && !!pkg.scripts && !!pkg.scripts.test;
      const build = this.options.build;

      copyAndFormatTpl(
        this.fs,
        this.templatePath(
          this.options.splitJobs
            ? 'github-action-push-workflow-split.yml.ejs'
            : 'github-action-push-workflow.yml.ejs',
        ),
        this.destinationPath('.github/workflows/push.yml'),
        {
          packageManager: this.options.packageManager,
          testing,
          checks,
          documentation: this.options.documentation,
          build,
          typescript: this.options.typescript,
          codecov: this.options.codecov,
          onlyLatestLTS: this.options.onlyLatestLTS,
          isReleasePleaseEnabled: this.isReleasePleaseEnabled,
          publishSinglePackage: this.isReleasePleaseEnabled && !pkg.private,
          publishMonorepo:
            this.isReleasePleaseEnabled &&
            inLerna &&
            inLerna.root &&
            inLerna.pobConfig?.project?.type === 'lib',
        },
      );

      ciContexts.push(
        'reviewflow',
        ...(this.options.splitJobs
          ? [
              checks && 'checks',
              build && 'build',
              'lint',
              testing && 'test (18)',
              testing && !this.options.onlyLatestLTS && 'test (20)',
            ].filter(Boolean)
          : [
              'build (18.x)',
              !this.options.onlyLatestLTS && 'build (20.x)',
            ].filter(Boolean)),
      );
    } else {
      this.fs.delete(this.destinationPath('.github/workflows/push.yml'));
    }

    if (
      this.options.enable &&
      !this.options.isApp &&
      (this.options.documentation ||
        (this.options.testing && this.options.testing.runner !== 'node'))
    ) {
      copyAndFormatTpl(
        this.fs,
        this.templatePath('github-action-documentation-workflow.yml.ejs'),
        this.destinationPath('.github/workflows/gh-pages.yml'),
        {
          packageManager: this.options.packageManager,
          testing: this.options.testing,
          typedoc: this.options.documentation && this.options.typescript,
        },
      );
    } else {
      this.fs.delete(this.destinationPath('.github/workflows/gh-pages.yml'));
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
