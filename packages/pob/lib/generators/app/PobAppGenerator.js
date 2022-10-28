import { execSync } from 'child_process';
import Generator from 'yeoman-generator';
import inLerna from '../../utils/inLerna.js';
import * as packageUtils from '../../utils/package.js';
import { appIgnorePaths } from './ignorePaths.js';

const appsWithTypescript = ['alp', 'next.js', 'remix', 'pobpack'];
const appsWithBrowser = ['alp', 'next.js', 'remix'];

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

    this.option('packageManager', {
      type: String,
      defaults: 'yarn',
      desc: 'yarn or npm',
    });

    this.option('yarnNodeLinker', {
      type: String,
      required: false,
      defaults: 'node-modules',
      desc: 'Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.',
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
        choices: [
          'alp',
          'pobpack',
          'next.js',
          'remix',
          'node',
          'alp-node',
          'other',
        ],
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
        name: 'codecov',
        message: 'Do you want codecov ?',
        default: !config || false,
        when: (values) => values.testing,
      },
      {
        type: 'confirm',
        name: 'ci',
        message: 'Do you want ci ?',
        default: !config || config.ci === undefined ? true : config.ci,
        when: () => !inLerna,
      },
    ]);

    this.config.set('app', this.appConfig);
    this.config.save();
  }

  default() {
    if (this.appConfig.type === 'node' || this.appConfig.type === 'alp-node') {
      this.composeWith('pob:common:babel', {
        updateOnly: this.options.updateOnly,
        isApp: true,
        useAppConfig: this.appConfig.type === 'alp-node',
        testing: this.appConfig.testing,
        documentation: false,
        fromPob: this.options.fromPob,
        buildDirectory: 'build',
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
    const browser = appsWithBrowser.includes(this.appConfig.type);
    const jsx =
      babelEnvs.length > 0 && pkg.pob.jsx !== undefined
        ? pkg.pob.jsx
        : packageUtils.hasReact(pkg);

    const ignorePaths = appIgnorePaths[this.appConfig.type](
      this.appConfig,
    ).filter(Boolean);

    this.composeWith('pob:common:typescript', {
      enable: babel,
      // nextjs now supports src rootDir: this.appConfig.type === 'next.js' ? '.' : 'src',
      builddefs: false,
      dom: browser,
      jsx,
      jsxPreserve: this.appConfig.type === 'next.js',
      forceExcludeNodeModules: this.appConfig.type === 'next.js',
      forceAllowJs: this.appConfig.type === 'next.js',
      updateOnly: this.options.updateOnly,
      resolveJsonModule: true,
      baseUrl: (() => {
        if (
          this.appConfig.type === 'alp' ||
          this.appConfig.type === 'pobpack' ||
          this.appConfig.type === 'node' ||
          this.appConfig.type === 'alp-node' ||
          this.appConfig.type === 'next.js'
        ) {
          return './src';
        }
        if (this.appConfig.type === 'remix') return '.';
        return '';
      })(),
    });

    this.composeWith('pob:common:remove-old-dependencies');

    const enableReleasePlease =
      !inLerna && this.appConfig.testing && this.appConfig.ci;

    if (this.appConfig.type !== 'remix') {
      this.composeWith('pob:common:testing', {
        enable: this.appConfig.testing,
        enableReleasePlease,
        testing: this.appConfig.testing,
        typescript: babel,
        documentation: false,
        codecov: this.appConfig.codecov,
        ci: this.appConfig.ci,
        packageManager: this.options.packageManager,
        isApp: true,
      });

      this.composeWith('pob:common:format-lint', {
        isApp: true,
        documentation: false,
        testing: this.appConfig.testing,
        babel,
        node,
        browser,
        // nextjs now supports src rootAsSrc: this.appConfig.type === 'next.js',
        enableSrcResolver: true,
        packageManager: this.options.packageManager,
        yarnNodeLinker: this.options.yarnNodeLinker,
        ignorePaths: ignorePaths.join('\n'),
        buildDirectory: 'build',
      });

      this.composeWith('pob:common:release', {
        enable: !inLerna && this.appConfig.testing && this.appConfig.ci,
        withBabel: babel,
        documentation: false,
        updateOnly: this.options.updateOnly,
      });
    }

    this.composeWith('pob:core:vscode', {
      root: !inLerna,
      monorepo: false,
      packageManager: this.options.packageManager,
      yarnNodeLinker: this.options.yarnNodeLinker,
      typescript: babel,
      testing: this.appConfig.testing,
    });

    // only for gitignore
    if (this.fs.exists('.env.example')) {
      ignorePaths.push('/.env*', '!/.env.example');
    }

    this.composeWith('pob:core:gitignore', {
      root: !inLerna || inLerna.root,
      documentation: false,
      testing: this.appConfig.testing,
      withBabel: babel,
      paths: ignorePaths.join('\n'),
      buildInGit: false,
    });

    this.composeWith('pob:core:npm', { enable: false });

    switch (this.appConfig.type) {
      case 'next.js':
        this.composeWith('pob:app:nextjs', {
          export: this.appConfig.export,
        });
        break;
      case 'remix':
        this.composeWith('pob:app:remix', {});
        break;
    }

    execSync(
      `rm -Rf ${['lib-*', 'coverage', 'docs', 'dist']
        .filter(Boolean)
        .join(' ')}`,
    );
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    // if (isNpm) {
    //   if (!pkg.engines) pkg.engines = {};
    //   pkg.engines.yarn = '< 0.0.0';
    // } else
    if (pkg.engines) {
      delete pkg.engines.yarn;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
