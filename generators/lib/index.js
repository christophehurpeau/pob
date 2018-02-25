const Generator = require('yeoman-generator');
const execSync = require('child_process').execSync;
const mkdirp = require('mkdirp');
const packageUtils = require('../../utils/package');
const inLerna = require('../../utils/inLerna');

module.exports = class PobLibGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
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

    if (!this.pobjson) {
      this.pobjson = {};
      this.updateOnly = false;
    } else {
      this.updateOnly = this.options.updateOnly;
    }
    if (!this.pobjson.entries) this.pobjson.entries = ['index'];

    this.babelEnvs = this.pobjson.envs || [];

    if (this.babelEnvs && typeof this.babelEnvs[0] === 'string') {
      this.babelEnvs = this.babelEnvs.map((env) => {
        switch (env) {
          case 'es5':
            throw new Error('use olderNode instead.');

          case 'node7':
          case 'node8':
            return {
              target: 'node', version: 8, formats: ['cjs'],
            };

          case 'node6':
            return {
              target: 'node', version: 6, formats: ['cjs'],
            };

          case 'older-node':
            return {
              target: 'node', version: 4, formats: ['cjs'],
            };

          case 'module-node7':
          case 'module-node8':
            return {
              target: 'node', version: 8, formats: ['es'],
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
        circleci: true,
        travisci: true,
        codecov: true,
      };
    }

    if (this.pobjson.documentation === true) {
      this.pobjson.documentation = {
        docklets: this.pobjson.doclets,
      };
      delete this.pobjson.doclets;
    }

    delete this.pobjson.flow;
    delete this.pobjson.react;
  }

  async prompting() {
    const {
      babelNodeVersions = [], babelBrowserVersions = [], babelFormats,
    } = this.updateOnly ? {
      babelTargets: [
        this.babelEnvs.find(env => env.target === 'node') && 'node',
        this.babelEnvs.find(env => env.target === 'browser') && 'browser',
      ].filter(Boolean),
      babelNodeVersions: [
        Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '9')) && '9',
        Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '8')) && '8',
        Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '6')) && '6',
        Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '4')) && '4',
      ].filter(Boolean),
      babelBrowserVersions: [
        Boolean(this.babelEnvs.find(env => env.target === 'browser' && env.version === 'modern')) && 'modern',
        Boolean(this.babelEnvs.find(env => env.target === 'browser' && env.version === undefined)) && undefined,
      ].filter(value => value !== false),
      babelFormats: [
        Boolean(this.babelEnvs.find(env => env.formats.includes('cjs'))) && 'cjs',
        Boolean(this.babelEnvs.find(env => env.formats.includes('es'))) && 'es',
      ].filter(Boolean),
    } : (await this.prompt([
      {
        type: 'checkbox',
        name: 'babelTargets',
        message: 'Babel targets: (don\'t select anything if you don\'t want babel)',
        choices: [
          {
            name: 'Node',
            value: 'node',
            checked: Boolean(this.babelEnvs.find(env => env.target === 'node')),
          },
          {
            name: 'Browser',
            value: 'browser',
            checked: Boolean(this.babelEnvs.find(env => env.target === 'browser')),
          },
        ],
      },

      {
        type: 'checkbox',
        name: 'babelNodeVersions',
        message: 'Babel node versions: (https://github.com/nodejs/Release)',
        when: answers => answers.babelTargets.includes('node'),
        validate: versions => versions.length > 0,
        choices: [
          {
            name: '9 (Current Release)',
            value: '9',
            checked: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '9')),
          },
          {
            name: '8 (Active LTS)',
            value: '8',
            checked: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '8')),
          },
          {
            name: '6 (Active LTS)',
            value: '6',
            checked: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '6')),
          },
          {
            name: '4 (Maintenance LTS)',
            value: '4',
            checked: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '4')),
          },
        ],
      },


      {
        type: 'checkbox',
        name: 'babelBrowserVersions',
        message: 'Babel browser versions',
        when: answers => answers.babelTargets.includes('browser'),
        validate: versions => versions.length > 0,
        choices: [
          {
            name: 'Modern (babel-preset-modern-browsers)',
            value: 'modern',
            checked: Boolean(this.babelEnvs.find(env => env.target === 'browser' && env.version === 'modern')),
          },
          {
            name: 'Supported (babel-preset-env)',
            value: undefined,
            checked: Boolean(this.babelEnvs.find(env => env.target === 'browser' && env.version === undefined)),
          },
        ],
      },

      {
        type: 'checkbox',
        name: 'babelFormats',
        message: 'Babel formats',
        when: answers => answers.babelTargets.length !== 0,
        validate: babelTargets => babelTargets.length > 0,
        choices: [
          {
            name: 'commonjs',
            value: 'cjs',
            checked: Boolean(this.babelEnvs.find(env => env.formats.includes('cjs'))),
          },
          {
            name: 'ES2015 module',
            value: 'es',
            checked: Boolean(this.babelEnvs.find(env => env.formats.includes('es'))),
          },
        ],
      },
    ]));

    this.babelEnvs = [
      ...babelNodeVersions.map(version => ({
        target: 'node', version, formats: babelFormats.includes('es') ? (version === '8' ? babelFormats : ['cjs']) : babelFormats,
      })),
      ...babelBrowserVersions.map(version => ({
        target: 'browser', version, formats: babelFormats.includes('cjs') ? (version === undefined ? babelFormats : ['es']) : babelFormats,
      })),
    ];

    // documentation
    if (!this.updateOnly) {
      const answers = await this.prompt([
        {
          type: 'confirm',
          name: 'documentation',
          message: 'Would you like documentation (manually generated) ?',
          default: this.pobjson.documentation != null ? this.pobjson.documentation : true,
        },
        {
          type: 'confirm',
          name: 'doclets',
          message: 'Would you like doclets ?',
          default: !!this.pobjson.doclets,
        },
      ].filter(Boolean));

      this.pobjson.documentation = !answers.documentation ? false : { doclets: !!answers.doclets };
    }

    // testing
    if (!this.updateOnly) {
      const { testing } = await this.prompt({
        type: 'confirm',
        name: 'testing',
        message: 'Would you like testing ?',
        default: this.pobjson.testing || false,
      });
      this.pobjson.testing = !testing ? false : (this.pobjson.testing || {});

      if (this.pobjson.testing) {
        const testingPrompts = await this.prompt([
          {
            type: 'confirm',
            name: 'circleci',
            message: 'Would you like circleci ?',
            default: this.pobjson.testing.circleci !== false,
          },
          {
            type: 'confirm',
            name: 'travisci',
            message: 'Would you like travisci ?',
            default: this.pobjson.testing.travisci !== false,
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
  }

  default() {
    const withBabel = !!this.babelEnvs.length;

    if (withBabel) {
      this.composeWith(require.resolve('../common/flow'), {
        updateOnly: this.options.updateOnly,
      });
    }

    if (withBabel) {
      this.composeWith(require.resolve('./babel'), {
        testing: !!this.pobjson.testing,
        documentation: !!this.pobjson.documentation,
        babelEnvs: JSON.stringify(this.babelEnvs),
        entries: JSON.stringify(this.pobjson.entries),
      });
    } else {
      mkdirp('lib');
    }

    this.composeWith(require.resolve('../common/format-lint'));

    this.composeWith(require.resolve('./readme'), {
      documentation: !!this.pobjson.documentation,
      testing: !!this.pobjson.testing,
      doclets: this.pobjson.documentation && this.pobjson.documentation.docklets,
      circleci: this.pobjson.testing && this.pobjson.testing.circleci,
      travisci: this.pobjson.testing && this.pobjson.testing.travisci,
      codecov: this.pobjson.testing && this.pobjson.testing.codecov,
    });

    this.composeWith(require.resolve('./testing'), {
      enable: this.pobjson.testing,
      documentation: !!this.pobjson.documentation,
      codecov: this.pobjson.testing && this.pobjson.testing.codecov,
      circleci: this.pobjson.testing && this.pobjson.testing.circleci,
      travisci: this.pobjson.testing && this.pobjson.testing.travisci,
      babelEnvs: JSON.stringify(this.babelEnvs),
    });

    this.composeWith(require.resolve('./doc'), {
      enabled: this.pobjson.documentation,
      testing: this.pobjson.testing,
      doclets: this.pobjson.documentation.doclets,
    });
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const withBabel = Boolean(this.babelEnvs.length);

    packageUtils.removeDevDependencies(pkg, ['springbokjs-library']);
    if (inLerna) {
      packageUtils.removeDevDependencies(pkg, ['lerna', 'pob-release']);
      delete pkg.scripts.preversion;
      delete pkg.scripts.release;
      delete pkg.scripts.version;
    } else {
      packageUtils.addDevDependency(pkg, 'pob-release', '^3.1.0');
      packageUtils.addScripts(pkg, {
        release: 'pob-repository-check-clean && pob-release',
        preversion: ['yarn run lint', withBabel && 'yarn run build', 'pob-repository-check-clean']
          .filter(Boolean)
          .join(' && '),
        version: 'pob-version',
        clean: 'rm -Rf docs dist',
      });
    }

    if (!withBabel) {
      pkg.main = './lib/index.js';
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.node = '>=4.0.0';

      if (!this.fs.exists(this.destinationPath('lib/index.js'))
          && this.fs.exists(this.destinationPath('index.js'))) {
        this.fs.move(
          this.destinationPath('index.js'),
          this.destinationPath('lib/index.js'),
        );
      }
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    execSync('rm -Rf lib-* coverage');

    const pobjson = this.pobjson;

    pobjson.envs = this.babelEnvs;
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
