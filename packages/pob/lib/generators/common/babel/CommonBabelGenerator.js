import semver from 'semver';
import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';
import { copyAndFormatTpl } from '../../../utils/writeAndFormat.js';

export default class CommonBabelGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'Avoid asking questions',
    });

    this.option('testing', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'Has testing.',
    });

    this.option('fromPob', {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option('isApp', {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option('isAppLibrary', {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option('useAppConfig', {
      type: Boolean,
      required: false,
      default: false,
    });

    this.option('buildDirectory', {
      type: String,
      required: false,
      default: 'dist',
    });

    this.option('onlyLatestLTS', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'only latest lts',
    });
  }

  initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (pkg.pob && pkg.pob.babelEnvs) {
      let babelEnvs = pkg.pob.babelEnvs;
      if (
        !babelEnvs.some(
          (env) =>
            env.target === 'node' &&
            String(env.version) === (this.options.onlyLatestLTS ? '20' : '18'),
        ) &&
        babelEnvs.some(
          (env) =>
            env.target === 'node' &&
            (['8', '6', '10', '12', '14', '16'].includes(String(env.version)) ||
              (this.options.onlyLatestLTS && String(env.version) === '18')),
        )
      ) {
        babelEnvs.unshift({
          target: 'node',
          version: this.options.onlyLatestLTS ? '20' : '18',
          omitVersionInFileName: this.options.onlyLatestLTS ? true : undefined,
        });
      }
      babelEnvs = babelEnvs.filter(
        (env) =>
          env.target !== 'node' ||
          env.version >= (this.options.onlyLatestLTS ? 20 : 18),
      );

      pkg.pob.babelEnvs = babelEnvs;
      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    }
  }

  async prompting() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const hasInitialPkgPob = !!pkg.pob;

    if (!hasInitialPkgPob) pkg.pob = {};

    const babelEnvs = pkg.pob.babelEnvs || [];

    const targets = [
      babelEnvs.some((env) => env.target === 'node') ? 'node' : undefined,
      babelEnvs.some((env) => env.target === 'browser') ? 'browser' : undefined,
    ].filter(Boolean);
    const nodeVersions = [
      ...new Set(
        babelEnvs
          .filter((env) => env.target === 'node')
          .map((env) => {
            if (
              env.version === '14' ||
              env.version === '16' ||
              (this.options.onlyLatestLTS && env.version === '18')
            ) {
              return this.options.onlyLatestLTS ? '20' : '18';
            }
            return env.version;
          }),
      ),
    ];
    const browserVersions = babelEnvs
      .filter((env) => env.target === 'browser')
      .map((env) => (env.version === undefined ? 'supported' : env.version));
    const formats = [
      babelEnvs.some((env) => env.formats?.includes('cjs')) ? 'cjs' : undefined,
      babelEnvs.some((env) => !env.formats || env.formats.includes('es'))
        ? 'es'
        : undefined,
    ].filter(Boolean);
    const jsx =
      (pkg.pob.jsx || pkg.pob.withReact) === undefined
        ? packageUtils.hasReact(pkg)
        : pkg.pob.jsx || pkg.pob.withReact;

    let babelConfig = { targets, nodeVersions, browserVersions, formats, jsx };

    if (!hasInitialPkgPob || !this.options.updateOnly) {
      babelConfig = await this.prompt([
        {
          type: 'checkbox',
          name: 'targets',
          message:
            "Babel targets: (don't select anything if you don't want babel)",
          default: targets,
          choices: [
            {
              name: 'Node',
              value: 'node',
            },
            {
              name: 'Browser',
              value: 'browser',
            },
          ],
        },

        {
          type: 'checkbox',
          name: 'nodeVersions',
          message: 'Babel node versions: (https://github.com/nodejs/Release)',
          when: ({ targets = [] }) => targets.includes('node'),
          validate: (versions) => versions.length > 0,
          default: nodeVersions,
          choices: [
            {
              name: '20 (Active LTS)',
              value: '20',
            },
            {
              name: '18 (Maintenance LTS)',
              value: '18',
            },
          ],
        },

        // {
        //   type: 'checkbox',
        //   name: 'browserVersions',
        //   message: 'Babel browser versions',
        //   when: ({ targets = [] }) => targets.includes('browser'),
        //   validate: (versions) => versions.length > 0,
        //   default: browserVersions,
        //   choices: [
        //     {
        //       name: 'Modern',
        //       value: 'modern',
        //     },
        //     {
        //       name: 'Supported',
        //       value: 'supported',
        //     },
        //   ],
        // },

        {
          type: 'confirm',
          name: 'jsx',
          message: 'Enable JSX ?',
          when: ({ targets = [] }) => targets.length > 0,
          default: jsx,
        },
      ]);
    }

    if (babelConfig.targets.includes('browser')) {
      babelConfig.browserVersions = ['supported'];
    }

    if (hasInitialPkgPob && pkg.main && !pkg.exports) {
      const result = await this.prompt({
        type: 'confirm',
        name: 'setupExports',
        message: 'Setup package.json "exports" field based on "main" ?',
      });

      if (result.setupExports) {
        pkg.exports = pkg.main;
      }
    }

    const newBabelEnvs = [
      ...(babelConfig.nodeVersions || []).map((version) => ({
        target: 'node',
        version,
        formats:
          babelConfig.formats && babelConfig.formats.includes('cjs')
            ? // eslint-disable-next-line unicorn/no-nested-ternary
              version === '18' || version === '20'
              ? babelConfig.formats
              : undefined
            : undefined,
        omitVersionInFileName:
          // todo add `|| babelConfig.nodeVersions.length === 1` in next major
          version === '20' && this.options.onlyLatestLTS ? true : undefined,
      })),
      ...(babelConfig.browserVersions || []).map((version) => ({
        target: 'browser',
        version: version === 'supported' ? undefined : version,
        formats:
          babelConfig.formats && babelConfig.formats.includes('cjs')
            ? // eslint-disable-next-line unicorn/no-nested-ternary
              version === 'supported'
              ? babelConfig.formats
              : undefined
            : undefined,
      })),
    ];

    delete pkg.pob.withReact;
    if (newBabelEnvs.length === 0) {
      delete pkg.pob.babelEnvs;
      if (!pkg.pob.typescript) {
        delete pkg.pob.entries;
        delete pkg.pob.jsx;
      }
    } else {
      pkg.pob.babelEnvs = newBabelEnvs;
      pkg.pob.entries = pkg.pob.entries || ['index'];
      if (pkg.pob.jsx) {
        pkg.pob.jsx = jsx;
      } else {
        delete pkg.pob.jsx;
      }
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  configuring() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    this.entries = pkg.pob.entries;
    this.babelEnvs = pkg.pob.babelEnvs || [];

    if (this.entries) {
      this.entries.forEach((entry) => {
        const entryDestPath = this.destinationPath(`${entry}.js`);
        // TODO check nightingale before uncomment this
        // if (this.options.isApp && entry !== 'index') {
        //   this.fs.write(
        //     entryDestPath,
        //     `// resolution for eslint-plugin-import\nexport * from './src/${entry}/index.ts';\n`,
        //   );
        // } else {
        this.fs.delete(entryDestPath);
        // }
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
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const useBabel = this.babelEnvs && this.babelEnvs.length > 0;
    const useTypescript = useBabel || pkg.pob?.typescript;
    const hasTargetNode = useBabel
      ? this.babelEnvs.find((env) => env.target === 'node')
      : useTypescript; // todo pkg.pob.typescriptTargets
    const hasTargetBrowser = this.babelEnvs.find(
      (env) => env.target === 'browser',
    );

    /* dependencies */

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      useBabel || (pkg.peerDependencies && pkg.peerDependencies['@babel/core']),
      ['@babel/core'],
    );
    packageUtils.addOrRemoveDevDependencies(pkg, useBabel, ['pob-babel']);

    if (pkg.dependencies && pkg.dependencies['pob-babel']) {
      // update pob-babel in alp-dev
      packageUtils.addDependencies(pkg, ['pob-babel'], '^');
    }
    if (pkg.dependencies && pkg.dependencies['@babel/runtime']) {
      // update pob-babel in alp-dev
      packageUtils.addDependencies(pkg, ['@babel/runtime'], '^');
    }

    const isLibraryRollupPlugin = pkg.name.includes('rollup-plugin');

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      (useBabel && pkg.pob.jsx) ||
        (pkg.devDependencies?.['@babel/preset-react'] && isLibraryRollupPlugin),
      ['@babel/preset-react'],
    );

    packageUtils.removeDevDependencies(pkg, [
      'babel-preset-env', // now @babel/preset-env
      'babel-preset-jsdoc',
      'babel-plugin-add-jsdoc-annotations',
      'babel-preset-modern-browsers',
    ]);

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      this.babelEnvs.find(
        (env) => env.target === 'browser' && env.version === undefined,
      ) ||
        (pkg.devDependencies?.['@babel/preset-env'] && isLibraryRollupPlugin),
      ['@babel/preset-env'],
    );

    /* engines */

    if (hasTargetNode) {
      if (!pkg.engines) pkg.engines = {};
      const minNodeVersion = useBabel
        ? Math.min(
            ...this.babelEnvs
              .filter((env) => env.target === 'node')
              .map((env) => env.version),
          )
        : // eslint-disable-next-line unicorn/no-unreadable-iife
          (() => (this.options.onlyLatestLTS ? '20' : '18'))();
      switch (String(minNodeVersion)) {
        case '10':
        case '12':
        case '14':
        case '16':
        case '18':
          pkg.engines.node = '>=18.12.0';
          break;
        case '20':
          pkg.engines.node = '>=20.9.0';
          break;
        default:
          throw new Error(`Invalid min node version: ${minNodeVersion}`);
      }

      if (pkg.dependencies && pkg.dependencies['@types/node']) {
        pkg.dependencies['@types/node'] = `>=${minNodeVersion}.0.0`;
      }
      if (
        pkg.devDependencies &&
        pkg.devDependencies['@types/node'] &&
        !semver.satisfies(
          pkg.devDependencies['@types/node'],
          `>=${minNodeVersion}.0.0`,
        )
      ) {
        pkg.devDependencies['@types/node'] = `>=${minNodeVersion}.0.0`;
      }
    } else {
      packageUtils.removeDependencies(pkg, ['@types/node']);
      packageUtils.removeDevDependencies(pkg, ['@types/node']);
      // Supports oldest current or active LTS version of node
      if (this.options.onlyLatestLTS) {
        pkg.engines.node = '>=20.9.0';
      } else {
        pkg.engines.node = '>=18.12.0';
      }
    }

    /* browserslist */

    if (hasTargetBrowser) {
      if (pkg.browserslist && pkg.browserslist.modern) {
        delete pkg.browserslist.modern;
      }
      pkg.browserslist = {
        ...(Array.isArray(pkg.browserslist) ? {} : pkg.browserslist),
        production: [
          'defaults',
          '> 0.2%',
          'not ie < 12',
          'not safari < 10',
          'not ios_saf < 10',
        ],
        // configured in babel preset
        // modern: ['defaults and >1% and supports es6-module'],
      };
    } else if (
      this.options.isApp &&
      !this.options.isAppLibrary &&
      pkg.browserslist
    ) {
      pkg.browserslist = {
        ...pkg.browserslist,
        production: [
          'defaults',
          '> 0.2%',
          'not ie < 12',
          'not safari < 10',
          'not ios_saf < 10',
        ],
      };
    } else {
      delete pkg.browserslist;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  writing() {
    this.fs.delete('types.js');

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const useBabel = this.babelEnvs && this.babelEnvs.length > 0;
    const entries = pkg.pob.entries || ['index'];

    /* pob-babel config */

    packageUtils.removeDevDependencies(pkg, ['@rollup/plugin-run']);
    packageUtils.removeDependencies(pkg, ['alp-rollup-plugin-config']);

    this.fs.delete('rollup.config.js');
    if (useBabel) {
      if (this.options.isApp) {
        copyAndFormatTpl(
          this.fs,
          this.templatePath('app.rollup.config.mjs.ejs'),
          this.destinationPath('rollup.config.mjs'),
          {
            config: this.options.useAppConfig,
            outDirectory: this.options.buildDirectory,
            enableRun: !this.options.isAppLibrary && entries.includes('index'),
          },
        );
      } else {
        copyAndFormatTpl(
          this.fs,
          this.templatePath('lib.rollup.config.mjs.ejs'),
          this.destinationPath('rollup.config.mjs'),
          {
            outDirectory: this.options.buildDirectory,
          },
        );
      }
    } else if (!pkg.pob.typescript && pkg.pob.rollup !== false) {
      this.fs.delete('rollup.config.mjs');
    }

    /* jest babel config */

    this.fs.delete('.babelrc');
    this.fs.delete('babel.config.json');
    this.fs.delete('babel.config.mjs');
    if (this.fs.exists(this.destinationPath('babel.config.js'))) {
      this.fs.move(
        this.destinationPath('babel.config.js'),
        this.destinationPath('babel.config.cjs'),
      );
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
