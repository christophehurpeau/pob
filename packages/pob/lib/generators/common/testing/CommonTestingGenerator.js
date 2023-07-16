import path from 'node:path';
import Generator from 'yeoman-generator';
import inLerna from '../../../utils/inLerna.js';
import * as packageUtils from '../../../utils/package.js';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

export default class CommonTestingGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('monorepo', {
      type: Boolean,
      default: false,
      desc: 'is root monorepo',
    });

    this.option('enable', {
      type: Boolean,
      default: true,
      desc: 'enable testing',
    });

    this.option('runner', {
      type: String,
      default: 'jest',
      desc: 'test runner (jest or node)',
    });

    this.option('enableReleasePlease', {
      type: Boolean,
      default: true,
      desc: 'enable release-please',
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

    this.option('build', {
      type: Boolean,
      required: true,
      desc: 'build (with babel or typescript)',
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
      default: 'yarn',
      desc: 'yarn or npm',
    });

    this.option('isApp', {
      type: Boolean,
      required: true,
      desc: 'is app',
    });

    this.option('splitCIJobs', {
      type: Boolean,
      required: true,
      desc: 'split CI jobs for faster result',
    });

    this.option('onlyLatestLTS', {
      type: Boolean,
      required: true,
      desc: 'only latest lts',
    });

    this.option('srcDir', {
      type: String,
      default: 'src',
      desc: 'customize srcDir, if different than rootDir',
    });
  }

  default() {
    if (!inLerna || inLerna.root) {
      this.composeWith('pob:core:ci', {
        enable: this.options.ci,
        enableReleasePlease: this.options.enableReleasePlease,
        testing: this.options.enable,
        build: this.options.build,
        typescript: this.options.typescript,
        documentation: this.options.documentation,
        codecov: this.options.codecov,
        packageManager: this.options.packageManager,
        isApp: this.options.isApp,
        splitJobs: this.options.splitCIJobs,
        onlyLatestLTS: this.options.onlyLatestLTS,
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
      'pob-lcov-reporter',
    ]);

    const yoConfigPobMonorepo = inLerna && inLerna.pobMonorepoConfig;
    const globalTesting = yoConfigPobMonorepo && yoConfigPobMonorepo.testing;
    const enableForMonorepo = this.options.monorepo && globalTesting;
    const transpileWithEsbuild = packageUtils.transpileWithEsbuild(pkg);
    const transpileWithBabel = transpileWithEsbuild
      ? false
      : // eslint-disable-next-line unicorn/no-nested-ternary
      this.options.monorepo
      ? yoConfigPobMonorepo.typescript
      : packageUtils.transpileWithBabel(pkg);
    let hasReact =
      transpileWithBabel &&
      (this.options.monorepo
        ? yoConfigPobMonorepo.react ?? packageUtils.hasReact(pkg)
        : packageUtils.hasReact(pkg));

    if (this.options.enable || this.options.runner !== 'jest') {
      packageUtils.removeDevDependencies(pkg, ['jest', '@types/jest']);

      delete pkg.jest;
    }

    if (!this.options.enable) {
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
        delete pkg.scripts['test:coverage'];
      }

      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    } else {
      if (this.options.runner === 'jest') {
        packageUtils.addOrRemoveDevDependencies(
          pkg,
          enableForMonorepo || !globalTesting,
          ['jest', '@types/jest'],
        );
      }

      packageUtils.removeScripts(['test:coverage']);
      if (this.options.monorepo && !globalTesting) {
        delete pkg.jest;
        packageUtils.addScripts(pkg, {
          test: 'yarn workspaces foreach --parallel -Av run test',
        });
      } else if (this.options.monorepo) {
        const shouldUseExperimentalVmModules = pkg.type === 'module';

        const testCommand =
          this.options.runner === 'jest'
            ? `${
                shouldUseExperimentalVmModules
                  ? 'NODE_OPTIONS=--experimental-vm-modules '
                  : ''
              }jest`
            : 'node --test';

        packageUtils.addScripts(pkg, {
          test: testCommand,
          'test:watch': `${testCommand} --watch`,
          'test:coverage':
            this.options.runner === 'jest'
              ? `${testCommand} --coverage --coverageReporters=json --coverageReporters=text`
              : testCommand, // not yet configured
        });

        if (this.options.runner === 'jest') {
          const workspacesWithoutStar = pkg.workspaces.map((workspace) => {
            if (!workspace.endsWith('/*')) {
              throw new Error(`Invalid workspace format: ${workspace}`);
            }
            return workspace.slice(0, -2);
          });
          const workspacesPattern =
            workspacesWithoutStar.length === 1
              ? workspacesWithoutStar[0]
              : `@(${workspacesWithoutStar.join('|')})`;
          hasReact = yoConfigPobMonorepo.packageNames.some((pkgName) =>
            pkgName.startsWith('react-'),
          );

          if (!pkg.jest) pkg.jest = {};
          const srcDir = this.options.srcDir;
          Object.assign(pkg.jest, {
            cacheDirectory: './node_modules/.cache/jest',
            testEnvironment: 'node',
            testMatch: [
              `<rootDir>/${workspacesPattern}/*/@(${srcDir}|lib)/**/__tests__/**/*.${
                transpileWithBabel ? '(ts|js|cjs|mjs)' : '(js|cjs|mjs)'
              }${hasReact ? '?(x)' : ''}`,
              `<rootDir>/${workspacesPattern}/*/@(${srcDir}|lib)/**/*.test.${
                transpileWithBabel ? '(ts|js|cjs|mjs)' : '(js|cjs|mjs)'
              }${hasReact ? '?(x)' : ''}`,
            ],
          });

          if (shouldUseExperimentalVmModules) {
            pkg.jest.extensionsToTreatAsEsm = [
              transpileWithBabel && '.ts',
              transpileWithBabel && hasReact && '.tsx',
            ].filter(Boolean);
          } else {
            delete pkg.jest.extensionsToTreatAsEsm;
          }
        }
      } else if (globalTesting) {
        delete pkg.jest;
        if (pkg.scripts) {
          delete pkg.scripts['generate:test-coverage'];
          delete pkg.scripts['test:watch'];
          delete pkg.scripts['test:coverage'];
        }
        packageUtils.addScripts(pkg, {
          test: `yarn ../../ run test -- ${path
            .relative('../..', '.')
            .replace('\\', '/')}`,
        });
      } else {
        const babelEnvs = pkg.pob?.babelEnvs || [];
        const transpileWithBabel = packageUtils.transpileWithBabel(pkg);

        const shouldUseExperimentalVmModules =
          pkg.type === 'module' && !inLerna;

        const testCommand =
          this.options.runner === 'jest'
            ? `${
                shouldUseExperimentalVmModules
                  ? 'NODE_OPTIONS=--experimental-vm-modules '
                  : ''
              }jest`
            : 'node --test';

        packageUtils.addScripts(pkg, {
          test: testCommand,
          'test:watch': `${testCommand} --watch`,
          'test:coverage':
            this.options.runner === 'jest'
              ? `${testCommand}  --coverage --coverageReporters=json --coverageReporters=text`
              : testCommand, // not yet configured,
        });

        if (this.options.runner === 'jest') {
          const srcDirectory = transpileWithBabel ? this.options.srcDir : 'lib';

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
            // transform: {
            //   [`^.+\\.ts${hasReact ? 'x?' : ''}$`]: 'babel-jest',
            // },
          });
          if (transpileWithEsbuild) {
            pkg.jest.transform = {
              [hasReact ? '^.+\\.tsx?$' : '^.+\\.ts$']: [
                'jest-esbuild',
                {
                  format: shouldUseExperimentalVmModules ? 'esm' : 'cjs',
                },
              ],
            };
          } else {
            delete pkg.jest.transform;
          }

          if (shouldUseExperimentalVmModules) {
            pkg.jest.extensionsToTreatAsEsm = [
              transpileWithBabel && '.ts',
              transpileWithBabel && hasReact && '.tsx',
            ].filter(Boolean);
          } else {
            delete pkg.jest.extensionsToTreatAsEsm;
          }

          if (
            babelEnvs.length === 0 ||
            babelEnvs.some((env) => env.target === 'node')
          ) {
            pkg.jest.testEnvironment = 'node';
          } else {
            delete pkg.jest.testEnvironment;
          }

          if (!transpileWithBabel) delete pkg.jest.transform;
        } else {
          delete pkg.jest;
        }
      }
    }

    if (
      transpileWithBabel &&
      ((this.options.monorepo && globalTesting) || !globalTesting)
    ) {
      // cjs for jest compat
      copyAndFormatTpl(
        this.fs,
        this.templatePath('babel.config.cjs.ejs'),
        this.destinationPath('babel.config.cjs'),
        {
          only: !this.options.monorepo
            ? `'${this.options.srcDir}'`
            : pkg.workspaces
                .flatMap((workspace) => [
                  `'${workspace}/${this.options.srcDir}'`,
                  `'${workspace}/lib'`,
                ])
                .join(', '),
          hasReact,
          hasLinaria:
            !!pkg.devDependencies?.['@linaria/babel-preset'] ||
            !!pkg.devDependencies?.['alp-dev'],
          testing: this.options.testing,
          jestExperimentalESM: pkg.type === 'module',
        },
      );
    } else {
      this.fs.delete('babel.config.cjs');
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
