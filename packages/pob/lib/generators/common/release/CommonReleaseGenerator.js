import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';

export default class CommonReleaseGenerator extends Generator {
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

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const isStandardVersionEnabled =
      this.options.enable && !!pkg.devDependencies?.['standard-version'];

    if (!isStandardVersionEnabled) {
      packageUtils.removeDevDependencies(pkg, ['standard-version']);
      packageUtils.removeScripts(pkg, [
        'release',
        pkg.name === 'pob-dependencies' ? null : 'preversion',
      ]);
    } else {
      packageUtils.addScripts(pkg, {
        release:
          "repository-check-dirty && yarn preversion && standard-version -a -m 'chore(release): %s [skip ci]' && git push --follow-tags origin master && npm publish",
        preversion: [
          'yarn run lint',
          this.options.withBabel && 'yarn run build',
          'repository-check-dirty',
        ]
          .filter(Boolean)
          .join(' && '),
      });

      if (pkg.scripts.version === 'pob-version') {
        delete pkg.scripts.version;
      }
    }

    if (
      this.fs.exists(
        this.destinationPath('.github/workflows/release-please.yml'),
      )
    ) {
      this.fs.delete(
        this.destinationPath('.github/workflows/release-please.yml'),
      );
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
