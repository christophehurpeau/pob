const path = require('path');
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
    const lernaCurrentConfig = this.fs.readJSON(this.destinationPath('lerna.json'), {});
    this.npm = lernaCurrentConfig.version && lernaCurrentConfig.npmClient !== 'yarn';

    // lerna.json
    const lernaConfig = this.npm ? {
      version: 'independent',
    } : {
      version: 'independent',
      npmClient: 'yarn',
      useWorkspaces: true,
      command: {
        publish: {
          npmClient: 'npm',
        },
      },
    };

    this.fs.writeJSON(this.destinationPath('lerna.json'), lernaConfig);
  }

  writing() {
    console.log('lerna: writing');

    // package.json
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    packageUtils.removeDependencies(pkg, ['lerna']);

    if (this.npm) {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = '< 0.0.0';
      pkg.engines.npm = '>= 6.4.0';
    }

    packageUtils.addDevDependencies(pkg, [
      'lerna',
      'repository-check-dirty',
    ]);

    packageUtils.removeDevDependencies(pkg, ['prettier']);

    const withBabel = true;
    const withDocumentation = true;

    packageUtils.addScripts(pkg, {
      'typescript-check': 'lerna run --parallel typescript-check', // this.options.typescript && 'tsc --noEmit tsconfig.json'
      lint: 'lerna run --stream lint',
      test: 'lerna run --stream test',
      build: 'lerna run --stream --concurrency=1 build',
      'build:definitions': 'lerna run --stream build:definitions',
      postbuild: 'yarn run build:definitions',
      watch: 'lerna run --parallel --ignore "*-example" watch',
      'generate:docs': 'lerna run --parallel --ignore "*-example" generate:docs',
      preversion: [
        'yarn run lint',
        withBabel && 'yarn run build',
        'repository-check-dirty',
      ]
        .filter(Boolean)
        .join(' && '),
      prepublishOnly: 'repository-check-dirty',
      release: "GH_TOKEN=$POB_GITHUB_TOKEN lerna version --conventional-commits --github-release -m 'chore: release' && lerna publish from-git",
    });
    delete pkg.scripts.version;


    if (this.npm) {
      delete pkg.workspaces;
      packageUtils.addScripts(pkg, {
        postinstall: 'lerna link',
      });
    } else {
      delete pkg.scripts.postinstall;
      pkg.workspaces = [
        'packages/*',
      ];
    }

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
      spawnSync(process.argv[0], [process.argv[1], 'update', 'from-pob', this.options.force ? '--force' : undefined].filter(Boolean), {
        cwd: `packages/${name}`,
        stdio: 'inherit',
      });
    });
    this.spawnCommandSync('yarn', ['install', '--prefer-offline']);
    this.spawnCommandSync('yarn', ['run', 'preversion']);
  }
};
