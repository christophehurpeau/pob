const Generator = require('yeoman-generator');
const camelCase = require('lodash.camelcase');
const packageUtils = require('../../../utils/package');
const inLerna = require('../../../utils/inLerna');

module.exports = class ReadmeGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('privatePackage', {
      type: Boolean,
      required: true,
      desc: 'If the project is private',
    });

    this.option('documentation', {
      type: Boolean,
      required: true,
      desc: 'Include documentation',
    });

    this.option('testing', {
      type: Boolean,
      required: true,
      desc: 'Include testing badge',
    });

    this.option('circleci', {
      type: Boolean,
      required: true,
      desc: 'circleci badge and documentation link',
    });

    // this.option('travisci', {
    //   type: Boolean,
    //   required: true,
    //   desc: 'travisci badge',
    // });

    this.option('codecov', {
      type: Boolean,
      required: true,
      desc: 'Include codecov badge',
    });

    this.option('content', {
      type: String,
      required: false,
      desc: 'Readme content',
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    const readmePath = this.destinationPath('README.md');
    let content = this.options.content;

    if (this.fs.exists(readmePath)) {
      const readmeFullContent = this.fs.read(readmePath);
      content = readmeFullContent.match(/^<h3(?:[^#*]+)([^]+)(?:\[npm-image]:)/);
      if (!content) content = readmeFullContent.match(/^<h3(?:[^#*]+)([^]+)(?:\[daviddm-image]:)/);
      if (!content) content = readmeFullContent.match(/^<h3(?:[^#*]+)([^]+)$/);
      if (!content) content = readmeFullContent.match(/^#(?:[^#*]+)([^]+)(?:\[npm-image]:)/);
      if (!content) content = readmeFullContent.match(/^#(?:[^#*]+)([^]+)(?:\[daviddm-image]:)/);
      if (!content) content = readmeFullContent.match(/^#(?:[^#*]+)([^]+)$/);
      content = content ? content[1].trim() : readmeFullContent;
    }

    const author = packageUtils.parsePkgAuthor(pkg);

    const repository = (pkg.repository && pkg.repository.url) || pkg.repository;
    const match = repository
      && repository.match(/^(?:git@)?(?:([^:/.]+)(?:\.com)?:)?([^:/]+)\/([^:/.]+)(?:.git)?/);
    const [, gitHost, gitAccount, gitName] = match || [];
    try {
      this.fs.copyTpl(this.templatePath('README.md.ejs'), readmePath, {
        privatePackage: pkg.private,
        packageName: pkg.name,
        camelCaseProjectName: camelCase(pkg.name),
        description: pkg.description,
        inLerna,
        gitHost,
        gitAccount,
        gitName,
        author: {
          name: author.name,
          url: author.url,
        },
        license: pkg.license,
        codecov: this.options.codecov,
        documentation: this.options.documentation,
        testing: this.options.testing,
        circleci: this.options.circleci,
        // travisci: this.options.travisci,
        travisci: false,
        content,
      });
    } catch (err) {
      console.log(err.stack || err.message || err);
      throw err;
    }
  }
};
