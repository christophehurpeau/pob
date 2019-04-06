'use strict';

const { readdirSync, existsSync } = require('fs');
const { spawnSync } = require('child_process');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class LernaGenerator extends Generator {
  initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    const packagesPath = pkg.workspaces
      ? pkg.workspaces[0].replace(/\/\*$/, '')
      : 'packages';

    this.packagesPath = packagesPath;
    this.packageNames = existsSync(`${packagesPath}/`)
      ? readdirSync(`${packagesPath}/`)
      : [];
    this.packages = this.packageNames
      .map((packageName) =>
        this.fs.readJSON(
          this.destinationPath(`${packagesPath}/${packageName}/package.json`)
        )
      )
      .filter(Boolean);
    this.packagesConfig = this.packageNames
      .map((packageName) =>
        this.fs.readJSON(
          this.destinationPath(`${packagesPath}/${packageName}/.yo-rc.json`)
        )
      )
      .filter(Boolean);
  }

  default() {
    const lernaCurrentConfig = this.fs.readJSON(
      this.destinationPath('lerna.json'),
      {}
    );
    this.npm =
      lernaCurrentConfig.version && lernaCurrentConfig.npmClient !== 'yarn';

    // lerna.json
    const lernaConfig = this.npm
      ? {
          version: 'independent',
        }
      : {
          version: lernaCurrentConfig.version || 'independent',
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

    packageUtils.addDevDependencies(pkg, ['lerna', 'repository-check-dirty']);

    packageUtils.removeDevDependencies(pkg, ['pob-release']);

    const getPobConfig = (config) =>
      Object.assign(
        { envs: [] },
        (config && config.pob && config.pob['pob-config']) || {}
      );
    const withBabel = this.packagesConfig.some(
      (config) => getPobConfig(config).envs.length !== 0
    );
    // ynnub doesnt use babel but still have typescript
    const withTypescript = this.packageNames.some((packageName) =>
      this.fs.exists(
        this.destinationPath(
          `${this.packagesPath}/${packageName}/tsconfig.json`
        )
      )
    );
    const withDocumentation = this.packagesConfig.some(
      (config) => getPobConfig(config).documentation
    );
    const withTests = this.packagesConfig.some(
      (config) => getPobConfig(config).testing
    );

    packageUtils.addScripts(pkg, {
      lint: 'lerna run --stream lint',
      preversion: [
        'yarn run lint --since',
        withBabel && 'yarn run build --since',
        'repository-check-dirty',
      ]
        .filter(Boolean)
        .join(' && '),
      // cannot use this with lerna because it changes packages.json
      // prepublishOnly: 'repository-check-dirty',
      release:
        "GH_TOKEN=$POB_GITHUB_TOKEN lerna version --conventional-commits --github-release -m 'chore: release' && lerna publish from-git",
    });

    packageUtils.addOrRemoveScripts(pkg, withTests, {
      test: 'lerna run --stream test',
    });

    packageUtils.addOrRemoveScripts(pkg, withBabel, {
      build: 'lerna run --stream build',
      watch: 'lerna run --parallel --ignore "*-example" watch',
    });

    packageUtils.addOrRemoveScripts(pkg, withTypescript, {
      'build:definitions': 'lerna run --stream build:definitions',
      postbuild: 'yarn run build:definitions --since',
    });

    packageUtils.addOrRemoveScripts(pkg, withDocumentation, {
      'generate:docs':
        'lerna run --parallel --ignore "*-example" generate:docs',
    });

    delete pkg.scripts.version;
    delete pkg.scripts.prepublishOnly;

    if (this.npm) {
      delete pkg.workspaces;
      packageUtils.addScripts(pkg, {
        postinstall: 'lerna link',
      });
    } else {
      delete pkg.scripts.postinstall;
      if (!pkg.workspaces) {
        pkg.workspaces = ['packages/*'];
      }
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
      if (
        !existsSync(`${this.packagesPath}/${name}/.yo-rc.json`) &&
        !existsSync(`${this.packagesPath}/${name}/.pob.json`)
      ) {
        return;
      }
      console.log(`=> update ${name}`);
      spawnSync(
        process.argv[0],
        [
          process.argv[1],
          'update',
          'from-pob',
          this.options.force ? '--force' : undefined,
        ].filter(Boolean),
        {
          cwd: `${this.packagesPath}/${name}`,
          stdio: 'inherit',
        }
      );
    });
    this.spawnCommandSync('yarn', ['install', '--prefer-offline']);
    this.spawnCommandSync('yarn', ['run', 'preversion']);
  }
};
