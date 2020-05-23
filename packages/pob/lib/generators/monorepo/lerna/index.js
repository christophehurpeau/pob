'use strict';

const { readdirSync, existsSync } = require('fs');
const { spawnSync } = require('child_process');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class LernaGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('isAppProject', {
      type: Boolean,
      defaults: true,
      desc: 'is app project',
    });
  }

  initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    const packagesPaths = pkg.workspaces
      ? pkg.workspaces.map((workspace) => workspace.replace(/\/\*$/, ''))
      : ['packages'];

    this.packagePaths = [].concat(
      ...packagesPaths.map((packagesPath) => {
        return existsSync(`${packagesPath}/`)
          ? readdirSync(`${packagesPath}/`).map(
              (packageName) => `${packagesPath}/${packageName}`,
            )
          : [];
      }),
    );
    this.packages = this.packagePaths
      .map((packagePath) =>
        this.fs.readJSON(this.destinationPath(`${packagePath}/package.json`)),
      )
      .filter(Boolean);
    this.packagesConfig = this.packagePaths
      .map((packagePath) =>
        this.fs.readJSON(this.destinationPath(`${packagePath}/.yo-rc.json`)),
      )
      .filter(Boolean);
  }

  default() {
    const lernaCurrentConfig = this.fs.readJSON(
      this.destinationPath('lerna.json'),
      {},
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
        };

    if (!this.npm) {
      const isYarn2 = this.fs.exists('.yarnrc.yml');
      if (!isYarn2) {
        lernaConfig.command = {
          publish: {
            npmClient: 'npm',
          },
        };
      }
    }

    if (!lernaConfig.command) lernaConfig.command = {};
    if (!lernaConfig.command.publish) lernaConfig.command.publish = {};

    lernaConfig.command.publish.ignoreChanges =
      (lernaCurrentConfig &&
        lernaCurrentConfig.command &&
        lernaCurrentConfig.command.publish &&
        lernaCurrentConfig.command.publish.ignoreChanges) ||
      [];

    this.fs.writeJSON(this.destinationPath('lerna.json'), lernaConfig);
  }

  writing() {
    console.log('lerna: writing');

    const getPackagePobConfig = (config) => ({
      babelEnvs: [],
      ...((config && config.pob) || {}),
    });
    const withBabel = this.packages.some(
      (config) => getPackagePobConfig(config).babelEnvs.length !== 0,
    );

    const isYarn2 = this.fs.exists('.yarnrc.yml');

    // lerna.json
    const lernaConfig = this.fs.readJSON(
      this.destinationPath('lerna.json'),
      {},
    );

    lernaConfig.command.publish.ignoreChanges = [
      '**/.yo-rc.json',
      '**/renovate.json',
      '**/.eslintrc.json',
    ];

    if (withBabel) {
      lernaConfig.command.publish.ignoreChanges.push(
        '**/tsconfig.json',
        '**/tsconfig.build.json',
      );
    }

    this.fs.writeJSON(this.destinationPath('lerna.json'), lernaConfig);

    // package.json
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    packageUtils.removeDependencies(pkg, ['lerna']);

    if (this.fs.exists(this.destinationPath('lerna-debug.log'))) {
      this.fs.delete(this.destinationPath('lerna-debug.log'));
    }
    if (this.npm) {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = '< 0.0.0';
      pkg.engines.npm = '>= 6.4.0';
    }

    packageUtils.addDevDependencies(pkg, ['lerna']);

    if (pkg.name !== 'pob-monorepo') {
      packageUtils.addDevDependencies(pkg, ['repository-check-dirty']);
    }

    packageUtils.removeDevDependencies(pkg, ['pob-release']);

    const getPobConfig = (config) => ({
      ...((config && config.pob && config.pob['pob-config']) || {}),
    });
    // ynnub doesnt use babel but still have typescript
    const withTypescript = this.packagePaths.some((packagePath) =>
      this.fs.exists(this.destinationPath(`${packagePath}/tsconfig.json`)),
    );
    const withDocumentation = this.packagesConfig.some(
      (config) => getPobConfig(config).documentation,
    );
    const withTests = this.packagesConfig.some(
      (config) => getPobConfig(config).testing,
    );

    const monorepoConfig = this.config.get('monorepo');

    packageUtils.addScripts(pkg, {
      lint:
        monorepoConfig && monorepoConfig.eslint
          ? 'eslint --ext js,ts,tsx .'
          : 'lerna run --stream lint',
      preversion: [
        monorepoConfig && monorepoConfig.eslint
          ? 'yarn run lint'
          : 'yarn run lint --since',
        withBabel && 'yarn run build --since -- -- --no-clean',
        'repository-check-dirty',
      ]
        .filter(Boolean)
        .join(' && '),
      // cannot use this with lerna because it changes packages.json
      // prepublishOnly: 'repository-check-dirty',
      release: [
        `${
          isYarn2 ? '' : 'cross-env '
        }GH_TOKEN=$POB_GITHUB_TOKEN lerna version --conventional-commits --conventional-graduate --create-release=github -m 'chore: release'`,
        !this.options.isAppProject && 'lerna publish from-git',
      ]
        .filter(Boolean)
        .join(' && '),
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

    if (withDocumentation) {
      pkg.scripts.postbuild = `${
        pkg.scripts.postbuild ? `${pkg.scripts.postbuild} && ` : ''
      }yarn run generate:docs`;
    }

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
      content = readmeFullContent.match(/^<h3[^#*]+([^]+)$/);
      if (!content) content = readmeFullContent.match(/^#[^#*]+([^]+)$/);
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
    this.packagePaths.forEach((packagePath) => {
      if (
        !existsSync(`${packagePath}/.yo-rc.json`) &&
        !existsSync(`${packagePath}/.pob.json`)
      ) {
        return;
      }
      console.log(`=> update ${packagePath}`);
      spawnSync(
        process.argv[0],
        [
          process.argv[1],
          'update',
          'from-pob',
          this.options.force ? '--force' : undefined,
        ].filter(Boolean),
        {
          cwd: packagePath,
          stdio: 'inherit',
        },
      );
    });
    this.spawnCommandSync('yarn', ['install']);
    this.spawnCommandSync('yarn', ['run', 'preversion']);
  }
};
