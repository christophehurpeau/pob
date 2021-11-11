import Generator from 'yeoman-generator';
import inLerna from '../../../utils/inLerna.js';
import * as packageUtils from '../../../utils/package.js';

export default class LibReleaseGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      required: true,
      desc: 'If releasing is enabled',
    });

    this.option('withBabel', {
      type: Boolean,
      required: false,
      defaults: undefined,
      desc: 'Babel enabled.',
    });

    this.option('documentation', {
      type: Boolean,
      required: true,
      desc: 'Include documentation',
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const isReleasePleaseEnabled =
      this.options.enable &&
      this.fs.exists(
        this.destinationPath('.github/workflows/release-please.yml'),
      );
    const isStandardVersionEnabled =
      this.options.enable && !isReleasePleaseEnabled;

    if (!isStandardVersionEnabled) {
      packageUtils.removeDevDependencies(pkg, ['standard-version']);
      packageUtils.removeScripts(pkg, ['release', 'preversion']);
    } else {
      packageUtils.addDevDependencies(pkg, ['standard-version']);
      packageUtils.addScripts(pkg, {
        release:
          "repository-check-dirty && yarn preversion && standard-version -a -m 'chore(release): %s [skip ci]' && git push --follow-tags origin master && npm publish",
        preversion: [
          'yarn run lint',
          this.options.withBabel && 'yarn run build',
          this.options.documentation && 'yarn run generate:docs',
          'repository-check-dirty',
        ]
          .filter(Boolean)
          .join(' && '),
      });

      if (pkg.scripts.version === 'pob-version') {
        delete pkg.scripts.version;
      }
    }

    if (!isReleasePleaseEnabled) {
      this.fs.delete(
        this.destinationPath('.github/workflows/release-please.yml'),
      );
    } else {
      this.fs.copyTpl(
        this.templatePath('release-please.yml.ejs'),
        this.destinationPath('.github/workflows/release-please.yml'),
        {
          isLerna: !!inLerna,
          // publish: ...
        },
      );
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
