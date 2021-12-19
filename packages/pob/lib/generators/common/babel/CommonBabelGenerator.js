import fs from 'fs';
import semver from 'semver';
import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';

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
  }

  initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (pkg.pob && pkg.pob.babelEnvs) {
      let babelEnvs = pkg.pob.babelEnvs;
      if (
        !babelEnvs.some(
          (env) => env.target === 'node' && String(env.version) === '14',
        ) &&
        babelEnvs.some(
          (env) =>
            env.target === 'node' &&
            (String(env.version) === '8' ||
              String(env.version) === '6' ||
              String(env.version) === '10' ||
              String(env.version) === '12'),
        )
      ) {
        babelEnvs.unshift({
          target: 'node',
          version: '14',
          formats: ['cjs', 'es'],
        });
      }
      babelEnvs = babelEnvs.filter(
        (env) => env.target !== 'node' || env.version >= 14,
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
    const nodeVersions = babelEnvs
      .filter((env) => env.target === 'node')
      .map((env) => env.version);
    const browserVersions = babelEnvs
      .filter((env) => env.target === 'browser')
      .map((env) => (env.version === undefined ? 'supported' : env.version));
    const formats = [
      babelEnvs.some((env) => env.formats.includes('cjs')) ? 'cjs' : undefined,
      babelEnvs.some((env) => env.formats.includes('es')) ? 'es' : undefined,
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
              name: '12 (Maintenance LTS)',
              value: '12',
            },
            {
              name: '14 (Maintenance LTS)',
              value: '14',
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
              name: 'Modern (babel-preset-modern-browsers)',
              value: 'modern',
            },
            {
              name: 'Supported (@babel/preset-env)',
              value: 'supported',
            },
          ],
        },

        {
          type: 'checkbox',
          name: 'formats',
          message: 'Babel formats',
          when: ({ targets = [] }) => targets.length > 0,
          validate: (targets = []) => targets.length > 0,
          default: formats,
          choices: [
            {
              name: 'commonjs',
              value: 'cjs',
            },
            {
              name: 'ES2015 module',
              value: 'es',
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
        formats: babelConfig.formats.includes('cjs')
          ? // eslint-disable-next-line unicorn/no-nested-ternary
            version === '14'
            ? babelConfig.formats
            : ['es']
          : babelConfig.formats,
      })),
      ...(babelConfig.browserVersions || []).map((version) => ({
        target: 'browser',
        version: version === 'supported' ? undefined : version,
        formats: babelConfig.formats.includes('cjs')
          ? // eslint-disable-next-line unicorn/no-nested-ternary
            version === 'supported'
            ? babelConfig.formats
            : ['es']
          : babelConfig.formats,
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
        this.fs.delete(entryDestPath);
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
        build: 'pob-build',
        start: 'pob-watch',
        clean: 'rm -Rf dist',
      });
    } else {
      packageUtils.removeScripts(['start']);
      packageUtils.addOrRemoveScripts(pkg, useBabel, {
        build: 'pob-build',
        watch: 'pob-watch',
        clean: 'rm -Rf dist',
      });
    }

    const shouldBuildDefinitions = !this.options.isApp && useBabel;
    packageUtils.addOrRemoveScripts(pkg, shouldBuildDefinitions, {
      'build:definitions': 'tsc -p tsconfig.build.json',
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

    packageUtils.addOrRemoveDevDependencies(pkg, useBabel, [
      '@babel/core',
      'pob-babel',
    ]);

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
      'rollup',
      'babel-preset-env', // now @babel/preset-env
      'babel-preset-jsdoc',
      'babel-plugin-add-jsdoc-annotations',
    ]);

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(
        (env) => env.target === 'browser' && env.version === undefined,
      ),
      ['@babel/preset-env'],
    );

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(
        (env) => env.target === 'browser' && env.version === 'modern',
      ),
      ['babel-preset-modern-browsers'],
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
          pkg.engines.node = '^14.13.1 || >=16.0.0';
          break;
        case '16':
          pkg.engines.node = '>=16.0.0';
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
      if (pkg.engines && useBabel) {
        delete pkg.engines.node;
        if (Object.keys(pkg.engines).length === 0) delete pkg.engines;
      } else {
        // Supported LTS versions of node, that supports ESM modules.
        pkg.engines.node = '^14.13.1 || >=16.0.0';
      }
    }

    /* browserslist */

    if (hasTargetBrowser) {
      pkg.browserslist = [
        'defaults',
        '> 0.2%',
        'not ie < 12',
        'not safari < 10',
        'not ios_saf < 10',
      ];
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
      if (!this.options.isApp) pkg.types = './dist/index.d.ts';
    } else {
      if (!pkg.main) {
        pkg.exports = './lib/index.js';
      }
      pkg.main = './lib/index.js';
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
        pkg.engines.node = '^14.13.1 || >=16.0.0';
      }
    }

    delete pkg['browser-dev'];
    delete pkg['module-dev'];

    const esAllBrowserEnv = this.babelEnvs.find(
      (env) =>
        env.target === 'browser' &&
        env.version === undefined &&
        env.formats.includes('es'),
    );

    const esModernBrowserEnv = this.babelEnvs.find(
      (env) =>
        env.target === 'browser' &&
        env.version === 'modern' &&
        env.formats.includes('es'),
    );

    const esNodeEnv = this.babelEnvs.find(
      (env) => env.target === 'node' && env.formats.includes('es'),
    );

    // Legacy "dev" builds
    delete pkg['module:browser'];
    delete pkg['module:browser-dev'];
    delete pkg['module:modern-browsers-dev'];
    delete pkg['module:node-dev'];

    /* webpack 4 */
    if (esAllBrowserEnv) {
      pkg.module = './dist/index-browser.es.js';
      pkg.browser = './dist/index-browser.es.js';
    } else {
      delete pkg.module;
      delete pkg.browser;
    }

    if (esModernBrowserEnv) {
      pkg['module:modern-browsers'] = './dist/index-browsermodern.es.js';
    } else {
      delete pkg['module:modern-browsers'];
    }

    if (esNodeEnv) {
      // webpack 4 node
      pkg[
        'module:node'
      ] = `./dist/index-${esNodeEnv.target}${esNodeEnv.version}.mjs`;
    }

    const aliases = (this.entries || []).filter((entry) => entry !== 'index');

    if (useBabel && aliases.length > 0 && (esNodeEnv || esAllBrowserEnv)) {
      [esNodeEnv, esAllBrowserEnv, esModernBrowserEnv]
        .filter(Boolean)
        .forEach((env) => {
          const key = (() => {
            if (env.target === 'node') return 'node';
            if (env.version === 'modern') return 'modern-browsers';
            return 'browser';
          })();

          const envAliases =
            this.entries.includes('index') && env.target === 'node'
              ? aliases.filter((alias) => alias !== 'browser')
              : aliases;
          if (envAliases.length === 0) return;
          pkg[`module:aliases-${key}`] = {};

          envAliases.forEach((aliasName) => {
            const isBrowserOnly =
              aliasName === 'browser' && env.target !== 'node';
            const aliasDistName = isBrowserOnly ? 'index' : aliasName;
            pkg[`module:aliases-${key}`][
              `./${aliasName}.js`
            ] = `./dist/${aliasDistName}-${env.target}${
              env.version || ''
            }.es.js`;
          });
        });
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
            if (formats.includes('es')) {
              exportTarget.import = `./dist/${entryDistName}-${target}${version}.mjs`;

              if (formats.includes('cjs')) {
                exportTarget.require = `./dist/${entryDistName}-${target}${version}.cjs.js`;
              }
            } else if (formats.includes('cjs')) {
              exportTarget.default = `./dist/${entryDistName}-${target}${version}.cjs.js`;
            }
            // eslint: https://github.com/benmosher/eslint-plugin-import/issues/2132
            // jest: https://github.com/facebook/jest/issues/9771
            if (!pkg.main && exportName === '.') {
              pkg.main = exportTarget.default || exportTarget.require;
            }
          } else if (target === 'browser') {
            if (formats.includes('es')) {
              exportTarget.import = `./dist/${entryDistName}-${target}${
                version || ''
              }.es.js`;
            }

            if (formats.includes('cjs')) {
              exportTarget.require = `./dist/index-${target}${
                version || ''
              }.cjs.js`;
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
          pkg.exports[`./${exportName}`] = {
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

      // legacy
      if (key.endsWith('-dev')) {
        delete pkg[key];
        return;
      }

      if (key.startsWith('module:node') && esNodeEnv) return;
      if (key.startsWith('module:browser') && esAllBrowserEnv) return;
      if (key.startsWith('module:modern-browsers') && esModernBrowserEnv) {
        return;
      }
      if (key.startsWith('module:aliases') && aliases.length > 0) {
        if (key.startsWith('module:aliases-node') && esNodeEnv) return;
        if (key.startsWith('module:aliases-browser') && esAllBrowserEnv) return;
        if (
          key.startsWith('module:aliases-modern-browsers') &&
          esModernBrowserEnv
        ) {
          return;
        }
      }
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

    this.fs.delete('rollup.config.js');
    if (useBabel) {
      if (this.options.isApp) {
        this.fs.copy(
          this.templatePath('app.rollup.config.mjs.ejs'),
          this.destinationPath('rollup.config.mjs'),
        );
      } else {
        this.fs.copy(
          this.templatePath('lib.rollup.config.mjs.txt'),
          this.destinationPath('rollup.config.mjs'),
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
