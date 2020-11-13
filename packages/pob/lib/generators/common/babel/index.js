'use strict';

const fs = require('fs');
const semver = require('semver');
const Generator = require('yeoman-generator');
const inLerna = require('../../../utils/inLerna');
const packageUtils = require('../../../utils/package');
const { copyAndFormatTpl } = require('../../../utils/writeAndFormat');

module.exports = class BabelGenerator extends Generator {
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

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const hasInitialPkgPob = !!pkg.pob;

    if (!pkg.pob) pkg.pob = {};
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
          when: ({ babelTargets = [] }) => babelTargets.includes('node'),
          validate: (versions) => versions.length > 0,
          default: nodeVersions,
          choices: [
            {
              name: '12 (Active LTS)',
              value: '12',
            },
          ],
        },

        {
          type: 'checkbox',
          name: 'browserVersions',
          message: 'Babel browser versions',
          when: ({ babelTargets = [] }) => babelTargets.includes('browser'),
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
          when: ({ babelTargets = [] }) => babelTargets.length !== 0,
          validate: (babelTargets = []) => babelTargets.length > 0,
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
          when: ({ babelTargets = [] }) => babelTargets.length !== 0,
          default: jsx,
        },
      ]);
    }

    const newBabelEnvs = [
      ...(babelConfig.nodeVersions || []).map((version) => ({
        target: 'node',
        version,
        formats: babelConfig.formats.includes('es')
          ? // eslint-disable-next-line unicorn/no-nested-ternary
            version === '12'
            ? babelConfig.formats
            : ['cjs']
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
        if (this.babelEnvs.find((env) => env.target === 'node')) {
          if (!this.entries.includes('index') || entry !== 'browser') {
            copyAndFormatTpl(
              this.fs,
              this.templatePath('entry.js.ejs'),
              entryDestPath,
              {
                entry,
                node12: Boolean(
                  this.babelEnvs.find(
                    (env) =>
                      env.target === 'node' && String(env.version) === '12',
                  ),
                ),
              },
            );
          } else {
            copyAndFormatTpl(
              this.fs,
              this.templatePath('entry.browseronly.js'),
              entryDestPath,
            );
          }
        } else {
          this.fs.delete(entryDestPath);
        }
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
    const useBabel = this.babelEnvs && this.babelEnvs.length;
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const hasTargetNode = this.babelEnvs.find((env) => env.target === 'node');
    const hasTargetBrowser = this.babelEnvs.find(
      (env) => env.target === 'browser',
    );

    /* scripts */

    packageUtils.addOrRemoveScripts(pkg, useBabel, {
      build: 'pob-build',
      watch: 'pob-watch',
    });

    const shouldBuildDefinitions = !this.options.isApp && useBabel;
    packageUtils.addOrRemoveScripts(pkg, shouldBuildDefinitions, {
      'build:definitions': 'tsc -p tsconfig.build.json',
    });

    if (!this.options.isApp && !useBabel) {
      // check definitions, but also force lerna to execute build:definitions in right order
      // example: nightingale-types depends on nightingale-levels
      if (this.fs.exists(this.destinationPath('lib/index.d.ts'))) {
        pkg.scripts['build:definitions'] =
          'tsc --lib esnext --noEmit ./lib/index.d.ts';
      }

      if (this.fs.exists(this.destinationPath('lib/index.ts'))) {
        pkg.scripts['build:definitions'] =
          'tsc --lib esnext --noEmit ./lib/index.ts';
      }
    }

    if (pkg.scripts) {
      if (inLerna || !pkg.scripts['build:definitions']) {
        delete pkg.scripts.postbuild;
      } else if (pkg.scripts['build:definitions']) {
        pkg.scripts.postbuild = pkg.scripts['build:definitions'];
      }
    }

    if (pkg.scripts) {
      delete pkg.scripts['build:dev'];
      delete pkg.scripts['watch:dev'];
    }

    /* dependencies */

    packageUtils.addOrRemoveDevDependencies(pkg, useBabel, [
      '@babel/core',
      'pob-babel',
      'rollup',
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
      this.babelEnvs.find((env) => env.target === 'node'),
      ['babel-preset-latest-node'],
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
          pkg.engines.node = '>=12.10.0';
          break;
        default:
          throw new Error(`Invalid min node version: ${minNodeVersion}`);
      }

      if (pkg.dependencies && pkg.dependencies['@types/node']) {
        pkg.dependencies['@types/node'] = `>=${minNodeVersion}.0.0`;
      }
      if (pkg.devDependencies && pkg.devDependencies['@types/node']) {
        pkg.devDependencies['@types/node'] = `>=${minNodeVersion}.0.0`;
      }
    } else {
      packageUtils.removeDependencies(pkg, ['@types/node']);
      packageUtils.removeDevDependencies(pkg, ['@types/node']);
      if (pkg.engines && useBabel) {
        delete pkg.engines.node;
        if (Object.keys(pkg.engines).length === 0) delete pkg.engines;
      }
    }

    /* browserlist */

    if (hasTargetBrowser) {
      pkg.browserslist = [
        '> 0.2%',
        'Firefox ESR',
        'not ie < 12',
        'not dead',
        'not op_mini all',
      ];
    } else {
      delete pkg.browserslist;
    }

    /* side effects */

    if (!('sideEffects' in pkg)) {
      pkg.sideEffects = true;
    }

    /* main / aliases / typing */

    if (pkg.typings) {
      if (!pkg.types) pkg.types = pkg.typings;
      delete pkg.typings;
    }

    // if (!pkg.main || pkg.main.startsWith('./lib/')) {
    if (useBabel) {
      pkg.main = !this.babelEnvs.find((env) => env.target === 'node')
        ? `./dist/index-browser.${
            this.babelEnvs.find(
              (env) => env.target === 'browser' && !env.formats.includes('cjs'),
            )
              ? 'es'
              : 'cjs'
          }.js`
        : './index.js';
      pkg.types = './dist/index.d.ts';
    } else {
      pkg.main = './lib/index.js';
      if (this.fs.exists('./lib/index.ts')) {
        pkg.types = './lib/index.ts';
      } else if (this.fs.exists('./lib/index.d.ts') || pkg.types) {
        pkg.types = './lib/index.d.ts';
      }
      if (!pkg.engines) pkg.engines = {};
      if (
        !pkg.engines.node ||
        semver.lt(pkg.engines.node.slice(2), '12.10.0')
      ) {
        pkg.engines.node = '>=12.10.0';
      }
    }

    delete pkg.browser;
    delete pkg['browser-dev'];
    delete pkg['module-dev'];

    const esAllBrowserEnv = this.babelEnvs.find(
      (env) =>
        env.target === 'browser' &&
        env.version === undefined &&
        env.formats.includes('es'),
    );
    if (esAllBrowserEnv) {
      // for compatibility with webpack 4
      pkg.module = './dist/index-browser.es.js';
    }

    if (useBabel) {
      pkg.exports = {};

      this.entries.forEach((entry) => {
        const isBrowserOnly =
          entry === 'browser' &&
          this.babelEnvs.every((env) => env.target === 'browser');
        const entryDistName = isBrowserOnly ? 'index' : entry;
        const exportName = entryDistName === 'index' ? '.' : `./${entry}`;

        const targets = {};

        const defaultNodeEnv = this.babelEnvs.find(
          (env) => env.target === 'node',
        );
        const defaultNodeEnvVersion = defaultNodeEnv && defaultNodeEnv.version;

        this.babelEnvs.forEach(({ target, version, formats }) => {
          if (target === 'node' && entry === 'browser') return;

          const exportTarget = { development: {} };

          if (target === 'node') {
            if (formats.includes('es')) {
              exportTarget.development.import = `./dist/${entryDistName}-${target}${version}-dev.mjs`;
              exportTarget.import = `./dist/${entryDistName}-${target}${version}.mjs`;
            }

            if (formats.includes('cjs')) {
              exportTarget.development.require = `./dist/${entryDistName}-${target}${version}-dev.cjs.js`;
              exportTarget.require = `./dist/${entryDistName}-${target}${version}.cjs.js`;
            }
          } else if (target === 'browser') {
            if (formats.includes('es')) {
              exportTarget.development.import = `./dist/${entryDistName}-${target}${
                version || ''
              }-dev.mjs`;
              exportTarget.import = `./dist/${entryDistName}-${target}${
                version || ''
              }.mjs`;
            }

            if (formats.includes('cjs')) {
              exportTarget.development.require = `./dist/index-${target}${
                version || ''
              }-dev.cjs.js`;
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
    } else if (typeof pkg.exports !== 'string') {
      delete pkg.exports;
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

    const useBabel = this.babelEnvs && this.babelEnvs.length;
    const hasReact = useBabel && packageUtils.hasReact(pkg);

    /* pob-babel config */

    if (useBabel) {
      this.fs.copy(
        this.templatePath('rollup.config.js.txt'),
        this.destinationPath('rollup.config.js'),
      );
    } else {
      this.fs.delete('rollup.config.js');
    }

    /* jest babel config */

    this.fs.delete('.babelrc');
    this.fs.delete('babel.config.json');
    if (useBabel && this.options.testing) {
      this.fs.copyTpl(
        this.templatePath('babel.config.js.ejs'),
        this.destinationPath('babel.config.js'),
        {
          hasReact,
          testing: this.options.testing,
        },
      );
    } else {
      this.fs.delete('babel.config.js');
    }
  }

  end() {
    if (this.options.fromPob) return;
    if (this.babelEnvs && this.babelEnvs.length > 0) {
      this.spawnCommandSync('yarn', ['run', 'preversion']);
    }
  }
};
