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
              node8: Boolean(
                this.babelEnvs.find(
                  (env) => env.target === 'node' && String(env.version) === '8',
                ),
              ),
              node6: Boolean(
                this.babelEnvs.find(
                  (env) => env.target === 'node' && String(env.version) === '6',
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

    if (
      !this.options.isApp &&
      !useBabel &&
      this.fs.exists(this.destinationPath('lib/index.d.ts'))
    ) {
      // check definitions, but also force lerna to execute build:definitions in right order
      // example: nightingale-types depends on nightingale-levels
      pkg.scripts['build:definitions'] =
        'tsc --lib esnext --noEmit ./lib/index.d.ts';
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
      const minNodeVersion = this.babelEnvs
        .filter((env) => env.target === 'node')
        .reduce(
          (min, env) => Math.min(min, env.version),
          Number.MAX_SAFE_INTEGER,
        );
      switch (String(minNodeVersion)) {
        case '10':
          pkg.engines.node = '>=10.13.0';
          if (pkg.dependencies && pkg.dependencies['@types/node']) {
            pkg.dependencies['@types/node'] = '>=10.0.0';
          }
          if (pkg.devDependencies && pkg.devDependencies['@types/node']) {
            pkg.devDependencies['@types/node'] = '>=10.0.0';
          }
          break;
        default:
          throw new Error(`Invalid min node version: ${minNodeVersion}`);
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
      pkg.browserslist = ['> 0.1%', 'Firefox ESR', 'not ie < 9', 'not dead'];
    } else {
      delete pkg.browserslist;
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
      if (this.fs.exists('./lib/index.d.ts') || pkg.types) {
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

    if (
      !this.babelEnvs.find(
        (env) =>
          env.target === 'browser' &&
          env.version === undefined &&
          env.formats.includes('cjs'),
      )
    ) {
      delete pkg.browser;
      delete pkg['browser-dev'];
    } else if (useBabel) {
      pkg.browser = './dist/index-browser.cjs.js';
      pkg['browser-dev'] = './dist/index-browser-dev.cjs.js';
    }

    if (useBabel && pkg['webpack:main-modern-browsers']) {
      pkg['module:modern-browsers'] = pkg[
        'webpack:main-modern-browsers'
      ].replace('webpack', 'module');
    }
    if (useBabel && pkg['webpack:main-modern-browsers-dev']) {
      pkg['module:modern-browsers-dev'] = pkg[
        'webpack:main-modern-browsers-dev'
      ].replace('webpack', 'module');
    }

    const esNodeEnv = this.babelEnvs.find(
      (env) => env.target === 'node' && env.formats.includes('es'),
    );
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

    if (esModernBrowserEnv) {
      pkg['module:modern-browsers'] = './dist/index-browsermodern.es.js';
      pkg['module:modern-browsers-dev'] =
        './dist/index-browsermodern-dev.es.js';
    }

    if (!esAllBrowserEnv) {
      delete pkg.module;
      delete pkg['module-dev'];
      // pkg['module:browser'] and pkg['module:browser-dev'] are deleted below
    } else {
      //  if (!pkg.module) {
      pkg.module = pkg['module:browser'] = './dist/index-browser.es.js';
      pkg['module-dev'] = pkg['module:browser-dev'] =
        './dist/index-browser-dev.es.js';
    }

    if (esNodeEnv) {
      pkg[
        'module:node'
      ] = `./dist/index-${esNodeEnv.target}${esNodeEnv.version}.es.js`;
      pkg[
        'module:node-dev'
      ] = `./dist/index-${esNodeEnv.target}${esNodeEnv.version}-dev.es.js`;
    }

    if (useBabel) {
      ['', '-modern-browsers', '-node'].forEach((middle) => {
        ['', '-dev'].forEach((suffix) => {
          const key = `aliases${middle}${suffix}`;
          const value = pkg[`webpack:${key}`];
          if (value) {
            const replaced =
              typeof value === 'string'
                ? value.replace('webpack', 'module')
                : Object.keys(value).reduce((o, oKey) => {
                    o[oKey] = value[oKey].replace('webpack', 'module');
                    return o;
                  }, {});
            pkg[
              `module:aliases${middle === '' ? '-browser' : middle}${suffix}`
            ] = replaced;
            delete pkg[`webpack:${key}`];
          }
        });
      });
    }

    const esBrowserEnvs = this.babelEnvs.filter(
      (env) => env.target === 'browser' && env.formats.includes('es'),
    );
    const aliases = (this.entries || []).filter((entry) => entry !== 'index');
    if (
      useBabel &&
      aliases.length !== 0 &&
      (esNodeEnv || esBrowserEnvs.length !== 0)
    ) {
      [esNodeEnv, ...esBrowserEnvs].forEach((env) => {
        const key =
          env.target === 'node'
            ? 'node'
            : // eslint-disable-next-line unicorn/no-nested-ternary
            env.version === 'modern'
            ? 'modern-browsers'
            : 'browser';
        const envAliases =
          this.entries.includes('index') && env.target === 'node'
            ? aliases.filter((alias) => alias !== 'browser')
            : aliases;
        if (envAliases.length === 0) return;
        pkg[`module:aliases-${key}`] = {};
        pkg[`module:aliases-${key}-dev`] = {};
        envAliases.forEach((aliasName) => {
          const isBrowserOnly =
            aliasName === 'browser' && env.target !== 'node';
          const aliasDistName = isBrowserOnly ? 'index' : aliasName;
          pkg[`module:aliases-${key}`][
            `./${aliasName}.js`
          ] = `./dist/${aliasDistName}-${env.target}${env.version || ''}.es.js`;
          pkg[`module:aliases-${key}-dev`][
            `./${aliasName}.js`
          ] = `./dist/${aliasDistName}-${env.target}${
            env.version || ''
          }-dev.es.js`;
        });
      });
    }

    Object.keys(pkg).forEach((key) => {
      if (!key.startsWith('module:') && !key.startsWith('webpack:')) return;
      if (key.startsWith('module:node') && esNodeEnv) return;
      if (key.startsWith('module:browser') && esAllBrowserEnv) return;
      if (key.startsWith('module:modern-browsers') && esModernBrowserEnv) {
        return;
      }
      if (key.startsWith('module:aliases') && aliases.length !== 0) {
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

    const useBabel = this.babelEnvs && this.babelEnvs.length;
    const hasReact = useBabel && packageUtils.hasReact(pkg);

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

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
