'use strict';

const Generator = require('yeoman-generator');
const packageUtils = require('../../utils/package');
const inLerna = require('../../utils/inLerna');
const inNpmLerna = require('../../utils/inNpmLerna');

const gitignorePaths = {
  alp: (config) => ['# alp paths', '/build', '/public', '/data'],
  'next.js': (config) => ['# next.js paths', config.export && '/.next', '/out'],
  pobpack: (config) => ['/build', '/public'],
  other: (config) => [],
};

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
        choices: ['alp', 'pobpack', 'next.js', 'other'],
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
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const babelEnvs = [{ target: 'browser' }, { target: 'node' }];
    const withReact = packageUtils.hasReact(pkg);

    this.composeWith(require.resolve('../common/typescript'), {
      enable: babelEnvs.length !== 0,
      withReact,
      updateOnly: this.options.updateOnly,
      baseUrl:
        this.appConfig.type === 'alp' || this.appConfig.type === 'pobpack'
          ? './src'
          : '',
    });

    if (!inLerna || inLerna.root) {
      this.composeWith(require.resolve('../common/husky'), {
        babelEnvs: JSON.stringify(this.babelEnvs),
      });
    }

    this.composeWith(require.resolve('../common/format-lint'), {
      babelEnvs: JSON.stringify(babelEnvs),
    });

    this.composeWith(require.resolve('../common/old-dependencies'));

    this.composeWith(require.resolve('../core/gitignore'), {
      root: !inLerna || inLerna.root,
      documentation: false,
      withBabel: babelEnvs.length !== 0,
      paths: gitignorePaths[this.appConfig.type](this.appConfig)
        .filter(Boolean)
        .join('\n'),
    });
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
