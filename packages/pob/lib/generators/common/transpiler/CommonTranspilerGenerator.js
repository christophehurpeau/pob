import fs from 'node:fs';
import semver from 'semver';
import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

export default class CommonTranspilerGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'Avoid asking questions',
    });

    this.option('testing', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'Has testing.',
    });

    this.option('fromPob', {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option('isApp', {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option('isAppLibrary', {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option('useAppConfig', {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option('srcDirectory', {
      type: String,
      required: false,
      default: 'src',
    });

    this.option('buildDirectory', {
      type: String,
      required: false,
      default: 'dist',
    });

    this.option('onlyLatestLTS', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'only latest lts',
    });
  }

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    let pobConfig = pkg.pob;

    const hasInitialPkgPob = !!pkg.pob;
    if (!hasInitialPkgPob) pkg.pob = {};

    const babelEnvs = pkg.pob.babelEnvs || [];

    if (babelEnvs) {
      // skip as it is using babel with rollup
      return;
    }

    if (!hasInitialPkgPob || !this.options.updateOnly) {
      pobConfig = await this.prompt([
        {
          type: 'confirm',
          name: 'typescript',
          message: 'Enable Typescript ?',
          default: false,
        },
        {
          type: 'confirm',
          name: 'rollup',
          message: 'Enable Rollup ?',
          default: true,
          when: ({ typescript }) => !!typescript,
        },
        {
          type: 'confirm',
          name: 'jsx',
          message: 'Enable JSX ?',
          when: ({ typescript }) => !!typescript,
        },
      ]);
    }

    if (!pobConfig.typescript) {
      delete pkg.pob.entries;
      delete pkg.pob.jsx;
    } else if (pkg.pob.jsx === false) {
      delete pkg.pob.jsx;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  configuring() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    this.entries = pkg.pob.entries;
    this.babelEnvs = pkg.pob.babelEnvs || [];

    if (this.babelEnvs.length > 0 || pkg.pob.typescript) {
      fs.mkdirSync(this.destinationPath('src'), { recursive: true });
    } else {
      // recursive does not throw if directory already exists
      fs.mkdirSync(this.destinationPath('lib'), { recursive: true });
    }
  }

  default() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const withTypescript = pkg.pob.typescript;
    const withBabel = this.babelEnvs && this.babelEnvs.length > 0;
    const useRollup = (withBabel || withTypescript) && pkg.pob.rollup !== false;

    const cleanCommand = (() => {
      if (useRollup) {
        if (withTypescript) return 'pob-typescript-clean-out';
        return 'pob-babel-clean-out';
      }
      return null;
    })();

    /* scripts */

    if (this.options.isApp) {
      packageUtils.removeScripts(['watch']);
      packageUtils.addOrRemoveScripts(pkg, useRollup, {
        'clean:build': `${cleanCommand} ${this.options.buildDirectory}`,
        clean: 'yarn clean:build',
      });

      packageUtils.addOrRemoveScripts(pkg, useRollup || withTypescript, {
        start: useRollup
          ? 'yarn clean:build && rollup --config rollup.config.mjs --watch'
          : 'tsc --watch',
      });
    } else {
      packageUtils.removeScripts(['start']);
      packageUtils.addOrRemoveScripts(pkg, useRollup, {
        'clean:build': `${cleanCommand} ${this.options.buildDirectory}`,
      });
    }
    packageUtils.addOrRemoveScripts(pkg, useRollup || withTypescript, {
      build: useRollup
        ? 'yarn clean:build && rollup --config rollup.config.mjs'
        : 'tsc',
    });

    const shouldBuildDefinitions = !this.options.isApp && useRollup;
    packageUtils.addOrRemoveScripts(pkg, shouldBuildDefinitions, {
      'build:definitions': 'tsc -p tsconfig.json',
    });

    if (shouldBuildDefinitions) {
      pkg.scripts.build += ' && yarn run build:definitions';
    } else if (!this.options.isApp && !useRollup && !withTypescript) {
      // check definitions, but also force lerna to execute build:definitions in right order
      // example: nightingale-types depends on nightingale-levels
      if (this.fs.exists(this.destinationPath('lib/index.d.ts'))) {
        packageUtils.addScripts(pkg, {
          'build:definitions':
            'tsc --lib esnext --noEmit --skipLibCheck ./lib/index.d.ts',
          build: 'yarn run build:definitions',
        });
      }

      if (this.fs.exists(this.destinationPath('lib/index.ts'))) {
        packageUtils.addScripts(pkg, {
          'build:definitions':
            'tsc --lib esnext --noEmit --skipLibCheck ./lib/index.ts',
          build: 'yarn run build:definitions',
        });
      }
    }

    if (pkg.scripts) {
      delete pkg.scripts.postbuild;
      delete pkg.scripts['build:dev'];
      delete pkg.scripts['watch:dev'];
    }

    /* dependencies */

    packageUtils.addOrRemoveDevDependencies(pkg, useRollup && withTypescript, [
      '@pob/rollup-typescript',
    ]);
    packageUtils.addOrRemoveDependencies(pkg, useRollup && withTypescript, [
      'tslib',
    ]);

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      useRollup &&
        this.options.isApp &&
        !this.options.isAppLibrary &&
        this.options.useAppConfig,
      ['alp-rollup-plugin-config'],
    );

    /* engines */
    // TODO move from CommonBabelGenerator

    /* side effects */

    if (this.options.isApp && !this.options.isAppLibrary) {
      delete pkg.sideEffects;
    } else if (!('sideEffects' in pkg)) {
      pkg.sideEffects = true;
      console.warn('Setting pkg.sideEffects to true, as it was not defined');
    } else if (pkg.sideEffects) {
      console.warn(
        "pkg.sideEffects is true, are you sure you can't set it to false ?",
      );
    }

    /* main / aliases / typing */

    if (this.options.isApp && !this.options.isAppLibrary) {
      delete pkg.types;
      delete pkg.typings;
    } else if (pkg.typings) {
      if (!pkg.types) pkg.types = pkg.typings;
      delete pkg.typings;
    }

    // if (!pkg.main || pkg.main.startsWith('./lib/')) {
    if (useRollup || withTypescript) {
      // see pkg.exports instead.
      delete pkg.main;
      if (!this.options.isApp) {
        pkg.types = `./${
          this.options.buildDirectory
        }/${'definitions/'}index.d.ts`;
      } else if (this.options.isAppLibrary) {
        pkg.types = `./${this.options.srcDirectory}/index.ts`;
      }
    } else {
      if (!pkg.main) {
        pkg.exports = './lib/index.js';
      }
      if (pkg.type === 'module' && this.fs.exists('./lib/index.cjs')) {
        pkg.main = './lib/index.cjs';
      } else {
        pkg.main = './lib/index.js';
      }
      if (!this.options.isApp || this.options.isAppLibrary) {
        if (this.fs.exists('./lib/index.ts')) {
          pkg.types = './lib/index.ts';
        } else if (this.fs.exists('./lib/index.d.ts') || pkg.types) {
          pkg.types = './lib/index.d.ts';
        }
      }
      if (!pkg.engines) pkg.engines = {};
      if (
        !pkg.engines.node ||
        semver.lt(semver.minVersion(pkg.engines.node), '18.0.0')
      ) {
        pkg.engines.node = '>=18.0.0';
      }
    }

    delete pkg['browser-dev'];
    delete pkg['module-dev'];

    const envs = pkg.pob.babelEnvs ||
      pkg.pob.envs || [
        {
          target: 'node',
          version: '18',
        },
      ];

    const esAllBrowserEnv = envs.find(
      (env) =>
        env.target === 'browser' &&
        env.version === undefined &&
        (!env.formats || env.formats.includes('es')),
    );

    // Legacy "dev" builds
    delete pkg['module:browser'];
    delete pkg['module:browser-dev'];
    delete pkg['module:modern-browsers'];
    delete pkg['module:modern-browsers-dev'];
    delete pkg['module:node'];
    delete pkg['module:node-dev'];

    /* webpack 4 */
    if (esAllBrowserEnv) {
      pkg.module = `./${this.options.buildDirectory}/index-browser.es.js`;
      pkg.browser = `./${this.options.buildDirectory}/index-browser.es.js`;
    } else {
      delete pkg.module;
      delete pkg.browser;
    }

    /* webpack 5 and node with ESM support */
    if (useRollup || withTypescript) {
      pkg.exports = {
        './package.json': './package.json',
      };

      this.entries.forEach((entry) => {
        const isBrowserOnly =
          withBabel &&
          entry === 'browser' &&
          (envs?.every((env) => env.target === 'browser') ||
            (this.entries.length === 2 && this.entries.includes('index')));
        const entryDistName = isBrowserOnly ? 'index' : entry;
        const exportName = entry === 'index' ? '.' : `./${entry}`;

        const targets = {
          types:
            pkg.private || this.options.isAppLibrary
              ? `./src/${entryDistName}.ts`
              : `./${this.options.buildDirectory}/${
                  useRollup ? 'definitions/' : ''
                }${entryDistName}.d.ts`,
        };

        const defaultNodeEnv =
          withBabel || withTypescript
            ? envs.find((env) => env.target === 'node')
            : undefined;

        const defaultNodeEnvVersion = defaultNodeEnv && defaultNodeEnv.version;

        envs.forEach(({ target, version, formats, omitVersionInFileName }) => {
          if (target === 'node' && entry === 'browser') return;

          const exportTarget = {};

          if (target === 'node') {
            const cjsExt = pkg.type === 'module' ? 'cjs' : 'cjs.js';
            const filenameWithoutExt = `${entryDistName}-${target}${
              omitVersionInFileName ? '' : version
            }`;
            if (!formats || formats.includes('es')) {
              exportTarget.import = `./${this.options.buildDirectory}/${filenameWithoutExt}.mjs`;

              if (formats && formats.includes('cjs')) {
                exportTarget.require = `./${this.options.buildDirectory}/${filenameWithoutExt}.${cjsExt}`;
              }
            } else if (formats && formats.includes('cjs')) {
              exportTarget.default = `./${this.options.buildDirectory}/${filenameWithoutExt}.${cjsExt}`;
            }
            // eslint: https://github.com/benmosher/eslint-plugin-import/issues/2132
            // jest: https://github.com/facebook/jest/issues/9771
            if (!pkg.main && exportName === '.') {
              pkg.main =
                pkg.type === 'module'
                  ? exportTarget.import
                  : exportTarget.default ||
                    exportTarget.require ||
                    exportTarget.import;
            }
          } else if (target === 'browser') {
            if (!formats || formats.includes('es')) {
              exportTarget.import = `./${
                this.options.buildDirectory
              }/${entryDistName}-${target}${version || ''}.es.js`;
            }

            if (formats && formats.includes('cjs')) {
              exportTarget.require = `./${
                this.options.buildDirectory
              }/index-${target}${version || ''}.cjs.js`;
            }
          }

          if (
            !version ||
            (target === 'node' && version === defaultNodeEnvVersion)
          ) {
            targets[target] = {
              ...targets[target],
              ...exportTarget,
            };
          } else {
            targets[target] = {
              [`${target}:${version}`]: exportTarget,
              ...targets[target],
            };
          }
        });

        pkg.exports[exportName] = targets;
      });

      if (pkg.pob.extraEntries) {
        pkg.pob.extraEntries.forEach((extraEntryConfig) => {
          if (typeof extraEntryConfig === 'string') {
            extraEntryConfig = {
              name: extraEntryConfig,
            };
          }

          const calcExport = () => {
            if (pkg.type === 'module') {
              return extraEntryConfig.name.endsWith('.cjs') ||
                extraEntryConfig.name.endsWith('.d.ts')
                ? `./${extraEntryConfig.name}`
                : `./${extraEntryConfig.name}.js`;
            }

            return {
              import: `./${extraEntryConfig.name}.mjs`,
              require: `./${extraEntryConfig.name}.js`,
            };
          };

          let exportValue = calcExport();

          if (extraEntryConfig.types) {
            if (typeof exportValue === 'string') {
              exportValue = {
                types: `./${extraEntryConfig.types}`,
                default: exportValue,
              };
            } else {
              exportValue = {
                types: `./${extraEntryConfig.types}`,
                ...exportValue,
              };
            }
          }

          pkg.exports[`./${extraEntryConfig.name}`] = exportValue;
        });
      }
    } else if (!pkg.exports) {
      console.error('Please setup your package.exports manually.');
    } else {
      if (typeof pkg.exports === 'string') {
        pkg.exports = {
          '.': pkg.exports,
        };
      }
      if (!pkg.exports['./package.json']) {
        pkg.exports['./package.json'] = './package.json';
      }

      if (pkg.types && !pkg.exports['.'].types) {
        if (typeof pkg.exports['.'] === 'string') {
          pkg.exports['.'] = {
            default: pkg.exports['.'],
          };
        }
        pkg.exports['.'] = { types: pkg.types, ...pkg.exports['.'] };
      }
    }

    Object.keys(pkg).forEach((key) => {
      if (!key.startsWith('module:') && !key.startsWith('webpack:')) return;
      delete pkg[key];
    });

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const entries = pkg.pob.entries || ['index'];

    this.fs.delete('rollup.config.js');
    if (pkg.pob.typescript && pkg.pob.rollup !== false) {
      if (this.options.isApp) {
        copyAndFormatTpl(
          this.fs,
          this.templatePath('app.rollup.config.mjs.ejs'),
          this.destinationPath('rollup.config.mjs'),
          {
            config: this.options.useAppConfig,
            outDirectory: this.options.buildDirectory,
            enableRun: !this.options.isAppLibrary && entries.includes('index'),
          },
        );
      } else {
        copyAndFormatTpl(
          this.fs,
          this.templatePath('lib.rollup.config.mjs.ejs'),
          this.destinationPath('rollup.config.mjs'),
          {
            outDirectory: this.options.buildDirectory,
          },
        );
      }
    } else if (!pkg.pob.babelEnvs || pkg.pob.babelEnvs.length === 0) {
      this.fs.delete('rollup.config.mjs');
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
