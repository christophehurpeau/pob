const Generator = require('yeoman-generator');
const mkdirp = require('mkdirp');
const packageUtils = require('../../../utils/package');
const inLerna = require('../../../utils/inLerna');

module.exports = class BabelGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('testing', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Has testing.',
    });

    this.option('babelEnvs', {
      type: String,
      required: true,
      desc: 'Babel Envs',
    });

    this.option('entries', {
      type: String,
      required: true,
      desc: 'Entries',
    });

    this.option('fromPob', {
      type: Boolean,
      required: false,
      defaults: false,
    });
  }

  initializing() {
    this.entries = JSON.parse(this.options.entries);
    this.babelEnvs = JSON.parse(this.options.babelEnvs);
    mkdirp(this.destinationPath('src'));

    this.entries.forEach((entry) => {
      const entryDestPath = this.destinationPath(`${entry}.js`);
      if (this.babelEnvs.find(env => env.target === 'node') && (!this.entries.includes('index') || entry !== 'browser')) {
        this.fs.copyTpl(this.templatePath('entry.js.ejs'), entryDestPath, {
          entry,
          node10: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '10')),
          node8: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '8')),
          node6: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '6')),
        });
      } else {
        this.fs.delete(entryDestPath);
      }
    });
    //
    // const indexSrcDestPath = this.destinationPath('src/index.js');
    // if (!this.fs.exists(indexSrcDestPath) && !this.fs.exists(this.destinationPath('src/index.jsx')) && !this.fs.exists(this.destinationPath('src/index.ts')) && !this.fs.exists(this.destinationPath('src/index.tsx'))) {
    //   this.fs.copy(this.templatePath('src/index.ts'), indexSrcDestPath);
    // }
  }

  default() {
    const useBabel = this.babelEnvs && this.babelEnvs.length;
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const hasTargetNode = this.babelEnvs.find(env => env.target === 'node');

    /* scripts */

    packageUtils.addOrRemoveScripts(pkg, useBabel || inLerna, {
      build: !useBabel ? 'echo "No build script."' : 'pob-build && tsc -p tsconfig.build.json --declarationMap --emitDeclarationOnly',
      watch: !useBabel ? 'echo "No watch script."' : 'pob-watch',
    });

    if (pkg.scripts) {
      delete pkg.scripts['build:dev'];
      delete pkg.scripts['watch:dev'];
    }

    /* dependencies */

    packageUtils.addOrRemoveDevDependencies(pkg, useBabel, {
      '@babel/core': '^7.0.0-beta.52',
      'babel-core': '7.0.0-bridge.0',
      'pob-babel': '^22.3.1',
    });

    packageUtils.addOrRemoveDevDependencies(pkg, useBabel && packageUtils.hasReact(pkg), {
      '@babel/preset-react': '^7.0.0-beta.52',
    });

    packageUtils.removeDevDependencies(pkg, [
      'babel-preset-env', // now @babel/preset-env
      'babel-preset-jsdoc',
      'babel-plugin-add-jsdoc-annotations',
    ]);

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(env => env.target === 'browser' && env.version === undefined),
      { '@babel/preset-env': '^7.0.0-beta.52' },
    );

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(env => (env.target === 'node')),
      { 'babel-preset-latest-node': '^2.0.0-beta.3' },
    );

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(env => (env.target === 'browser' && env.version === 'modern')),
      { 'babel-preset-modern-browsers': '^12.0.0-beta.1' },
    );

    /* engines */

    if (hasTargetNode) {
      if (!pkg.engines) pkg.engines = {};
      const minNodeVersion = this.babelEnvs.filter(env => env.target === 'node').reduce((min, env) => Math.min(min, env.version), Number.MAX_SAFE_INTEGER);
      switch (String(minNodeVersion)) {
        case '6':
          pkg.engines.node = '>=6.5.0';
          if (pkg.dependencies && pkg.dependencies['@types/node']) pkg.dependencies['@types/node'] = '>=6.0.0';
          if (pkg.devDependencies && pkg.devDependencies['@types/node']) pkg.devDependencies['@types/node'] = '>=6.0.0';
          break;
        case '8':
          pkg.engines.node = '>=8.3.0';
          if (pkg.dependencies && pkg.dependencies['@types/node']) pkg.dependencies['@types/node'] = '>=8.0.0';
          if (pkg.devDependencies && pkg.devDependencies['@types/node']) pkg.devDependencies['@types/node'] = '>=8.0.0';
          break;
        case '10':
          pkg.engines.node = '>=10.0.0';
          if (pkg.dependencies && pkg.dependencies['@types/node']) pkg.dependencies['@types/node'] = '>=10.0.0';
          if (pkg.devDependencies && pkg.devDependencies['@types/node']) pkg.devDependencies['@types/node'] = '>=10.0.0';
          break;
        default:
          throw new Error(`Invalid min node version: ${minNodeVersion}`);
      }
    } else {
      packageUtils.removeDependencies(pkg, ['@types/node']);
      packageUtils.removeDevDependencies(pkg, ['@types/node']);
      if (pkg.engines && useBabel) {
        delete pkg.engines.node;
        if (!Object.keys(pkg.engines).length) delete pkg.engines;
      }
    }

    /* main / aliases / typing */

    // if (!pkg.main || pkg.main.startsWith('./lib/')) {
    if (useBabel) {
      pkg.main = !this.babelEnvs.find(env => env.target === 'node') ? './dist/index-browser.cjs.js' : './index.js';
      pkg.typings = './dist/index.d.ts';
    } else {
      pkg.main = './lib/index.js';
      pkg.typings = './lib/index.d.ts';
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.node = '>=6.5.0';
    }

    if (!this.babelEnvs.find(env => env.target === 'browser' && env.version === undefined && env.formats.includes('cjs'))) {
      delete pkg.browser;
      delete pkg['browser-dev'];
    } else if (useBabel) {
      pkg.browser = './dist/index-browser.cjs.js';
      pkg['browser-dev'] = './dist/index-browser-dev.cjs.js';
    }

    if (useBabel && pkg['webpack:main-modern-browsers']) {
      pkg['module:modern-browsers'] = pkg['webpack:main-modern-browsers'].replace(
        'webpack',
        'module',
      );
    }
    if (useBabel && pkg['webpack:main-modern-browsers-dev']) {
      pkg['module:modern-browsers-dev'] = pkg['webpack:main-modern-browsers-dev'].replace(
        'webpack',
        'module',
      );
    }

    const esNodeEnv = this.babelEnvs.find(env => env.target === 'node' && env.formats.includes('es'));
    const esAllBrowserEnv = this.babelEnvs.find(env => env.target === 'browser' && env.version === undefined && env.formats.includes('es'));
    const esModernBrowserEnv = this.babelEnvs.find(env => env.target === 'browser' && env.version === 'modern' && env.formats.includes('es'));

    if (esModernBrowserEnv) {
      pkg['module:modern-browsers'] = './dist/index-browsermodern.es.js';
      pkg['module:modern-browsers-dev'] = './dist/index-browsermodern-dev.es.js';
    }

    if (!esAllBrowserEnv) {
      delete pkg.module;
      delete pkg['module-dev'];
      // pkg['module:browser'] and pkg['module:browser-dev'] are deleted below
    } else { //  if (!pkg.module) {
      pkg.module = pkg['module:browser'] = './dist/index-browser.es.js';
      pkg['module-dev'] = pkg['module:browser-dev'] = './dist/index-browser-dev.es.js';
    }

    if (esNodeEnv) {
      pkg['module:node'] = `./dist/index-${esNodeEnv.target}${esNodeEnv.version}.es.js`;
      pkg['module:node-dev'] = './dist/index-node8-dev.es.js';
    }

    if (useBabel) {
      ['', '-modern-browsers', '-node'].forEach((middle) => {
        ['', '-dev'].forEach((suffix) => {
          const key = `aliases${middle}${suffix}`;
          const value = pkg[`webpack:${key}`];
          if (value) {
            const replaced = typeof value === 'string'
              ? value.replace('webpack', 'module')
              : Object.keys(value).reduce((o, oKey) => {
                o[oKey] = value[oKey].replace('webpack', 'module');
                return o;
              }, {});
            pkg[`module:aliases${middle === '' ? '-browser' : middle}${suffix}`] = replaced;
            delete pkg[`webpack:${key}`];
          }
        });
      });
    }

    const esBrowserEnvs = this.babelEnvs.filter(env => (env.target === 'browser' && env.formats.includes('es')));
    const aliases = this.entries.filter(entry => entry !== 'index' && (!this.entries.includes('index') || entry !== 'browser'));
    if (useBabel && aliases.length && (esNodeEnv || esBrowserEnvs.length)) {
      [esNodeEnv, ...esBrowserEnvs].forEach((env) => {
        const key = env.target === 'node' ? 'node' : (env.version === 'modern' ? 'modern-browsers' : 'browser');
        pkg[`module:aliases-${key}`] = {};
        pkg[`module:aliases-${key}-dev`] = {};
        aliases.forEach((aliasName) => {
          pkg[`module:aliases-${key}`][`./${aliasName}.js`] = `./dist/${aliasName}-${env.target}${env.version || ''}.es.js`;
          pkg[`module:aliases-${key}-dev`][`./${aliasName}.js`] = `./dist/${aliasName}-${env.target}${env.version || ''}-dev.es.js`;
        });
      });
    }

    Object.keys(pkg).forEach((key) => {
      if (!key.startsWith('module:') && !key.startsWith('webpack:')) return;
      if (key.startsWith('module:node') && esNodeEnv) return;
      if (key.startsWith('module:browser') && esAllBrowserEnv) return;
      if (key.startsWith('module:modern-browsers') && esModernBrowserEnv) return;
      if (key.startsWith('module:aliases') && aliases.length) {
        if (key.startsWith('module:aliases-node') && esNodeEnv) return;
        if (key.startsWith('module:aliases-browser') && esAllBrowserEnv) return;
        if (key.startsWith('module:aliases-modern-browsers') && esModernBrowserEnv) return;
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
    if (this.babelEnvs && this.babelEnvs.length) {
      this.spawnCommandSync('yarn', ['run', 'build']);
    }
  }
};
