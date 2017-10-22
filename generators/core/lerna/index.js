const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class extends Generator {
  writing() {
    // lerna.json
    const lernaConfig = {
      lerna: '2.0.0-rc.5',
      npmClient: 'yarn',
      packages: [
        'packages/*',
      ],
      version: 'independent',
      commands: {
        publish: {
          ignore: [
            '*.md',
            'test/**',
          ],
        },
      },
    };

    this.fs.writeJSON(this.destinationPath('lerna.json'), lernaConfig);


    // package.json
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    packageUtils.addDependencies(pkg, {
      lerna: '^2.0.0-rc.5',
    });
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);


    // README.md
    const readmePath = this.destinationPath('README.md');

    let content;

    if (this.fs.exists(readmePath)) {
      const readmeFullContent = this.fs.read(readmePath);
      content = readmeFullContent.match(/^#(?:[^#*]+)([^]+)$/);
      content = content ? content[1].trim() : '';
    }

    this.fs.copyTpl(this.templatePath('README.md.ejs'), readmePath, {
      projectName: pkg.name,
      description: pkg.description,
      content,
    });
  }
};
