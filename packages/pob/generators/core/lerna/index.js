const { readdirSync, existsSync } = require('fs');
const { spawnSync } = require('child_process');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class LernaGenerator extends Generator {
  initializing() {
    this.packageNames = existsSync('packages/') ? readdirSync('packages/') : [];
    this.packages = this.packageNames
      .map(packageName => this.fs.readJSON(this.destinationPath(`packages/${packageName}/package.json`)))
      .filter(Boolean);
  }

  default() {
    // lerna.json
    const lernaConfig = {
      lerna: '3.0.0-beta.21',
      npmClient: 'yarn',
      useWorkspaces: true,
      version: 'independent',
      command: {
        publish: {
          ignoreChanges: [
            '*-example',
          ],
        },
      },
    };

    this.fs.writeJSON(this.destinationPath('lerna.json'), lernaConfig);
  }

  writing() {
    console.log('lerna: writing');

    // package.json
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    packageUtils.removeDependency(pkg, 'lerna');

    packageUtils.addDevDependencies(pkg, {
      lerna: '3.0.0-beta.21',
      'pob-release': '^4.1.1', // only for pob-repository-check-clean
    });

    const withBabel = true;
    const withDocumentation = true;

    packageUtils.addScripts(pkg, {
      lint: 'lerna run --stream lint',
      test: 'lerna run --stream test',
      build: 'lerna run --ignore "*-example" build',
      watch: 'lerna run --parallel --ignore "*-example" watch',
      'generate:docs': 'lerna run --parallel --ignore "*-example" generate:docs',
      preversion: [
        'yarn run lint',
        withBabel && 'yarn run build',
        withDocumentation && 'yarn run generate:docs',
        // 'pob-repository-check-clean'
      ]
        .filter(Boolean)
        .join(' && '),
      release: "lerna publish --conventional-commits -m 'chore: release'",
    });
    delete pkg.scripts.version;

    pkg.workspaces = [
      'packages/*',
    ];

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    // README.md
    const readmePath = this.destinationPath('README.md');

    let content = '';

    if (this.fs.exists(readmePath)) {
      const readmeFullContent = this.fs.read(readmePath);
      content = readmeFullContent.match(/^<h3(?:[^#*]+)([^]+)$/);
      if (!content) content = readmeFullContent.match(/^#(?:[^#*]+)([^]+)$/);
      content = content ? content[1].trim() : readmeFullContent;
    }

    this.fs.copyTpl(this.templatePath('README.md.ejs'), readmePath, {
      projectName: pkg.name,
      description: pkg.description,
      packages: this.packages,
      circleci: this.fs.exists(this.destinationPath('.circleci/config.yml')),
      content,
    });
  }

  end() {
    this.packageNames.forEach((name) => {
      if (!existsSync(`packages/${name}/.yo-rc.json`) && !existsSync(`packages/${name}/.pob.json`)) return;
      console.log(`=> update ${name}`);
      spawnSync(process.argv[0], [process.argv[1], 'update', 'from-pob'], {
        cwd: `packages/${name}`,
        stdio: 'inherit',
      });
    });
    this.spawnCommandSync('yarn', ['install']);
    this.spawnCommandSync('yarn', ['run', 'build']);
  }
};
