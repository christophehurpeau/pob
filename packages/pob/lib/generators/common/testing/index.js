'use strict';

const Generator = require('yeoman-generator');
const inLerna = require('../../../utils/inLerna');
const packageUtils = require('../../../utils/package');

module.exports = class TestingGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable testing',
    });

    this.option('ci', {
      type: Boolean,
      required: true,
      desc: 'ci',
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
        enable: this.options.ci,
        testing: this.options.testing,
        documentation: this.options.documentation,
        codecov: this.options.codecov,
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
      'babel-core',
      'ts-jest',
    ]);

    if (!this.options.enable) {
      packageUtils.removeDevDependencies(pkg, [
        'jest',
        '@types/jest',
        'babel-jest',
      ]);

      delete pkg.jest;
      // if (inLerna) {
      //   if (pkg.scripts.test === 'echo "No tests"') {
      //     delete pkg.scripts.test;
      //   }
      //   delete pkg.scripts['generate:test-coverage'];
      // }
      if (pkg.scripts) {
        delete pkg.scripts.test;
        delete pkg.scripts['generate:test-coverage'];
        delete pkg.scripts['test:watch'];
      }

      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    } else {
      const babelEnvs = pkg.pob.babelEnvs || [];

      packageUtils.addScripts(pkg, {
        test: 'jest',
        'test:watch': 'jest',
        'generate:test-coverage': [
          'rm -Rf docs/coverage/',
          'NODE_ENV=production BABEL_ENV=test jest --coverage --coverageReporters=pob-lcov-reporter --coverageDirectory=docs/coverage/',
        ].join(' ; '),
      });

      packageUtils.addDevDependencies(pkg, [
        'pob-lcov-reporter',
        'jest',
        '@types/jest',
      ]);

      const transpileWithBabel = packageUtils.transpileWithBabel(pkg);
      const hasReact = transpileWithBabel && packageUtils.hasReact(pkg);
      const srcDirectory = transpileWithBabel ? 'src' : 'lib';

      packageUtils.addOrRemoveDevDependencies(pkg, transpileWithBabel, [
        'babel-jest',
      ]);

      if (!pkg.jest) pkg.jest = {};
      Object.assign(pkg.jest, {
        cacheDirectory: './node_modules/.cache/jest',
        testMatch: [
          `<rootDir>/${srcDirectory}/**/__tests__/**/*.${
            transpileWithBabel ? 'ts' : 'js'
          }${hasReact ? '?(x)' : ''}`,
          `<rootDir>/${srcDirectory}/**/*.test.${
            transpileWithBabel ? 'ts' : 'js'
          }${hasReact ? '?(x)' : ''}`,
        ],
        collectCoverageFrom: [
          `${srcDirectory}/**/*.${transpileWithBabel ? 'ts' : 'js'}${
            hasReact ? '?(x)' : ''
          }`,
        ],
        moduleFileExtensions: [
          transpileWithBabel && 'ts',
          transpileWithBabel && hasReact && 'tsx',
          'js',
          // 'jsx',
          'json',
        ].filter(Boolean),
        transform: {
          [`^.+\\.ts${hasReact ? 'x?' : ''}$`]: 'babel-jest',
        },
      });

      if (babelEnvs.find((env) => env.target === 'node')) {
        pkg.jest.testEnvironment = 'node';
      } else {
        delete pkg.jest.testEnvironment;
      }

      if (!transpileWithBabel) delete pkg.jest.transform;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
