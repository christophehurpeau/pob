const Generator = require('yeoman-generator');
const mkdirp = require('mkdirp');
const packageUtils = require('../../../utils/package');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('documentation', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Has documentation (use preset for jsdoc).',
    });

    this.option('env_node6', {
      type: Boolean,
      required: false,
      desc: 'Babel Env node6',
    });

    this.option('env_node8', {
      type: Boolean,
      required: false,
      desc: 'Babel Env node8',
    });

    this.option('env_olderNode', {
      type: Boolean,
      required: false,
      desc: 'Babel Env older node',
    });

    this.option('env_module_node8', {
      type: Boolean,
      required: false,
      desc: 'Babel Env module node8',
    });

    this.option('env_module_modernBrowsers', {
      type: Boolean,
      required: false,
      desc: 'Babel Env module modern-browsers',
    });

    this.option('env_module_allBrowsers', {
      type: Boolean,
      required: false,
      desc: 'Babel Env module all browsers',
    });

    this.option('env_browsers', {
      type: Boolean,
      required: false,
      desc: 'Babel Env browsers',
    });

    this.option('entries', {
      type: String,
      required: true,
      desc: 'Entries',
    });
  }

  initializing() {
    mkdirp(this.destinationPath('src'));

    this.options.entries.split(',').forEach((entry) => {
      const entryDestPath = this.destinationPath(`${entry}.js`);
      if (this.options.env_node6 || this.options.env_node8 || this.options.env_olderNode) {
        this.fs.copyTpl(this.templatePath('entry.js.ejs'), entryDestPath, {
          entry,
          env_node6: this.options.env_node6,
          env_node8: this.options.env_node8,
          env_olderNode: this.options.env_olderNode,
        });
      } else {
        this.fs.delete(entryDestPath);
      }
    });

    const indexSrcDestPath = this.destinationPath('src/index.js');
    if (!this.fs.exists(indexSrcDestPath)) {
      const idxJsxDestPath = this.destinationPath('src/index.jsx');
      if (!this.fs.exists(idxJsxDestPath)) {
        this.fs.copy(this.templatePath('src/index.js'), indexSrcDestPath);
      }
    }

    if (this.fs.exists(this.destinationPath('.flowconfig'))) {
      this.fs.copy(
        this.templatePath('types.js'),
        this.destinationPath('types.js'),
      );
      const typesDestPath = this.destinationPath('src/types.js');
      if (!this.fs.exists(typesDestPath)) {
        this.fs.copy(this.templatePath('src/types.js'), typesDestPath);
      }
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (!pkg.main) pkg.main = './index.js';

    if (!this.options.env_browsers) {
      delete pkg.browser;
      delete pkg['browser-dev'];
    } else if (!pkg.browser) {
      pkg.browser = './lib-browsers/index.js';
      pkg['browser-dev'] = './lib-browsers-dev/index.js';
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
    if (pkg['webpack:browser']) pkg.module = pkg['webpack:browser'].replace('webpack', 'module');
    if (pkg['webpack:browser-dev']) { pkg['module-dev'] = pkg['webpack:browser-dev'].replace('webpack', 'module'); }
    if (pkg['webpack:main']) pkg.module = pkg['webpack:main'].replace('webpack', 'module');
    if (pkg['webpack:main-dev']) { pkg['module-dev'] = pkg['webpack:main-dev'].replace('webpack', 'module'); }
    if (pkg['webpack:node']) pkg['module:node'] = pkg['webpack:node'];
    if (pkg['webpack:node-dev']) pkg['module:node-dev'] = pkg['webpack:node-dev'];

    // fix
    if (pkg.module) pkg.module = pkg.module.replace('webpack', 'module');
    if (pkg['module-dev']) pkg['module-dev'] = pkg['module-dev'].replace('webpack', 'module');

    delete pkg['webpack:main-modern-browsers'];
    delete pkg['webpack:main-modern-browsers-dev'];
    delete pkg['webpack:browser'];
    delete pkg['webpack:browser-dev'];
    delete pkg['webpack:main'];
    delete pkg['webpack:main-dev'];
    delete pkg['webpack:node'];
    delete pkg['webpack:node-dev'];

    if (!this.options.env_module_modernBrowsers) {
      delete pkg['module:modern-browsers'];
      delete pkg['module:modern-browsers-dev'];
    } else if (!pkg['module:modern-browsers']) {
      pkg['module:modern-browsers'] = './lib-module-modern-browsers/index.js';
      pkg['module:modern-browsers-dev'] = './lib-module-modern-browsers-dev/index.js';
    }

    if (!this.options.env_module_allBrowsers) {
      delete pkg.module;
      delete pkg['module-dev'];
      delete pkg['module:browser'];
      delete pkg['module:browser-dev'];
    } else if (!pkg.module) {
      pkg.module = pkg['module:browser'] = './lib-module/index.js';
      pkg['module-dev'] = pkg['module:browser-dev'] = './lib-module-dev/index.js';
    }

    if (!this.options.env_module_node8) {
      delete pkg['module:node'];
      delete pkg['module:node-dev'];
    } else if (this.options.env_module_node8) {
      pkg['module:node'] = './lib-module-node8/index.js';
      pkg['module:node-dev'] = './lib-module-node8-dev/index.js';
    }

    if (this.options.env_olderNode || this.options.env_node6 || this.options.env_node8) {
      if (this.options.env_olderNode) {
        if (pkg.engines) {
          delete pkg.engines.node;
          if (Object.keys(pkg.engines).length === 0) delete pkg.engines;
        }
      } else {
        if (!pkg.engines) pkg.engines = {};
        pkg.engines.node = `>=${this.options.env_node6 ? '6.5.0' : '8.3.0'}`;
      }
    }

    if (!pkg.scripts.build) {
      packageUtils.addScript(pkg, 'build', 'pob-build');
    }

    if (!pkg.scripts.watch) {
      packageUtils.addScript(pkg, 'watch', 'pob-watch');
    }

    delete pkg.scripts['build:dev'];
    delete pkg.scripts['watch:dev'];

    packageUtils.addDevDependency(pkg, 'pob-babel', '^18.1.5');

    packageUtils.addDependency(pkg, 'flow-runtime', '^0.16.0');
    packageUtils.removeDevDependency(pkg, 'flow-runtime');

    // old pob dependencies
    packageUtils.removeDevDependencies(pkg, [
      'tcomb',
      'tcomb-forked',
      'flow-runtime',
      'babel-preset-es2015',
      'babel-preset-es2015-webpack',
      'babel-preset-es2015-node5',
      'babel-preset-es2015-node6',
      'babel-preset-latest',
      'babel-preset-stage-1',
      'babel-preset-modern-browsers-stage-1',
      'babel-preset-flow',
      'babel-preset-flow-tcomb',
      'babel-preset-flow-tcomb-forked',
      'babel-plugin-typecheck',
      'babel-plugin-defines',
      'babel-plugin-import-rename',
      'babel-plugin-discard-module-references',
      'babel-plugin-remove-dead-code',
      'babel-plugin-react-require',
      'babel-preset-react',
    ]);

    if (packageUtils.hasReact(pkg)) {
      packageUtils.addDevDependencies(pkg, {
        'babel-preset-pob-react': '^0.2.4',
      });
    } else {
      packageUtils.removeDevDependency(pkg, 'babel-preset-pob-react');
    }

    if (this.options.documentation) {
      packageUtils.addDevDependency(pkg, 'babel-preset-jsdoc', '^0.4.0');
      packageUtils.addDevDependency(pkg, 'babel-plugin-add-jsdoc-annotations', '^5.1.0');
    } else {
      packageUtils.removeDevDependencies(pkg, [
        'babel-preset-jsdoc',
        'babel-plugin-add-jsdoc-annotations',
      ]);
    }

    if (
      this.options.env_olderNode ||
      this.options.env_browsers ||
      this.options.env_module_allBrowsers
    ) {
      packageUtils.addDevDependency(pkg, 'babel-preset-env', '^1.6.1');
    } else {
      packageUtils.removeDevDependency(pkg, 'babel-preset-env');
    }

    if (this.options.env_node6 || this.options.env_node8 || this.options.env_module_node8) {
      packageUtils.addDevDependency(pkg, 'babel-preset-latest-node', '^0.4.0');
    } else {
      packageUtils.removeDevDependency(pkg, 'babel-preset-latest-node');
    }

    if (this.options.env_module_modernBrowsers) {
      packageUtils.addDevDependency(pkg, 'babel-preset-modern-browsers', '^10.0.1');
    } else {
      packageUtils.removeDevDependency(pkg, 'babel-preset-modern-browsers');
    }

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

    if (
      this.options.entries &&
      (this.options.env_module_node8 ||
        this.options.env_module_allBrowsers ||
        this.options.env_module_modernBrowsers)
    ) {
      const aliases = this.options.entries.split(',')
        .filter(entry => entry !== 'index')
        .map(alias => ({
          alias,
          isDirectory: this.fs.exists(this.destinationPath(`src/${alias}/index.js`))
            || this.fs.exists(this.destinationPath(`src/${alias}/index.jsx`)),
        }));
      if (aliases.length) {
        [
          this.options.env_module_node8 && {
            key: 'node',
            path: 'lib-module-node8',
          },
          this.options.env_module_modernBrowsers && {
            key: 'modern-browsers',
            path: 'lib-module-modern-browsers',
          },
          this.options.env_module_allBrowsers && {
            key: 'browser',
            path: 'lib-module',
          },
        ]
          .filter(Boolean)
          .forEach(({ key, path }) => {
            pkg[`module:aliases-${key}`] = {};
            pkg[`module:aliases-${key}-dev`] = {};
            aliases.forEach(({ alias: aliasName, isDirectory }) => {
              const indexIfDir = isDirectory ? '/index' : '';
              pkg[`module:aliases-${key}`][`./${aliasName}.js`] = `./${path}/${aliasName}${indexIfDir}.js`;
              pkg[`module:aliases-${key}-dev`][`./${aliasName}.js`] = `./${path}-dev/${aliasName}${indexIfDir}.js`;
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

  end() {
    return this.spawnCommandSync('yarn', ['run', 'build']);
  }
};
