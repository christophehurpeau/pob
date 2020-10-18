'use strict';

const fs = require('fs');
const semver = require('semver');
const Generator = require('yeoman-generator');
const inLerna = require('../../../utils/inLerna');
const packageUtils = require('../../../utils/package');

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

    if (pkg.pob && this.options.updateOnly) return;

    if (!pkg.pob) pkg.pob = {};
    const babelEnvs = pkg.pob.babelEnvs || [];

    /*

    {
          babelTargets: [
            babelEnvs.find((env) => env.target === 'node') && 'node',
            babelEnvs.find((env) => env.target === 'browser') && 'browser',
          ].filter(Boolean),
          babelNodeVersions: [
            Boolean(
              babelEnvs.find(
                (env) => env.target === 'node' && String(env.version) === '10'
              )
            ) && '10',
            Boolean(
              babelEnvs.find(
                (env) => env.target === 'node' && String(env.version) === '8'
              )
            ) && '8',
          ].filter(Boolean),
          babelBrowserVersions: [
            Boolean(
              babelEnvs.find(
                (env) => env.target === 'browser' && env.version === 'modern'
              )
            ) && 'modern',
            Boolean(
              babelEnvs.find(
                (env) => env.target === 'browser' && env.version === undefined
              )
            ) && undefined,
          ].filter((value) => value !== false),
          babelFormats: [
            Boolean(babelEnvs.find((env) => env.formats.includes('cjs'))) &&
              'cjs',
            Boolean(babelEnvs.find((env) => env.formats.includes('es'))) &&
              'es',
          ].filter(Boolean),
          withReact:
            this.pobjson.withReact === undefined
              ? packageUtils.hasReact(pkg)
              : this.pobjson.withReact,
        }

     */
    const {
      babelNodeVersions = [],
      babelBrowserVersions = [],
      babelFormats,
      jsx,
    } = await this.prompt([
      {
        type: 'checkbox',
        name: 'babelTargets',
        message:
          "Babel targets: (don't select anything if you don't want babel)",
        choices: [
          {
            name: 'Node',
            value: 'node',
            checked: Boolean(babelEnvs.find((env) => env.target === 'node')),
          },
          {
            name: 'Browser',
            value: 'browser',
            checked: Boolean(babelEnvs.find((env) => env.target === 'browser')),
          },
        ],
      },

      {
        type: 'checkbox',
        name: 'babelNodeVersions',
        message: 'Babel node versions: (https://github.com/nodejs/Release)',
        when: (answers) => answers.babelTargets.includes('node'),
        validate: (versions) => versions.length > 0,
        choices: [
          {
            name: '10 (Active LTS)',
            value: '10',
            checked: Boolean(
              babelEnvs.find(
                (env) => env.target === 'node' && String(env.version) === '10',
              ),
            ),
          },
        ],
      },

      {
        type: 'checkbox',
        name: 'babelBrowserVersions',
        message: 'Babel browser versions',
        when: (answers) => answers.babelTargets.includes('browser'),
        validate: (versions) => versions.length > 0,
        choices: [
          {
            name: 'Modern (babel-preset-modern-browsers)',
            value: 'modern',
            checked: Boolean(
              babelEnvs.find(
                (env) => env.target === 'browser' && env.version === 'modern',
              ),
            ),
          },
          {
            name: 'Supported (@babel/preset-env)',
            value: undefined,
            checked: Boolean(
              babelEnvs.find(
                (env) => env.target === 'browser' && env.version === undefined,
              ),
            ),
          },
        ],
      },

      {
        type: 'checkbox',
        name: 'babelFormats',
        message: 'Babel formats',
        when: (answers) => answers.babelTargets.length !== 0,
        validate: (babelTargets) => babelTargets.length > 0,
        choices: [
          {
            name: 'commonjs',
            value: 'cjs',
            checked: Boolean(
              babelEnvs.find((env) => env.formats.includes('cjs')),
            ),
          },
          {
            name: 'ES2015 module',
            value: 'es',
            checked: Boolean(
              babelEnvs.find((env) => env.formats.includes('es')),
            ),
          },
        ],
      },

      {
        type: 'confirm',
        name: 'jsx',
        message: 'Enable JSX ?',
        when: (answers) => answers.babelTargets.length !== 0,
        default:
          (pkg.pob.jsx || pkg.pob.withReact) === undefined
            ? packageUtils.hasReact(pkg)
            : pkg.pob.jsx || pkg.pob.withReact,
      },
    ]);

    const newBabelEnvs = [
      ...babelNodeVersions.map((version) => ({
        target: 'node',
        version,
        formats: babelFormats.includes('es')
          ? // eslint-disable-next-line unicorn/no-nested-ternary
            version === '10'
            ? babelFormats
            : ['cjs']
          : babelFormats,
      })),
      ...babelBrowserVersions.map((version) => ({
        target: 'browser',
        version,
        formats: babelFormats.includes('cjs')
          ? // eslint-disable-next-line unicorn/no-nested-ternary
            version === undefined
            ? babelFormats
            : ['es']
          : babelFormats,
      })),
    ];

    if (newBabelEnvs.length === 0) {
      delete pkg.pob.babelEnvs;
      delete pkg.pob.entries;
      delete pkg.pob.withReact;
      delete pkg.pob.jsx;
    } else {
      pkg.pob.babelEnvs = newBabelEnvs;
      pkg.pob.entries = pkg.pob.entries || ['index'];
      pkg.pob.jsx = jsx;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  configuring() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    this.entries = pkg.pob.entries;
    this.babelEnvs = pkg.pob.babelEnvs || [];
    if (this.babelEnvs.length !== 0) {
      fs.mkdirSync(this.destinationPath('src'), { recursive: true });
    }

    if (this.entries) {
      this.entries.forEach((entry) => {
        const entryDestPath = this.destinationPath(`${entry}.js`);
        if (this.babelEnvs.find((env) => env.target === 'node')) {
          if (!this.entries.includes('index') || entry !== 'browser') {
            this.fs.copyTpl(this.templatePath('entry.js.ejs'), entryDestPath, {
              entry,
              node10: Boolean(
                this.babelEnvs.find(
                  (env) =>
                    env.target === 'node' && String(env.version) === '10',
                ),
              ),
            });
          } else {
            this.fs.copyTpl(
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
        case '12':
          pkg.engines.node = '>=12.10.0';
          break;
        case '10':
          pkg.engines.node = '>=10.13.0';
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
        semver.lt(pkg.engines.node.slice(2), '10.13.0')
      ) {
        pkg.engines.node = '>=10.13.0';
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

    if (useBabel && this.options.testing) {
      this.fs.copyTpl(
        this.templatePath('babelrc.json.ejs'),
        this.destinationPath('.babelrc'),
        {
          hasReact,
          testing: this.options.testing,
        },
      );
    } else {
      this.fs.delete('.babelrc');
    }
  }

  end() {
    if (this.options.fromPob) return;
    if (this.babelEnvs && this.babelEnvs.length !== 0) {
      this.spawnCommandSync('yarn', ['run', 'preversion']);
    }
  }
};
