'use strict';

const { spawnSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');
const { copyAndFormatTpl } = require('../../../utils/writeAndFormat');

module.exports = class LernaGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('isAppProject', {
      type: Boolean,
      defaults: true,
      desc: 'is app project',
    });

    this.option('useYarn2', {
      type: Boolean,
      defaults: false,
      desc: 'is yarn 2 monorepo',
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
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    const lernaCurrentConfig =
      pkg.lerna || this.fs.readJSON(this.destinationPath('lerna.json'), {});

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
      if (!this.options.useYarn2) {
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

    if (this.fs.exists(this.destinationPath('lerna.json'))) {
      this.fs.delete(this.destinationPath('lerna.json'));
    }

    pkg.lerna = lernaConfig;

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
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

    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    const lernaConfig = pkg.lerna;

    lernaConfig.command.publish.ignoreChanges = [
      '**/.yo-rc.json',
      '**/.eslintrc.json',
    ];

    if (withBabel) {
      lernaConfig.command.publish.ignoreChanges.push(
        '**/tsconfig.json',
        '**/tsconfig.build.json',
      );
    }

    packageUtils.removeDependencies(pkg, ['lerna', '@pob/lerna-light']);
    packageUtils.removeDevDependencies(pkg, ['lerna']);

    if (this.fs.exists(this.destinationPath('lerna-debug.log'))) {
      this.fs.delete(this.destinationPath('lerna-debug.log'));
    }
    if (this.npm) {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = '< 0.0.0';
      pkg.engines.npm = '>= 6.4.0';
    }

    packageUtils.addDevDependencies(pkg, ['@pob/lerna-light']);

    if (pkg.name !== 'pob-monorepo') {
      packageUtils.addDevDependencies(pkg, ['repository-check-dirty']);
    }

    packageUtils.removeDevDependencies(pkg, ['standard-version']);

    const getPobConfig = (config) => ({
      ...((config && config.pob && config.pob['pob-config']) || {}),
    });
    // ynnub doesnt use babel but still have typescript
    // const withTypescript = this.packagePaths.some((packagePath) =>
    //   this.fs.exists(this.destinationPath(`${packagePath}/tsconfig.json`)),
    // );
    const withTests = this.packagesConfig.some(
      (config) => getPobConfig(config).testing,
    );

    const monorepoConfig = this.config.get('monorepo');
    const packageManager = this.npm ? 'npm' : 'yarn';
    const useYarn2WorkspacesCommand = false; // this.options.useYarn2;

    packageUtils.addScripts(pkg, {
      lint: `${packageManager} run lint:prettier && ${packageManager} run lint:eslint`,
      'lint:prettier': 'prettier --check .',
      'lint:eslint':
        monorepoConfig && monorepoConfig.eslint
          ? 'eslint --report-unused-disable-directives --quiet --resolve-plugins-relative-to . --ext js,ts,tsx .'
          : 'lerna run --stream lint',
      preversion: [
        monorepoConfig && monorepoConfig.eslint
          ? `${packageManager} run lint`
          : `${packageManager} run lint:prettier && ${packageManager} run lint:eslint${
              useYarn2WorkspacesCommand ? '' : ' --since'
            }`,
        withBabel && `${packageManager} run build`,
        'repository-check-dirty',
      ]
        .filter(Boolean)
        .join(' && '),
      // cannot use this with lerna because it changes packages.json
      // prepublishOnly: 'repository-check-dirty',
      release: [
        `${
          this.options.useYarn2 ? '' : 'cross-env '
        }GH_TOKEN=$POB_GITHUB_TOKEN lerna version --conventional-commits --conventional-graduate --create-release=github -m 'chore: release'`,
        !this.options.isAppProject && 'lerna publish from-git',
      ]
        .filter(Boolean)
        .join(' && '),
    });

    packageUtils.addOrRemoveScripts(pkg, withTests, {
      test: `${
        useYarn2WorkspacesCommand
          ? 'yarn workspaces foreach --parallel -Av run'
          : 'lerna run --stream'
      } test`,
    });

    packageUtils.addOrRemoveScripts(pkg, withBabel, {
      build: `${
        useYarn2WorkspacesCommand
          ? 'yarn workspaces foreach -Av run'
          : 'lerna run --stream'
      } build`,
      watch: `${
        useYarn2WorkspacesCommand
          ? 'yarn workspaces foreach --parallel --exclude "*-example" -Av run'
          : 'lerna run --parallel --ignore "*-example"'
      } watch`,
    });

    // packageUtils.addOrRemoveScripts(pkg, withTypescript, {
    //   'build:definitions': `${
    //     useYarn2WorkspacesCommand
    //       ? 'yarn workspaces foreach --parallel --exclude "*-example" -Av run'
    //       : 'lerna run --stream'
    //   } build:definitions`,
    // });

    // if (withTypescript) {
    //   pkg.scripts.build += `${packageManager} run build:definitions${
    //     useYarn2WorkspacesCommand ? '' : ' --since'
    //   }`;
    // }

    delete pkg.scripts.postbuild;
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

    copyAndFormatTpl(this.fs, this.templatePath('README.md.ejs'), readmePath, {
      projectName: pkg.name,
      description: pkg.description,
      packages: this.packages,
      ci: this.fs.exists(this.destinationPath('.github/workflows/push.yml')),
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
    if (this.npm) {
      this.spawnCommandSync('npm', ['install']);
      this.spawnCommandSync('npm', ['run', 'preversion']);
    } else {
      this.spawnCommandSync('yarn', ['install']);
      this.spawnCommandSync('yarn', ['run', 'preversion']);
    }
  }
};
