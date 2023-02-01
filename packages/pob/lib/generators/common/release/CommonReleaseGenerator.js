import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';
import { writeAndFormatJson } from '../../../utils/writeAndFormat.js';

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

    this.option('enableReleasePlease', {
      type: Boolean,
      required: true,
      desc: 'enable release-please',
    });

    this.option('packageNames', {
      type: String,
      required: true,
    });

    this.option('packageLocations', {
      type: String,
      required: true,
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const isReleasePleaseEnabled = this.options.enableReleasePlease;

    const isStandardVersionEnabled =
      this.options.enable &&
      !!pkg.devDependencies?.['standard-version'] &&
      !isReleasePleaseEnabled;

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

    if (isReleasePleaseEnabled && this.options.packageNames) {
      const packageLocations = JSON.parse(this.options.packageLocations);
      packageLocations.sort();

      const releasePleaseConfig = this.fs.readJSON(
        this.destinationPath('release-please-config.json'),
        {},
      );

      const getLastCommitSha = () =>
        this.spawnCommandSync('git', ['rev-parse', 'HEAD'], { stdio: 'pipe' })
          .stdout;

      this.fs.writeJSON(this.destinationPath('release-please-config.json'), {
        plugins: ['node-workspace'],
        'group-pull-request-title-pattern': 'chore: release',
        'bootstrap-sha':
          releasePleaseConfig['bootstrap-sha'] || getLastCommitSha(),
        packages: Object.fromEntries(
          packageLocations.map((packagePath) => [packagePath, {}]),
        ),
      });
      this.fs.copyTpl(
        this.templatePath('push-release-please.yml'),
        this.destinationPath('.github/workflows/push-release-please.yml'),
      );
    } else {
      this.fs.delete(this.destinationPath('release-please-config.json'));
      this.fs.delete(
        this.destinationPath('.github/workflows/push-release-please.yml'),
      );
    }

    writeAndFormatJson(this.fs, this.destinationPath('package.json'), pkg);
  }
}
