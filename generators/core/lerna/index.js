const { readdirSync, existsSync } = require('fs');
const { spawnSync } = require('child_process');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class LernaGenerator extends Generator {
  writing() {
    console.log('lerna: writing');
    // lerna.json
    const lernaConfig = {
      lerna: '2.9.0',
      npmClient: 'yarn',
      useWorkspaces: true,
      version: 'independent',
      commands: {
        publish: {
          ignore: [
            '*-example',
          ],
        },
      },
    };

    this.fs.writeJSON(this.destinationPath('lerna.json'), lernaConfig);


    // package.json
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    packageUtils.removeDependency(pkg, 'lerna');

    packageUtils.addDevDependencies(pkg, {
      lerna: '2.9.0',
    });
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    pkg.workspaces = [
      'packages/*',
    ];


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

  end() {
    readdirSync('packages/').forEach((name) => {
      if (!existsSync(`packages/${name}/.yo-rc.json`)) return;
      console.log(`=> update ${name}`);
      spawnSync(process.argv[0], [process.argv[1], 'update'], {
        cwd: `packages/${name}`,
        stdio: 'inherit',
      });
    });
  }
};
