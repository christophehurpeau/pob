import Generator from 'yeoman-generator';
import inLerna from '../../../utils/inLerna.js';
import * as packageUtils from '../../../utils/package.js';

export default class CommonTestingGenerator extends Generator {
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

    this.option('typescript', {
      type: Boolean,
      required: true,
      desc: 'typescript',
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

    this.option('packageManager', {
      type: String,
      defaults: 'yarn',
      desc: 'yarn or npm',
    });
  }

  default() {
    if (!inLerna) {
      this.composeWith('pob:core:ci', {
        enable: this.options.ci,
        testing: this.options.testing,
        build: this.options.typescript,
        typescript: this.options.typescript,
        documentation: this.options.documentation,
        codecov: this.options.codecov,
        packageManager: this.options.packageManager,
      });
    } else {
      this.composeWith('pob:core:ci', {
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
      'babel-jest',
    ]);

    if (!this.options.enable) {
      packageUtils.removeDevDependencies(pkg, ['jest', '@types/jest']);

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
      const transpileWithBabel = packageUtils.transpileWithBabel(pkg);

      const shouldUseExperimentalVmModules =
        pkg.type === 'module' || transpileWithBabel;

      const jestCommand = `${
        shouldUseExperimentalVmModules
          ? 'NODE_OPTIONS=--experimental-vm-modules '
          : ''
      }jest`;

      packageUtils.addScripts(pkg, {
        test: jestCommand,
        'test:watch': `${jestCommand} --watch`,
        'generate:test-coverage': [
          'rm -Rf docs/coverage/',
          `NODE_ENV=production ${
            transpileWithBabel ? 'BABEL_ENV=test ' : ''
          }${jestCommand} --coverage --coverageReporters=pob-lcov-reporter --coverageDirectory=docs/coverage/`,
        ].join(' ; '),
      });

      packageUtils.addDevDependencies(pkg, [
        'pob-lcov-reporter',
        'jest',
        '@types/jest',
      ]);

      const hasReact = transpileWithBabel && packageUtils.hasReact(pkg);
      const srcDirectory = transpileWithBabel ? 'src' : 'lib';

      if (!pkg.jest) pkg.jest = {};
      Object.assign(pkg.jest, {
        cacheDirectory: './node_modules/.cache/jest',
        testMatch: [
          `<rootDir>/${srcDirectory}/**/__tests__/**/*.${
            transpileWithBabel ? 'ts' : '?(m)js'
          }${hasReact ? '?(x)' : ''}`,
          `<rootDir>/${srcDirectory}/**/*.test.${
            transpileWithBabel ? 'ts' : '?(m)js'
          }${hasReact ? '?(x)' : ''}`,
        ],
        collectCoverageFrom: [
          `${srcDirectory}/**/*.${transpileWithBabel ? 'ts' : '?(m)js'}${
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
        extensionsToTreatAsEsm: [
          transpileWithBabel && '.ts',
          transpileWithBabel && hasReact && '.tsx',
        ].filter(Boolean),
        // transform: {
        //   [`^.+\\.ts${hasReact ? 'x?' : ''}$`]: 'babel-jest',
        // },
      });
      delete pkg.jest.transform;

      if (
        babelEnvs.length === 0 ||
        babelEnvs.some((env) => env.target === 'node')
      ) {
        pkg.jest.testEnvironment = 'node';
      } else {
        delete pkg.jest.testEnvironment;
      }

      if (!transpileWithBabel) delete pkg.jest.transform;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
