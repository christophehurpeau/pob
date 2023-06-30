import fs from 'fs';
import semver from 'semver';
import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

export default class CommonBabelGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });

    this.option('testing', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Has testing.',
    });

    this.option('fromPob', {
      type: Boolean,
      required: false,
      defaults: false,
    });

    this.option('isApp', {
      type: Boolean,
      required: false,
      defaults: false,
    });

    this.option('useAppConfig', {
      type: Boolean,
      required: false,
      defaults: false,
    });

    this.option('buildDirectory', {
      type: String,
      required: false,
      defaults: 'dist',
    });
  }

  initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (pkg.pob && pkg.pob.babelEnvs) {
      let babelEnvs = pkg.pob.babelEnvs;
      if (
        !babelEnvs.some(
          (env) => env.target === 'node' && String(env.version) === '18',
        ) &&
        babelEnvs.some(
          (env) =>
            env.target === 'node' &&
            (String(env.version) === '8' ||
              String(env.version) === '6' ||
              String(env.version) === '10' ||
              String(env.version) === '12' ||
              String(env.version) === '14' ||
              String(env.version) === '16'),
        )
      ) {
        babelEnvs.unshift({
          target: 'node',
          version: '18',
        });
      }
      babelEnvs = babelEnvs.filter(
        (env) => env.target !== 'node' || env.version >= 18,
      );

      pkg.pob.babelEnvs = babelEnvs;
      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    }
  }

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const hasInitialPkgPob = !!pkg.pob;

    if (!hasInitialPkgPob) pkg.pob = {};

    const babelEnvs = pkg.pob.babelEnvs || [];

    const targets = [
      babelEnvs.some((env) => env.target === 'node') ? 'node' : undefined,
      babelEnvs.some((env) => env.target === 'browser') ? 'browser' : undefined,
    ].filter(Boolean);
    const nodeVersions = [
      ...new Set(
        babelEnvs
          .filter((env) => env.target === 'node')
          .map((env) => {
            if (env.version === '14' || env.version === '16') return '18';
            return env.version;
          }),
      ),
    ];
    const browserVersions = babelEnvs
      .filter((env) => env.target === 'browser')
      .map((env) => (env.version === undefined ? 'supported' : env.version));
    const formats = [
      babelEnvs.some((env) => env.formats?.includes('cjs')) ? 'cjs' : undefined,
      babelEnvs.some((env) => !env.formats || env.formats.includes('es'))
        ? 'es'
        : undefined,
    ].filter(Boolean);
    const jsx =
      (pkg.pob.jsx || pkg.pob.withReact) === undefined
        ? packageUtils.hasReact(pkg)
        : pkg.pob.jsx || pkg.pob.withReact;

    let babelConfig = { targets, nodeVersions, browserVersions, formats, jsx };

    if (!hasInitialPkgPob || !this.options.updateOnly) {
      babelConfig = await this.prompt([
        {
          type: 'checkbox',
          name: 'targets',
          message:
            "Babel targets: (don't select anything if you don't want babel)",
          default: targets,
          choices: [
            {
              name: 'Node',
              value: 'node',
            },
            {
              name: 'Browser',
              value: 'browser',
            },
          ],
        },

        {
          type: 'checkbox',
          name: 'nodeVersions',
          message: 'Babel node versions: (https://github.com/nodejs/Release)',
          when: ({ targets = [] }) => targets.includes('node'),
          validate: (versions) => versions.length > 0,
          default: nodeVersions,
          choices: [
            {
              name: '18 (Active LTS)',
              value: '18',
            },
          ],
        },

        {
          type: 'checkbox',
          name: 'browserVersions',
          message: 'Babel browser versions',
          when: ({ targets = [] }) => targets.includes('browser'),
          validate: (versions) => versions.length > 0,
          default: browserVersions,
          choices: [
            {
              name: 'Modern',
              value: 'modern',
            },
            {
              name: 'Supported',
              value: 'supported',
            },
          ],
        },

        {
          type: 'confirm',
          name: 'jsx',
          message: 'Enable JSX ?',
          when: ({ targets = [] }) => targets.length > 0,
          default: jsx,
        },
      ]);
    }

    if (hasInitialPkgPob && pkg.main && !pkg.exports) {
      const result = await this.prompt({
        type: 'confirm',
        name: 'setupExports',
        message: 'Setup package.json "exports" field based on "main" ?',
      });

      if (result.setupExports) {
        pkg.exports = pkg.main;
      }
    }

    const newBabelEnvs = [
      ...(babelConfig.nodeVersions || []).map((version) => ({
        target: 'node',
        version,
        formats:
          babelConfig.formats && babelConfig.formats.includes('cjs')
            ? // eslint-disable-next-line unicorn/no-nested-ternary
              version === '16' || version === '18'
              ? babelConfig.formats
              : undefined
            : undefined,
      })),
      ...(babelConfig.browserVersions || []).map((version) => ({
        target: 'browser',
        version: version === 'supported' ? undefined : version,
        formats:
          babelConfig.formats && babelConfig.formats.includes('cjs')
            ? // eslint-disable-next-line unicorn/no-nested-ternary
              version === 'supported'
              ? babelConfig.formats
              : undefined
            : undefined,
      })),
    ];

    delete pkg.pob.withReact;
    if (newBabelEnvs.length === 0) {
      delete pkg.pob.babelEnvs;
      delete pkg.pob.entries;
      delete pkg.pob.jsx;
    } else {
      pkg.pob.babelEnvs = newBabelEnvs;
      pkg.pob.entries = pkg.pob.entries || ['index'];
      if (pkg.pob.jsx) {
        pkg.pob.jsx = jsx;
      } else {
        delete pkg.pob.jsx;
      }
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  configuring() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    this.entries = pkg.pob.entries;
    this.babelEnvs = pkg.pob.babelEnvs || [];

    if (this.babelEnvs.length > 0) {
      fs.mkdirSync(this.destinationPath('src'), { recursive: true });
    }

    if (this.entries) {
      this.entries.forEach((entry) => {
        const entryDestPath = this.destinationPath(`${entry}.js`);
        // TODO check nightingale before uncomment this
        // if (this.options.isApp && entry !== 'index') {
        //   this.fs.write(
        //     entryDestPath,
        //     `// resolution for eslint-plugin-import\nexport * from './src/${entry}/index.ts';\n`,
        //   );
        // } else {
        this.fs.delete(entryDestPath);
        // }
      });
    }
    //
    // const indexSrcDestPath = this.destinationPath('src/index.js');
    // if (!this.fs.exists(indexSrcDestPath)
    // && !this.fs.exists(this.destinationPath('src/index.jsx'))
    // && !this.fs.exists(this.destinationPath('src/index.ts'))
    // && !this.fs.exists(this.destinationPath('src/index.tsx'))) {
    //   this.fs.copy(this.templatePath('src/index.ts'), indexSrcDestPath);
    // }
  }

  default() {
    const useBabel = this.babelEnvs && this.babelEnvs.length > 0;
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const hasTargetNode = this.babelEnvs.find((env) => env.target === 'node');
    const hasTargetBrowser = this.babelEnvs.find(
      (env) => env.target === 'browser',
    );

    /* scripts */

    if (this.options.isApp) {
      packageUtils.removeScripts(['watch']);
      packageUtils.addOrRemoveScripts(pkg, useBabel, {
        'clean:build': `pob-babel-clean-out ${this.options.buildDirectory}`,
        build: 'yarn clean:build && rollup --config rollup.config.mjs',
        start: 'yarn clean:build && rollup --config rollup.config.mjs --watch',
        clean: 'yarn clean:build',
      });
    } else {
      packageUtils.removeScripts(['start']);
      packageUtils.addScripts(pkg, {
        'clean:build': useBabel
          ? `pob-babel-clean-out ${this.options.buildDirectory}`
          : 'true',
      });
      packageUtils.addOrRemoveScripts(pkg, useBabel, {
        build: 'yarn clean:build && rollup --config rollup.config.mjs',
        watch: 'yarn clean:build && rollup --config rollup.config.mjs --watch',
        clean: 'yarn clean:build',
      });
    }

    const shouldBuildDefinitions = !this.options.isApp && useBabel;
    packageUtils.addOrRemoveScripts(pkg, shouldBuildDefinitions, {
      'build:definitions': 'tsc -p tsconfig.json',
    });

    if (shouldBuildDefinitions) {
      pkg.scripts.build += ' && yarn run build:definitions';
    } else if (!this.options.isApp && !useBabel) {
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

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      useBabel || (pkg.peerDependencies && pkg.peerDependencies['@babel/core']),
      ['@babel/core'],
    );
    packageUtils.addOrRemoveDevDependencies(pkg, useBabel, ['pob-babel']);

    if (pkg.dependencies && pkg.dependencies['pob-babel']) {
      // update pob-babel in alp-dev
      packageUtils.addDependencies(pkg, ['pob-babel'], '^');
    }
    if (pkg.dependencies && pkg.dependencies['@babel/runtime']) {
      // update pob-babel in alp-dev
      packageUtils.addDependencies(pkg, ['@babel/runtime'], '^');
    }

    packageUtils.addOrRemoveDevDependencies(pkg, useBabel && pkg.pob.jsx, [
      '@babel/preset-react',
    ]);

    packageUtils.removeDevDependencies(pkg, [
      'babel-preset-env', // now @babel/preset-env
      'babel-preset-jsdoc',
      'babel-plugin-add-jsdoc-annotations',
      'babel-preset-modern-browsers',
    ]);

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(
        (env) => env.target === 'browser' && env.version === undefined,
      ),
      ['@babel/preset-env'],
    );

    /* engines */

    if (hasTargetNode) {
      if (!pkg.engines) pkg.engines = {};
      const minNodeVersion = Math.min(
        ...this.babelEnvs
          .filter((env) => env.target === 'node')
          .map((env) => env.version),
      );
      switch (String(minNodeVersion)) {
        case '10':
        case '12':
        case '14':
        case '16':
          pkg.engines.node = '>=16.12.0';
          break;
        case '18':
          pkg.engines.node = '>=18.12.0';
          break;
        default:
          throw new Error(`Invalid min node version: ${minNodeVersion}`);
      }

      if (pkg.dependencies && pkg.dependencies['@types/node']) {
        pkg.dependencies['@types/node'] = `>=${minNodeVersion}.0.0`;
      }
      if (
        pkg.devDependencies &&
        pkg.devDependencies['@types/node'] &&
        !semver.satisfies(
          pkg.devDependencies['@types/node'],
          `>=${minNodeVersion}.0.0`,
        )
      ) {
        pkg.devDependencies['@types/node'] = `>=${minNodeVersion}.0.0`;
      }
    } else {
      packageUtils.removeDependencies(pkg, ['@types/node']);
      packageUtils.removeDevDependencies(pkg, ['@types/node']);
      // Supports oldest current or active LTS version of node
      pkg.engines.node = '>=18.12.0';
    }

    /* browserslist */

    if (hasTargetBrowser) {
      if (pkg.browserslist && pkg.browserslist.modern) {
        delete pkg.browserslist.modern;
      }
      pkg.browserslist = {
        ...(Array.isArray(pkg.browserslist) ? {} : pkg.browserslist),
        production: [
          'defaults',
          '> 0.2%',
          'not ie < 12',
          'not safari < 10',
          'not ios_saf < 10',
        ],
        // configured in babel preset
        // modern: ['defaults and >1% and supports es6-module'],
      };
    } else if (this.options.isApp && pkg.browserslist) {
      pkg.browserslist = {
        ...pkg.browserslist,
        production: [
          'defaults',
          '> 0.2%',
          'not ie < 12',
          'not safari < 10',
          'not ios_saf < 10',
        ],
      };
    } else {
      delete pkg.browserslist;
    }

    /* side effects */

    if (this.options.isApp) {
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

    if (this.options.isApp) {
      delete pkg.types;
      delete pkg.typings;
    } else if (pkg.typings) {
      if (!pkg.types) pkg.types = pkg.typings;
      delete pkg.typings;
    }

    // if (!pkg.main || pkg.main.startsWith('./lib/')) {
    if (useBabel) {
      // see pkg.exports instead.
      delete pkg.main;
      if (!this.options.isApp) {
        pkg.types = `./${this.options.buildDirectory}/definitions/index.d.ts`;
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
      if (!this.options.isApp) {
        if (this.fs.exists('./lib/index.ts')) {
          pkg.types = './lib/index.ts';
        } else if (this.fs.exists('./lib/index.d.ts') || pkg.types) {
          pkg.types = './lib/index.d.ts';
        }
      }
      if (!pkg.engines) pkg.engines = {};
      if (
        !pkg.engines.node ||
        semver.lt(
          semver.minVersion(pkg.engines.node),
          // pkg.type === 'commonjs' ? '12.10.0' : '12.20.0',
          '14.13.1',
        )
      ) {
        pkg.engines.node = '>=16.0.0';
      }
    }

    delete pkg['browser-dev'];
    delete pkg['module-dev'];

    const esAllBrowserEnv = this.babelEnvs.find(
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
    if (useBabel) {
      pkg.exports = {
        './package.json': './package.json',
      };

      this.entries.forEach((entry) => {
        const isBrowserOnly =
          entry === 'browser' &&
          (this.babelEnvs.every((env) => env.target === 'browser') ||
            (this.entries.length === 2 && this.entries.includes('index')));
        const entryDistName = isBrowserOnly ? 'index' : entry;
        const exportName = entry === 'index' ? '.' : `./${entry}`;

        const targets = {};

        const defaultNodeEnv = this.babelEnvs.find(
          (env) => env.target === 'node',
        );
        const defaultNodeEnvVersion = defaultNodeEnv && defaultNodeEnv.version;

        this.babelEnvs.forEach(({ target, version, formats }) => {
          if (target === 'node' && entry === 'browser') return;

          const exportTarget = {};

          if (target === 'node') {
            const cjsExt = pkg.type === 'module' ? 'cjs' : 'cjs.js';
            if (!formats || formats.includes('es')) {
              exportTarget.import = `./${this.options.buildDirectory}/${entryDistName}-${target}${version}.mjs`;

              if (formats && formats.includes('cjs')) {
                exportTarget.require = `./${this.options.buildDirectory}/${entryDistName}-${target}${version}.${cjsExt}`;
              }
            } else if (formats && formats.includes('cjs')) {
              exportTarget.default = `./${this.options.buildDirectory}/${entryDistName}-${target}${version}.${cjsExt}`;
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
        pkg.pob.extraEntries.forEach((exportName) => {
          pkg.exports[`./${exportName}`] =
            pkg.type === 'module'
              ? // eslint-disable-next-line unicorn/no-nested-ternary
                exportName.endsWith('.cjs') || exportName.endsWith('.d.ts')
                ? `./${exportName}`
                : `./${exportName}.js`
              : {
                  import: `./${exportName}.mjs`,
                  require: `./${exportName}.js`,
                };
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
    }

    Object.keys(pkg).forEach((key) => {
      if (!key.startsWith('module:') && !key.startsWith('webpack:')) return;
      delete pkg[key];
    });

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  writing() {
    this.fs.delete('types.js');

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const useBabel = this.babelEnvs && this.babelEnvs.length > 0;

    /* pob-babel config */

    packageUtils.removeDevDependencies(pkg, ['@rollup/plugin-run']);
    packageUtils.removeDependencies(pkg, ['alp-rollup-plugin-config']);
    packageUtils.addOrRemoveDevDependencies(
      pkg,
      useBabel && this.options.isApp && this.options.useAppConfig,
      ['alp-rollup-plugin-config'],
    );

    this.fs.delete('rollup.config.js');
    if (useBabel) {
      if (this.options.isApp) {
        copyAndFormatTpl(
          this.fs,
          this.templatePath('app.rollup.config.mjs.ejs'),
          this.destinationPath('rollup.config.mjs'),
          {
            config: this.options.useAppConfig,
            outDirectory: this.options.buildDirectory,
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
    } else {
      this.fs.delete('rollup.config.mjs');
    }

    /* jest babel config */

    this.fs.delete('.babelrc');
    this.fs.delete('babel.config.json');
    this.fs.delete('babel.config.mjs');
    if (this.fs.exists(this.destinationPath('babel.config.js'))) {
      this.fs.move(
        this.destinationPath('babel.config.js'),
        this.destinationPath('babel.config.cjs'),
      );
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
