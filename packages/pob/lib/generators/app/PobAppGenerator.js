import Generator from 'yeoman-generator';
import inLerna from '../../utils/inLerna.js';
import inNpmLerna from '../../utils/inNpmLerna.js';
import * as packageUtils from '../../utils/package.js';
import { appIgnorePaths } from './ignorePaths.js';

const appsWithTypescript = ['alp', 'next.js', 'pobpack'];
const appsWithNode = ['alp', 'next.js'];

export default class PobAppGenerator extends Generator {
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
    this.appConfig =
      this.config.get('app') || this.config.get('pob-app-config');

    this.config.delete('pob-app-config'); // deprecated

    // see lib, in case the app migrating from a lib when app were not available
    this.config.delete('pob'); // deprecated
    this.config.delete('pob-config'); // deprecated
    this.fs.delete('.pob.json'); // deprecated
    this.config.delete('pob-lib-config'); // in case coming from lib
  }

  async prompting() {
    const config = this.appConfig;

    if (config && this.options.updateOnly) {
      this.config.set('app', this.appConfig);
      this.config.save();
      return;
    }

    this.appConfig = await this.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What kind of app is this ?',
        default: (config && config.type) || 'alp',
        choices: ['alp', 'pobpack', 'next.js', 'node', 'other'],
      },
      {
        type: 'confirm',
        name: 'export',
        message: 'Use next export ?',
        default: false,
        when: (values) => values.type === 'next.js',
      },
      {
        type: 'confirm',
        name: 'testing',
        message: 'Do you want testing ?',
        default:
          !config || config.testing === undefined ? false : config.testing,
      },
      {
        type: 'confirm',
        name: 'ci',
        message: 'Do you want ci ?',
        default: !config || config.ci === undefined ? true : config.ci,
      },
    ]);

    this.config.set('app', this.appConfig);
    this.config.save();
  }

  default() {
    if (this.appConfig.type === 'node') {
      this.composeWith('pob:common:babel', {
        updateOnly: this.options.updateOnly,
        isApp: true,
        testing: this.appConfig.testing,
        documentation: false,
        fromPob: this.options.fromPob,
      });
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (!inLerna || inLerna.root) {
      this.composeWith('pob:common:husky', {});
    }

    const babelEnvs = (pkg.pob && pkg.pob.babelEnvs) || [];
    const babel =
      babelEnvs.length > 0 || appsWithTypescript.includes(this.appConfig.type);
    const node = true;
    const browser = appsWithNode.includes(this.appConfig.type);
    const jsx =
      babelEnvs.length > 0 && pkg.pob.jsx !== undefined
        ? pkg.pob.jsx
        : packageUtils.hasReact(pkg);

    const ignorePaths = appIgnorePaths[this.appConfig.type](
      this.appConfig,
    ).filter(Boolean);

    this.composeWith('pob:common:typescript', {
      enable: babel,
      builddefs: false,
      jsx,
      updateOnly: this.options.updateOnly,
      baseUrl: (() => {
        if (
          this.appConfig.type === 'alp' ||
          this.appConfig.type === 'pobpack'
        ) {
          return './src';
        }
        if (this.appConfig.type === 'next.js') return '.';
        return '';
      })(),
    });

    this.composeWith('pob:common:remove-old-dependencies');

    this.composeWith('pob:common:testing', {
      enable: this.appConfig.testing,
      testing: this.appConfig.testing,
      typescript: babel,
      documentation: false,
      codecov: false,
      ci: this.appConfig.ci,
    });

    this.composeWith('pob:common:format-lint', {
      documentation: false,
      testing: this.appConfig.testing,
      babel,
      node,
      browser,
      enableSrcResolver: true,
      useYarn2: this.options.useYarn2,
      ignorePaths: ignorePaths.join('\n'),
    });

    this.composeWith('pob:core:gitignore', {
      root: !inLerna || inLerna.root,
      documentation: false,
      withBabel: babel,
      paths: ignorePaths.join('\n'),
      buildInGit: false,
    });

    switch (this.appConfig.type) {
      case 'next.js':
        this.composeWith('pob:app:nextjs', {
          export: this.appConfig.export,
        });
        break;
    }
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (inNpmLerna) {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = '< 0.0.0';
    } else if (pkg.engines) {
      delete pkg.engines.yarn;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
