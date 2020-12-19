'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const Generator = require('yeoman-generator');
const inLerna = require('../../utils/inLerna');
const inNpmLerna = require('../../utils/inNpmLerna');
const packageUtils = require('../../utils/package');

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

    this.option('useYarn2', {
      type: Boolean,
      required: false,
      defaults: false,
    });
  }

  initializing() {
    this.pobjson =
      this.config.get('lib') ||
      this.config.get('pob') ||
      this.config.get('pob-config') ||
      this.config.get('pob-lib-config');
    if (!this.pobjson) {
      this.pobjson = this.fs.readJSON(this.destinationPath('.pob.json'), null);
      if (this.pobjson) {
        this.config.set('lib', this.pobjson);
        this.config.save();
      }
    }

    this.config.delete('pob'); // deprecated
    this.config.delete('pob-config'); // deprecated
    this.config.delete('pob-lib-config'); // deprecated
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
    const jsx =
      this.pobjson.withReact || pobPkgConfig.withReact || pobPkgConfig.jsx;

    if (babelEnvs && typeof babelEnvs[0] === 'string') {
      babelEnvs = babelEnvs.map((env) => {
        switch (env) {
          case 'node6':
          case 'node7':
          case 'node8':
          case 'node10':
            return {
              target: 'node',
              version: 12,
              formats: ['cjs'],
            };

          case 'webpack-node7':
          case 'module-node7':
          case 'module-node8':
            return {
              target: 'node',
              version: 12,
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

    if (this.pobjson.testing === true) {
      this.pobjson.testing = {
        ci: true,
        codecov: true,
      };
    } else if (this.pobjson.testing) {
      delete this.pobjson.testing.travisci;
      if ('circleci' in this.pobjson.testing) {
        this.pobjson.testing.ci = this.pobjson.testing.circleci;
        delete this.pobjson.testing.circleci;
      }
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

    delete pkg.pob.withReact;
    if (babelEnvs && babelEnvs.length > 0) {
      pkg.pob.babelEnvs = babelEnvs;
      pkg.pob.entries = entries;
      pkg.pob.jsx = jsx;
    } else {
      delete pkg.pob.babelEnvs;
      delete pkg.pob.entries;
      delete pkg.pob.jsx;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    // documentation
    if (inLerna && !inLerna.root) {
      this.pobjson.documentation = false;
    } else if (!this.updateOnly) {
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
            name: 'ci',
            message: 'Would you like ci with github actions ?',
            default: this.pobjson.testing.ci !== false,
          },
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
    const jsx = withBabel && pkg.pob.jsx === true;

    this.composeWith(require.resolve('../common/typescript'), {
      enable: withBabel,
      jsx,
      updateOnly: this.options.updateOnly,
      baseUrl: './src',
      builddefs: true,
    });

    if (!withBabel) {
      // recursive does not throw if directory already exists
      fs.mkdirSync(this.destinationPath('lib'), { recursive: true });
    }

    if (!inLerna || inLerna.root) {
      this.composeWith(require.resolve('../common/husky'), {});
    }

    this.composeWith(require.resolve('../common/old-dependencies'));

    this.composeWith(require.resolve('../common/testing'), {
      enable: this.pobjson.testing,
      testing: this.pobjson.testing,
      documentation: !!this.pobjson.documentation,
      codecov: this.pobjson.testing && this.pobjson.testing.codecov,
      ci: this.pobjson.testing && this.pobjson.testing.ci,
    });

    // must be after testing
    this.composeWith(require.resolve('../common/format-lint'), {
      documentation: !!this.pobjson.documentation,
      testing: this.pobjson.testing,
      useYarn2: this.options.useYarn2,
    });

    this.composeWith(require.resolve('./doc'), {
      enabled: this.pobjson.documentation,
      testing: this.pobjson.testing,
    });

    // must be after doc, testing
    this.composeWith(require.resolve('./readme'), {
      documentation: !!this.pobjson.documentation,
      testing: !!this.pobjson.testing,
      ci: this.pobjson.testing && this.pobjson.testing.ci,
      // travisci: this.pobjson.testing && this.pobjson.testing.travisci,
      codecov: this.pobjson.testing && this.pobjson.testing.codecov,
    });

    // must be after doc, testing
    this.composeWith(require.resolve('../core/gitignore'), {
      root: !inLerna,
      withBabel: babelEnvs.length !== 0,
      typescript: babelEnvs.length !== 0,
      documentation: this.pobjson.documentation,
    });
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const isNpmPackageLock = this.fs.exists('package-lock.json');
    const isNpm = isNpmPackageLock || inNpmLerna;

    if (isNpm) {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = '< 0.0.0';
    }

    if ('sideEffects' in pkg) {
      pkg.sideEffects = false;
    }

    const withBabel = Boolean(pkg.pob.babelEnvs);

    packageUtils.removeDevDependencies(pkg, ['lerna', '@pob/lerna-light']);
    if (inLerna) {
      if (pkg.scripts) {
        if (pkg.name !== 'pob-dependencies') {
          delete pkg.scripts.preversion;
        }
        delete pkg.scripts.release;
        delete pkg.scripts.version;
      }
    } else {
      packageUtils.addDevDependencies(pkg, ['standard-version']);
      if (pkg.name !== 'pob-monorepo') {
        packageUtils.addScripts(pkg, {
          release:
            "repository-check-dirty && yarn preversion && standard-version -a -m 'chore(release): %s [skip ci]' && git push --follow-tags origin master && npm publish",
          preversion: [
            `${isNpm ? 'npm' : 'yarn'} run lint`,
            withBabel && `${isNpm ? 'npm' : 'yarn'} run build`,
            this.pobjson.documentation &&
              `${isNpm ? 'npm' : 'yarn'} run generate:docs`,
            'repository-check-dirty',
          ]
            .filter(Boolean)
            .join(' && '),
        });

        if (pkg.scripts.version === 'pob-version') {
          delete pkg.scripts.version;
        }
      }

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
          this.destinationPath('lib/index.js'),
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
        .join(' ')}`,
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

    this.config.set('lib', pobjson);
    this.config.save();
  }
};
