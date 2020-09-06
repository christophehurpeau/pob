'use strict';

const Generator = require('yeoman-generator');
const inLerna = require('../../utils/inLerna');
const inNpmLerna = require('../../utils/inNpmLerna');
const packageUtils = require('../../utils/package');

const gitignorePaths = {
  alp: (config) => ['# alp paths', '/build', '/public', '/data'],
  'next.js': (config) => ['# next.js paths', '/.next', '/out'],
  pobpack: (config) => ['/build', '/public'],
  node: (config) => ['/dist'],
  other: (config) => [],
};

const appsWithTypescript = ['alp', 'next.js', 'pobpack'];
const appsWithNode = ['alp', 'next.js'];

module.exports = class PobAppGenerator extends Generator {
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

  async prompting() {
    const config = this.config.get('app');
    if (config && this.options.updateOnly) {
      this.appConfig = config;
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
    ]);

    this.config.set('app', this.appConfig);
  }

  default() {
    if (this.appConfig.type === 'node') {
      this.composeWith(require.resolve('../common/babel'), {
        updateOnly: this.options.updateOnly,
        isApp: true,
        testing: false,
        documentation: false,
        fromPob: this.options.fromPob,
      });
    }

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (!inLerna || inLerna.root) {
      this.composeWith(require.resolve('../common/husky'), {});
    }

    const babelEnvs = (pkg.pob && pkg.pob.babelEnvs) || [];
    const babel =
      !!babelEnvs.length || appsWithTypescript.includes(this.appConfig.type);
    const node = true;
    const browser = appsWithNode.includes(this.appConfig.type);
    const jsx =
      babelEnvs.length !== 0 && pkg.pob.jsx !== undefined
        ? pkg.pob.jsx
        : packageUtils.hasReact(pkg);

    this.composeWith(require.resolve('../common/typescript'), {
      enable: babel,
      builddefs: false,
      jsx,
      updateOnly: this.options.updateOnly,
      baseUrl:
        this.appConfig.type === 'alp' || this.appConfig.type === 'pobpack'
          ? './src'
          : '',
    });

    this.composeWith(require.resolve('../common/format-lint'), {
      documentation: false,
      testing: false,
      babel,
      node,
      browser,
      enableSrcResolver: true,
    });

    this.composeWith(require.resolve('../common/old-dependencies'));

    this.composeWith(require.resolve('../core/gitignore'), {
      root: !inLerna || inLerna.root,
      documentation: false,
      withBabel: babel,
      paths: gitignorePaths[this.appConfig.type](this.appConfig)
        .filter(Boolean)
        .join('\n'),
      buildInGit: false,
    });

    switch (this.appConfig.type) {
      case 'next.js':
        this.composeWith(require.resolve('./nextjs'), {
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
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
