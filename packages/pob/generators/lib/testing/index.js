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
        codecov: this.options.codecov,
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

    const transpileWithBabel = packageUtils.transpileWithBabel(pkg);

    packageUtils.removeDevDependencies(pkg, [
      'coveralls',
      'mocha',
      'istanbul',
    ]);

    if (!this.options.enable) {
      packageUtils.removeDevDependencies(pkg, [
        'jest',
        '@types/jest',
        'babel-jest',
      ]);

      delete pkg.jest;
      if (inLerna) {
        packageUtils.addScripts(pkg, {
          test: 'echo "No tests"',
        });
        delete pkg.scripts['generate:test-coverage'];
      } else if (pkg.scripts) {
        delete pkg.scripts.test;
        delete pkg.scripts['generate:test-coverage'];
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
        jest: '23.5.0',
        '@types/jest': '23.3.1',
      });

      const hasBabel = packageUtils.transpileWithBabel(pkg);
      const hasReact = hasBabel && packageUtils.hasReact(pkg);
      const srcDirectory = hasBabel ? 'src' : 'lib';

      packageUtils.addOrRemoveDevDependencies(pkg, hasBabel, { 'babel-jest': '23.4.@' });

      if (!pkg.jest) pkg.jest = {};
      Object.assign(pkg.jest, {
        cacheDirectory: './node_modules/.cache/jest',
        testMatch: [
          `<rootDir>/${srcDirectory}/**/__tests__/**/*.${transpileWithBabel ? 'ts' : 'js'}${hasReact ? '?(x)' : ''}`,
          `<rootDir>/${srcDirectory}/**/*.test.${transpileWithBabel ? 'ts' : 'js'}${hasReact ? '?(x)' : ''}`,
        ],
        collectCoverageFrom: [
          `${srcDirectory}/**/*.${transpileWithBabel ? 'ts' : 'js'}${hasReact ? '?(x)' : ''}`,
        ],
        moduleFileExtensions: [
          transpileWithBabel && 'ts',
          transpileWithBabel && hasReact && 'tsx',
          'js',
          // 'jsx',
        ].filter(Boolean),
        transform: {
          [`^.+\\.ts${hasReact ? 'x?' : ''}$`]: 'babel-jest',
        },
      });

      if (!transpileWithBabel) delete pkg.jest.transform;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
