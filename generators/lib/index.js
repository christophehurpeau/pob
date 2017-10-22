const Generator = require('yeoman-generator');
const mkdirp = require('mkdirp');
const packageUtils = require('../../utils/package');
const inLerna = require('../../utils/inLerna');

module.exports = class PobGenerator extends Generator {
  initializing() {
    this.pkg = this.fs.readJSON(this.destinationPath('package.json'));
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

    if (!this.pobjson) this.pobjson = {};
    if (!this.pobjson.entries) this.pobjson.entries = ['index'];

    this.babelEnvs = this.pobjson.envs || [];
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
    const { babelEnvs } = await this.prompt([
      {
        type: 'checkbox',
        name: 'babelEnvs',
        message: 'Babel envs:',
        choices: [
          {
            name: 'Node8 - commonjs',
            value: 'node8',
            checked: this.babelEnvs.includes('node7') || this.babelEnvs.includes('node8'),
          },
          {
            name: 'Node8 - ES2015 module',
            value: 'moduleNode8',
            checked:
                  this.babelEnvs.includes('module-node8') ||
                  this.babelEnvs.includes('module-node7') ||
                  this.babelEnvs.includes('webpack-node7') ||
                  this.babelEnvs.includes('webpack-node6'),
          },
          {
            name: 'Node6 - commonjs',
            value: 'node6',
            checked: this.babelEnvs.includes('node6'),
          },
          {
            name: 'Node < 6 - commonjs',
            value: 'olderNode',
            checked: this.babelEnvs.includes('older-node'),
          },
          {
            name: 'Modern browsers (latest version of firefox and chrome) - module',
            value: 'moduleModernBrowsers',
            checked:
                  this.babelEnvs.includes('module-modern-browsers') ||
                  this.babelEnvs.includes('webpack-modern-browsers'),
          },
          {
            name: 'All Browsers - module',
            value: 'moduleAllBrowsers',
            checked:
                  this.babelEnvs.includes('module') ||
                  this.babelEnvs.includes('webpack'),
          },
          {
            name: 'All Browsers - commonjs',
            value: 'browsers',
            checked: this.babelEnvs.includes('browsers'),
          },
        ],
      },
    ]);
    this.babelEnvs = babelEnvs;


    const props = await this.prompt([
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

    this.pobjson.documentation = !props.documentation ? false : { doclets: !!props.doclets };

    // testing
    const { testing } = await this.prompt(
      {
        type: 'confirm',
        name: 'testing',
        message: 'Would you like testing ?',
        default: this.pobjson.testing,
      },
    );
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

  default() {
    const withBabel = !!this.babelEnvs.length;

    if (withBabel) {
      this.composeWith(require.resolve('../common/flow'));
    }

    if (withBabel) {
      this.composeWith(require.resolve('./babel'), {
        documentation: !!this.pobjson.documentation,
        env_node8: this.babelEnvs.includes('node8'),
        env_node6: this.babelEnvs.includes('node6'),
        env_olderNode: this.babelEnvs.includes('olderNode'),
        env_module_modernBrowsers: this.babelEnvs.includes('moduleModernBrowsers'),
        env_module_allBrowsers: this.babelEnvs.includes('moduleAllBrowsers'),
        env_module_node8: this.babelEnvs.includes('moduleNode8'),
        env_browsers: this.babelEnvs.includes('browsers'),
        entries: this.pobjson.entries,
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

    if (this.pobjson.testing) {
      this.composeWith(require.resolve('./testing'), {
        withBabel,
        documentation: !!this.pobjson.documentation,
        codecov: this.pobjson.testing.codecov,
        circleci: this.pobjson.testing.circleci,
        travisci: this.pobjson.testing.travisci,
        env_node8: this.babelEnvs.includes('node8'),
        env_node6: this.babelEnvs.includes('node6'),
        env_olderNode: this.babelEnvs.includes('olderNode'),
      });
    }

    this.composeWith(require.resolve('./doc'), {
      enabled: this.pobjson.documentation,
      testing: this.pobjson.testing,
      doclets: this.pobjson.documentation.doclets,
    });
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const withBabel = !!this.babelEnvs.length;


    if (inLerna) {
      packageUtils.removeDevDependency(pkg, 'pob-release');
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
        clean: 'rm -Rf docs dist test/node6 coverage',
      });
    }
    packageUtils.removeDevDependency(pkg, 'springbokjs-library');

    if (!withBabel) {
      pkg.main = './lib/index.js';
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.node = '>=4.0.0';
      packageUtils.sort(pkg);

      if (!this.fs.exists(this.destinationPath('lib/index.js'))
          && this.fs.exists(this.destinationPath('index.js'))) {
        this.fs.move(
          this.destinationPath('index.js'),
          this.destinationPath('lib/index.js'),
        );
      }
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    const pobjson = this.pobjson;

    pobjson.envs = [
      this.babelEnvs.includes('node6') && 'node6',
      this.babelEnvs.includes('node8') && 'node8',
      this.babelEnvs.includes('olderNode') && 'older-node',
      this.babelEnvs.includes('moduleModernBrowsers') && 'module-modern-browsers',
      this.babelEnvs.includes('moduleAllBrowsers') && 'module',
      this.babelEnvs.includes('moduleNode8') && 'module-node8',
      this.babelEnvs.includes('browsers') && 'browsers',
    ].filter(Boolean);

    this.config.set('pob-config', pobjson);
    this.config.save();
  }
};
