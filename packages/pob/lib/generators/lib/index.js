'use strict';

const { execSync } = require('child_process');
const Generator = require('yeoman-generator');
const mkdirp = require('mkdirp');
const packageUtils = require('../../utils/package');
const inLerna = require('../../utils/inLerna');
const inNpmLerna = require('../../utils/inNpmLerna');

module.exports = class PobLibGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });

    this.option('fromPob', {
      type: Boolean,
      required: false,
      defaults: false,
    });
  }

  initializing() {
    this.pobjson = this.config.get('pob') || this.config.get('pob-config');
    if (!this.pobjson) {
      this.pobjson = this.fs.readJSON(this.destinationPath('.pob.json'), null);
      if (this.pobjson) {
        this.config.set('pob-config', this.pobjson);
        this.config.save();
      }
    }

    this.config.delete('pob'); // deprecated
    this.fs.delete('.pob.json'); // deprecated

    if (!this.pobjson || this.pobjson.babelEnvs) {
      this.pobjson = {};
      this.updateOnly = false;
    } else {
      this.updateOnly = this.options.updateOnly;
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const pobPkgConfig = pkg.pob || {};

    let babelEnvs = this.pobjson.envs || pobPkgConfig.babelEnvs;
    const entries = this.pobjson.entries || pobPkgConfig.entries;
    const withReact = this.pobjson.withReact || pobPkgConfig.withReact;

    if (babelEnvs && typeof babelEnvs[0] === 'string') {
      babelEnvs = babelEnvs.map((env) => {
        switch (env) {
          case 'node6':
          case 'node7':
          case 'node8':
          case 'node10':
            return {
              target: 'node',
              version: 10,
              formats: ['cjs'],
            };

          case 'webpack-node7':
          case 'module-node7':
          case 'module-node8':
            return {
              target: 'node',
              version: 10,
              formats: ['es'],
            };

          case 'module':
          case 'webpack':
            return { target: 'browser', formats: ['es'] };

          case 'module-modern-browsers':
          case 'webpack-modern-browsers':
            return {
              target: 'browser',
              version: 'modern',
              formats: ['es'],
            };

          case 'browsers':
            return { target: 'browser', formats: ['cjs'] };

          default:
            throw new Error(`Unsupported env ${env}`);
        }
      });
    }

    if (babelEnvs) {
      if (
        !babelEnvs.some(
          (env) => env.target === 'node' && String(env.version) === '10'
        ) &&
        babelEnvs.some(
          (env) =>
            env.target === 'node' &&
            (String(env.version) === '8' || String(env.version) === '6')
        )
      ) {
        babelEnvs.unshift({
          target: 'node',
          version: '10',
          formats: ['cjs', 'es'],
        });
      }
      babelEnvs = babelEnvs.filter(
        (env) => env.target !== 'node' || env.version >= 10
      );
    }

    if (this.pobjson.testing === true) {
      this.pobjson.testing = {
        circleci: true,
        codecov: true,
      };
    } else if (this.pobjson.testing) {
      delete this.pobjson.testing.travisci;
    }

    if (typeof this.pobjson.documentation === 'object') {
      this.pobjson.documentation = true;
    }

    delete this.pobjson.doclets;
    delete this.pobjson.flow;
    delete this.pobjson.react;
    delete this.pobjson.entries;
    delete this.pobjson.envs;
    delete this.pobjson.withReact;

    pkg.pob = pkg.pob || {};

    if (babelEnvs && babelEnvs.length !== 0) {
      pkg.pob.babelEnvs = babelEnvs;
      pkg.pob.entries = entries;
      pkg.pob.withReact = withReact;
    } else {
      delete pkg.pob.babelEnvs;
      delete pkg.pob.entries;
      delete pkg.pob.withReact;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    // documentation
    if (!this.updateOnly) {
      const answers = await this.prompt([
        {
          type: 'confirm',
          name: 'documentation',
          message: 'Would you like documentation (manually generated) ?',
          default:
            this.pobjson.documentation != null
              ? this.pobjson.documentation
              : true,
        },
      ]);

      this.pobjson.documentation = !!answers.documentation;
    }

    // testing
    if (!this.updateOnly) {
      const { testing } = await this.prompt({
        type: 'confirm',
        name: 'testing',
        message: 'Would you like testing ?',
        default: this.pobjson.testing || false,
      });
      this.pobjson.testing = !testing ? false : this.pobjson.testing || {};

      if (this.pobjson.testing) {
        const testingPrompts = await this.prompt([
          {
            type: 'confirm',
            name: 'circleci',
            message: 'Would you like circleci ?',
            default: this.pobjson.testing.circleci !== false,
          },
          // {
          //   type: 'confirm',
          //   name: 'travisci',
          //   message: 'Would you like travisci ?',
          //   default: this.pobjson.testing.travisci !== false,
          // },
          {
            type: 'confirm',
            name: 'codecov',
            message: 'Would you like codecov ?',
            default: this.pobjson.testing.codecov === true,
          },
        ]);
        Object.assign(this.pobjson.testing, testingPrompts);
      }
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  default() {
    this.composeWith(require.resolve('../common/babel'), {
      updateOnly: this.options.updateOnly,
      testing: !!this.pobjson.testing,
      documentation: !!this.pobjson.documentation,
      fromPob: this.options.fromPob,
    });

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const babelEnvs = pkg.pob.babelEnvs || [];

    const withBabel = !!babelEnvs.length;
    const withReact = withBabel && pkg.pob.withReact === true;

    this.composeWith(require.resolve('../common/typescript'), {
      enable: withBabel,
      withReact,
      updateOnly: this.options.updateOnly,
      baseUrl: './src',
    });

    if (!withBabel) {
      mkdirp('lib');
    }

    if (!inLerna || inLerna.root) {
      this.composeWith(require.resolve('../common/husky'), {});
    }

    this.composeWith(require.resolve('../common/old-dependencies'));

    this.composeWith(require.resolve('./testing'), {
      enable: this.pobjson.testing,
      testing: this.pobjson.testing,
      documentation: !!this.pobjson.documentation,
      codecov: this.pobjson.testing && this.pobjson.testing.codecov,
      circleci: this.pobjson.testing && this.pobjson.testing.circleci,
      // travisci: this.pobjson.testing && this.pobjson.testing.travisci,
    });

    // must be after testing
    this.composeWith(require.resolve('../common/format-lint'), {});

    this.composeWith(require.resolve('./doc'), {
      enabled: this.pobjson.documentation,
      testing: this.pobjson.testing,
    });

    // must be after doc, testing
    this.composeWith(require.resolve('./readme'), {
      documentation: !!this.pobjson.documentation,
      testing: !!this.pobjson.testing,
      circleci: this.pobjson.testing && this.pobjson.testing.circleci,
      // travisci: this.pobjson.testing && this.pobjson.testing.travisci,
      codecov: this.pobjson.testing && this.pobjson.testing.codecov,
    });

    // must be after doc, testing
    this.composeWith(require.resolve('../core/gitignore'), {
      root: !inLerna,
      withBabel: babelEnvs.length !== 0,
      documentation: this.pobjson.documentation,
    });
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (inNpmLerna) {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = '< 0.0.0';
    }

    if ('sideEffects' in pkg) {
      pkg.sideEffects = false;
    }

    const withBabel = Boolean(pkg.pob.babelEnvs);

    packageUtils.removeDevDependencies(pkg, ['lerna']);
    if (inLerna) {
      if (pkg.scripts) {
        delete pkg.scripts.preversion;
        delete pkg.scripts.release;
        delete pkg.scripts.version;
      }
    } else {
      packageUtils.addDevDependencies(pkg, [
        'pob-release',
        'repository-check-dirty',
      ]);
      packageUtils.addScripts(pkg, {
        release: 'repository-check-dirty && pob-release',
        preversion: [
          'yarn run lint',
          withBabel && 'yarn run build',
          this.pobjson.documentation && 'yarn run generate:docs',
          'repository-check-dirty',
        ]
          .filter(Boolean)
          .join(' && '),
        version: 'pob-version',
      });

      if (withBabel) {
        packageUtils.addScripts(pkg, {
          clean: 'rm -Rf dist',
        });
      } else {
        delete pkg.scripts.clean;
      }
    }

    if (!withBabel) {
      if (
        !this.fs.exists(this.destinationPath('lib/index.js')) &&
        this.fs.exists(this.destinationPath('index.js'))
      ) {
        this.fs.move(
          this.destinationPath('index.js'),
          this.destinationPath('lib/index.js')
        );
      }
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    execSync(
      `rm -Rf ${[
        'lib-*',
        'coverage',
        this.pobjson.documentation && 'docs',
        !withBabel && 'dist',
      ]
        .filter(Boolean)
        .join(' ')}`
    );

    const { pobjson } = this;

    // .includes('node6') && 'node6',
    //   this.babelEnvs.includes('node8') && 'node8',
    //   this.babelEnvs.includes('olderNode') && 'older-node',
    //   this.babelEnvs.includes('moduleModernBrowsers') && 'module-modern-browsers',
    //   this.babelEnvs.includes('moduleAllBrowsers') && 'module',
    //   this.babelEnvs.includes('moduleNode8') && 'module-node8',
    //   this.babelEnvs.includes('browsers') && 'browsers',
    // ].filter(Boolean);

    this.config.set('pob-config', pobjson);
    this.config.save();
  }
};
