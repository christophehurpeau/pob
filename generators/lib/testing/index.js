const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('circleci', {
      type: Boolean,
      required: true,
      desc: 'circleci',
    });

    this.option('travisci', {
      type: Boolean,
      required: true,
      desc: 'travisci',
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

    this.option('codecov', {
      type: Boolean,
      required: true,
      desc: 'Include codecov report',
    });

    this.option('documentation', {
      type: Boolean,
      required: true,
      desc: 'Include documentation generation',
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.addScripts(pkg, {
      test: 'jest',
      'generate:test-coverage': [
        'NODE_ENV=production rm -Rf coverage/',
        'jest --coverage --coverageReporters=lcov --coverageDirectory=coverage/',
      ].join(' ; '),
    });

    packageUtils.addDevDependencies(pkg, {
      jest: '^20.0.4',
    });
    packageUtils.removeDevDependencies(pkg, [
      'coveralls',
      'mocha',
      'istanbul',
    ]);

    const hasReact = packageUtils.hasReact(pkg);

    pkg.jest = {
      cacheDirectory: './node_modules/.cache/jest',
      testMatch: [
        `**/src/**/?(*.)test.js${hasReact ? '?(x)' : ''}`,
        `**/__tests__/**/*.test.js${hasReact ? '?(x)' : ''}`,
      ],
      collectCoverageFrom: [
        `src/**/*.js${hasReact ? '?(x)' : ''}`,
      ],
    };

    this.fs.copy(this.templatePath('babelrc.json'), this.destinationPath('.babelrc'));

    if (this.options.circleci) {
      packageUtils.addDevDependency(pkg, 'jest-junit-reporter', '^1.1.0');
    }

    packageUtils.sort(pkg);
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    if (this.options.circleci) {
      try {
        this.fs.copyTpl(
          this.templatePath('circle.yml.ejs'),
          this.destinationPath('circle.yml'),
          {
            documentation: this.options.documentation,
            codecov: this.options.codecov,
          },
        );
      } catch (err) {
        console.log(err.stack || err.message || err);
        throw err;
      }
    }

    if (this.options.travisci) {
      const { env_node6, env_node8, env_olderNode } = this.options;
      this.fs.copyTpl(
        this.templatePath('travis.yml.ejs'),
        this.destinationPath('.travis.yml'),
        {
          node6: env_node6 || env_olderNode,
          node4: env_olderNode,
        },
      );
    }
  }
};
