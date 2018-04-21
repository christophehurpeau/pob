const Generator = require('yeoman-generator');
const mkdirp = require('mkdirp');
const packageUtils = require('../../../utils/package');

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
          node8: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '8')),
          node6: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '6')),
          node4: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '4')),
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
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (!pkg.main || pkg.main.startsWith('./lib/')) pkg.main = './index.js';
    pkg.typings = './dist/index.d.ts';

    if (!this.babelEnvs.find(env => env.target === 'browser' && env.version === undefined && env.formats.includes('cjs'))) {
      delete pkg.browser;
      delete pkg['browser-dev'];
    } else {
      pkg.browser = './dist/index-browser.cjs.js';
      pkg['browser-dev'] = './dist/index-browser-dev.cjs.js';
    }

    if (pkg['webpack:main-modern-browsers']) {
      pkg['module:modern-browsers'] = pkg['webpack:main-modern-browsers'].replace(
        'webpack',
        'module',
      );
    }
    if (pkg['webpack:main-modern-browsers-dev']) {
      pkg['module:modern-browsers-dev'] = pkg['webpack:main-modern-browsers-dev'].replace(
        'webpack',
        'module',
      );
    }
    delete pkg['webpack:main-modern-browsers'];
    delete pkg['webpack:main-modern-browsers-dev'];
    delete pkg['webpack:browser'];
    delete pkg['webpack:browser-dev'];
    delete pkg['webpack:main'];
    delete pkg['webpack:main-dev'];
    delete pkg['webpack:node'];
    delete pkg['webpack:node-dev'];

    if (!this.babelEnvs.find(env => env.target === 'browser' && env.version === 'modern' && env.formats.includes('es'))) {
      delete pkg['module:modern-browsers'];
      delete pkg['module:modern-browsers-dev'];
    } else { // if (!pkg['module:modern-browsers']) {
      pkg['module:modern-browsers'] = './dist/index-browsermodern.es.js';
      pkg['module:modern-browsers-dev'] = './dist/index-browsermodern-dev.es.js';
    }

    if (!this.babelEnvs.find(env => env.target === 'browser' && env.version === undefined && env.formats.includes('es'))) {
      delete pkg.module;
      delete pkg['module-dev'];
      delete pkg['module:browser'];
      delete pkg['module:browser-dev'];
    } else { //  if (!pkg.module) {
      pkg.module = pkg['module:browser'] = './dist/index-browser.es.js';
      pkg['module-dev'] = pkg['module:browser-dev'] = './dist/index-browser-dev.es.js';
    }

    const esNodeEnv = this.babelEnvs.find(env => env.target === 'node' && env.formats.includes('es'));
    if (!esNodeEnv) {
      delete pkg['module:node'];
      delete pkg['module:node-dev'];
    } else {
      pkg['module:node'] = `./dist/index-${esNodeEnv.target}${esNodeEnv.version}.es.js`;
      pkg['module:node-dev'] = './dist/index-node8-dev.es.js';
    }

    if (this.babelEnvs.find(env => env.target === 'node')) {
      if (!pkg.engines) pkg.engines = {};
      const minNodeVersion = this.babelEnvs.filter(env => env.target === 'node').reduce((min, env) => Math.min(min, env.version), Number.MAX_SAFE_INTEGER);
      switch (String(minNodeVersion)) {
        case '4':
          pkg.engines.node = '>=4.0.0';
          break;
        case '6':
          pkg.engines.node = '>=6.5.0';
          break;
        case '8':
          pkg.engines.node = '>=8.3.0';
          break;
        default:
          throw new Error(`Invalid min node version: ${minNodeVersion}`);
      }
    }

    packageUtils.addScripts(pkg, {
      // TODO add --declarationMap when https://github.com/Microsoft/TypeScript/commit/6af764c5606270fe34117b2051ba819581b3e199 is release
      build: 'pob-build && tsc -p tsconfig.build.json --emitDeclarationOnly',
      watch: 'pob-watch',
    });

    delete pkg.scripts['build:dev'];
    delete pkg.scripts['watch:dev'];

    packageUtils.addDevDependencies(pkg, {
      '@babel/core': '^7.0.0-beta.44',
      'babel-core': '7.0.0-bridge.0',
      'pob-babel': '^21.2.0',
    });

    packageUtils.addOrRemoveDevDependencies(pkg, packageUtils.hasReact(pkg), {
      '@babel/preset-react': '^7.0.0-beta.44',
    });

    packageUtils.removeDevDependencies(pkg, [
      'babel-preset-env', // now @babel/preset-env
      'babel-preset-jsdoc',
      'babel-plugin-add-jsdoc-annotations',
    ]);

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(env => (env.target === 'node' && env.version === '4') || (env.target === 'browser' && env.version === undefined)),
      { '@babel/preset-env': '^7.0.0-beta.44' },
    );

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(env => (env.target === 'node' && env.version !== '4')),
      { 'babel-preset-latest-node': '^2.0.0-beta.2' },
    );

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(env => (env.target === 'browser' && env.version === 'modern')),
      { 'babel-preset-modern-browsers': '^12.0.0-beta.0' },
    );

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
          pkg[`module:aliases${middle === '' ? '-browser' : middle}${suffix}`] = replaced;
          delete pkg[`webpack:${key}`];
        }
      });
    });

    const browserEsEnvs = this.babelEnvs.filter(env => (env.target === 'browser' && env.formats.includes('es')));
    if (this.entries.length && (esNodeEnv || browserEsEnvs.length)) {
      const aliases = this.entries.filter(entry => entry !== 'index' && (!this.entries.includes('index') || entry !== 'browser'));
      if (aliases.length) {
        [esNodeEnv, ...browserEsEnvs].forEach((env) => {
          const key = env.target === 'node' ? 'node' : (env.version === 'modern' ? 'modern-browsers' : 'browser');
          pkg[`module:aliases-${key}`] = {};
          pkg[`module:aliases-${key}-dev`] = {};
          aliases.forEach((aliasName) => {
            pkg[`module:aliases-${key}`][`./${aliasName}.js`] = `./dist/${aliasName}-${env.target}${env.version || ''}.es.js`;
            pkg[`module:aliases-${key}-dev`][`./${aliasName}.js`] = `./dist/${aliasName}-${env.target}${env.version || ''}-dev.es.js`;
          });
        });
      } else {
        delete pkg['module:aliases'];
        delete pkg['module:aliases-dev'];
        delete pkg['module:aliases-node'];
        delete pkg['module:aliases-node-dev'];
      }
    } else {
      delete pkg['module:aliases'];
      delete pkg['module:aliases-dev'];
      delete pkg['module:aliases-node'];
      delete pkg['module:aliases-node-dev'];
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  writing() {
    this.fs.delete('types.js');

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const useBabel = true;
    const hasReact = useBabel && packageUtils.hasReact(pkg);

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    if (this.options.testing) {
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
    return this.spawnCommandSync('yarn', ['run', 'build']);
  }
};
