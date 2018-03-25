const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');
const inLerna = require('../../../utils/inLerna');

module.exports = class TestingGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable testing',
    });

    this.option('circleci', {
      type: Boolean,
      required: true,
      desc: 'circleci',
    });

    // this.option('travisci', {
    //   type: Boolean,
    //   required: true,
    //   desc: 'travisci',
    // });

    this.option('babelEnvs', {
      type: String,
      required: true,
      desc: 'Babel Envs',
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
    if (!inLerna) {
      this.composeWith(require.resolve('../../core/ci'), {
        enable: this.options.enable,
        testing: this.options.testing,
        documentation: this.options.documentation,
        circleci: this.options.circleci,
        babelEnvs: this.options.babelEnvs,
      });
    } else {
      this.composeWith(require.resolve('../../core/ci'), {
        enable: false,
      });
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.removeDevDependencies(pkg, [
      'coveralls',
      'mocha',
      'istanbul',
    ]);

    if (!this.options.enable) {
      packageUtils.removeDevDependencies(pkg, [
        'jest',
        'babel-jest',
      ]);

      if (inLerna) {
        packageUtils.addScripts(pkg, {
          test: 'No tests',
        });
      } else {
        delete pkg.jest;
        if (pkg.scripts) {
          delete pkg.scripts.test;
          delete pkg.scripts['generate:test-coverage'];
        }
      }

      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    } else {
      this.babelEnvs = JSON.parse(this.options.babelEnvs);

      packageUtils.addScripts(pkg, {
        test: 'jest',
        'generate:test-coverage': [
          'rm -Rf docs/coverage/',
          'NODE_ENV=production BABEL_ENV=test jest --coverage --coverageReporters=lcov --coverageDirectory=docs/coverage/',
        ].join(' ; '),
      });

      packageUtils.addDevDependencies(pkg, {
        jest: '^22.4.2',
      });

      const hasBabel = packageUtils.transpileWithBabel(pkg);
      const hasReact = hasBabel && packageUtils.hasReact(pkg);
      const srcDirectory = hasBabel ? 'src' : 'lib';

      packageUtils.addOrRemoveDevDependencies(pkg, hasBabel, { 'babel-jest': '^22.4.1' });

      if (!pkg.jest) pkg.jest = {};
      Object.assign(pkg.jest, {
        cacheDirectory: './node_modules/.cache/jest',
        testMatch: [
          `<rootDir>/${srcDirectory}/**/__tests__/**/*.js${hasReact ? '?(x)' : ''}`,
          `<rootDir>/${srcDirectory}/**/*.test.js${hasReact ? '?(x)' : ''}`,
        ],
        collectCoverageFrom: [
          `${srcDirectory}/**/*.js${hasReact ? '?(x)' : ''}`,
        ],
      });
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  end() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (!this.options.enable) {
      if (this.fs.exists('flow-typed')) this.fs.delete('flow-typed');
    } else {
      this.spawnCommandSync('flow-typed', ['install', `jest@${pkg.devDependencies.jest}`]);
    }
  }
};
