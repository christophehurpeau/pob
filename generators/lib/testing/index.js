const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class TestingGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('enable', {
      type: Boolean,
      defaults: true,
      desc: 'enable testing',
    });

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

    this.option('babelEnvs', {
      type: String,
      required: true,
      desc: 'Babel Envs',
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

    packageUtils.removeDevDependencies(pkg, [
      'coveralls',
      'mocha',
      'istanbul',
    ]);

    if (!this.options.enable) {
      packageUtils.removeDevDependencies(pkg, [
        'jest',
        'jest-junit-reporter',
      ]);

      delete pkg.jest;
      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    } else {
      this.babelEnvs = JSON.parse(this.options.babelEnvs);

      packageUtils.addScripts(pkg, {
        test: 'jest',
        'generate:test-coverage': [
          'rm -Rf docs/coverage/',
          'NODE_ENV=production BABEL_ENV=test jest --coverage --coverageReporters=lcov --coverageDirectory=docs/coverage/',
        ].join(' ; '),
      });

      packageUtils.addDevDependencies(pkg, {
        jest: '^22.3.0',
      });

      const hasBabel = packageUtils.transpileWithBabel(pkg);
      const hasReact = hasBabel && packageUtils.hasReact(pkg);
      const hasLerna = packageUtils.hasLerna(pkg);
      const srcDirectory = hasBabel ? 'src' : 'lib';

      packageUtils.addOrRemoveDevDependencies(pkg, hasBabel, { 'babel-jest': '^22.2.2' });

      if (!pkg.jest) pkg.jest = {};
      Object.assign(pkg.jest, {
        cacheDirectory: './node_modules/.cache/jest',
        testMatch: [
          `<rootDir>/${hasLerna ? '**/' : ''}${srcDirectory}/**/__tests__/**/*.js${hasReact ? '?(x)' : ''}`,
          `<rootDir>/${hasLerna ? '**/' : ''}${srcDirectory}/**/*.test.js${hasReact ? '?(x)' : ''}`,
        ],
        collectCoverageFrom: [
          `${srcDirectory}/**/*.js${hasReact ? '?(x)' : ''}`,
        ],
      });

      packageUtils.addOrRemoveDevDependencies(pkg, this.options.circleci, { 'jest-junit-reporter': '^1.1.0' });
    }

    if (this.options.circleci) {
      try {
        // this.fs.copyTpl(
        //   this.templatePath('circle.yml.ejs'),
        //   this.destinationPath('circle.yml'),
        //   {
        //     testing: this.options.enable,
        //     documentation: this.options.documentation,
        //     codecov: this.options.codecov,
        //   },
        // );
        this.fs.delete(this.destinationPath('circle.yml'));
        this.fs.copyTpl(
          this.templatePath('circleci2.yml.ejs'),
          this.destinationPath('.circleci/config.yml'),
          {
            testing: this.options.enable,
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
      this.fs.copyTpl(
        this.templatePath('travis.yml.ejs'),
        this.destinationPath('.travis.yml'),
        {
          node8: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '8')),
          node6: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '6')),
          node4: Boolean(this.babelEnvs.find(env => env.target === 'node' && String(env.version) === '4')),
        },
      );
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
