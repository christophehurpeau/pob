import { spawnSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';
import {
  copyAndFormatTpl,
  writeAndFormatJson,
} from '../../../utils/writeAndFormat.js';

export default class MonorepoLernaGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('isAppProject', {
      type: Boolean,
      defaults: true,
      desc: 'is app project',
    });

    this.option('packageManager', {
      type: String,
      defaults: 'yarn',
      desc: 'yarn or npm',
    });
  }

  initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    const packagesPaths = pkg.workspaces
      ? pkg.workspaces.map((workspace) => workspace.replace(/\/\*$/, ''))
      : ['packages'];

    this.packagePaths = packagesPaths.flatMap((packagesPath) =>
      existsSync(`${packagesPath}/`)
        ? readdirSync(`${packagesPath}/`).map(
            (packageName) => `${packagesPath}/${packageName}`,
          )
        : [],
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

    const lernaCurrentConfig = this.fs.readJSON(
      this.destinationPath('lerna.json'),
      pkg.lerna || {},
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

    if (!lernaConfig.command) lernaConfig.command = {};
    if (!lernaConfig.command.publish) lernaConfig.command.publish = {};

    lernaConfig.command.publish.ignoreChanges =
      (lernaCurrentConfig &&
        lernaCurrentConfig.command &&
        lernaCurrentConfig.command.publish &&
        lernaCurrentConfig.command.publish.ignoreChanges) ||
      [];

    writeAndFormatJson(
      this.fs,
      this.destinationPath('lerna.json'),
      lernaConfig,
    );
  }

  writing() {
    console.log('lerna: writing');

    const getPackagePobConfig = (config) => ({
      babelEnvs: [],
      ...((config && config.pob) || {}),
    });
    const withBabel = this.packages.some(
      (config) => getPackagePobConfig(config).babelEnvs.length > 0,
    );

    // lerna.json
    const lernaConfig = this.fs.readJSON(
      this.destinationPath('lerna.json'),
      {},
    );

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

    writeAndFormatJson(
      this.fs,
      this.destinationPath('lerna.json'),
      lernaConfig,
    );

    // package.json
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    delete pkg.lerna;
    packageUtils.removeDependencies(pkg, ['lerna', '@pob/lerna-light']);
    packageUtils.removeDevDependencies(pkg, ['lerna']);

    if (this.fs.exists(this.destinationPath('lerna-debug.log'))) {
      this.fs.delete(this.destinationPath('lerna-debug.log'));
    }
    if (this.npm) {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = '< 0.0.0';
      pkg.engines.npm = '>= 6.4.0';
    } else if (pkg.engines) {
      delete pkg.engines.yarn;
    }

    if (pkg.name === 'pob-monorepo') {
      pkg.devDependencies['@pob/lerna-light'] = 'workspace:*';
    } else {
      packageUtils.addDevDependencies(pkg, ['@pob/lerna-light']);
    }

    if (pkg.name !== 'pob-monorepo') {
      packageUtils.addDevDependencies(pkg, ['repository-check-dirty']);
    }

    packageUtils.removeDevDependencies(pkg, ['standard-version']);

    const getPobConfig = (config) => ({
      ...((config &&
        config.pob &&
        (config.pob['pob-config'] || config.pob.lib || config.pob.app)) ||
        {}),
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
    const useYarnWorkspacesCommand =
      pkg.name === 'pob-monorepo' || pkg.name === 'nightingale-monorepo'; // this.options.packageManager === 'yarn';

    packageUtils.addScripts(pkg, {
      lint: `${packageManager} run lint:prettier && ${packageManager} run lint:eslint`,
      'lint:prettier': 'prettier --check .',
      'lint:eslint':
        monorepoConfig &&
        monorepoConfig.eslint &&
        // TODO yarn --cwd doesnt work inside script in package with yarn 2
        (this.packagesConfig.length < 25 ||
          this.options.packageManager === 'yarn')
          ? 'eslint --report-unused-disable-directives --resolve-plugins-relative-to . --quiet .'
          : 'lerna run --stream lint',
      preversion: [
        monorepoConfig &&
        monorepoConfig.eslint &&
        (this.packagesConfig.length < 25 ||
          this.options.packageManager === 'yarn')
          ? `${packageManager} run lint`
          : `${packageManager} run lint:prettier && ${packageManager} run lint:eslint${
              useYarnWorkspacesCommand ? '' : ' --since'
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
          this.options.packageManager === 'yarn' ? '' : 'cross-env '
        }GH_TOKEN=$POB_GITHUB_TOKEN lerna version --conventional-commits --conventional-graduate --create-release=github -m 'chore: release'`,
        !this.options.isAppProject && 'lerna publish from-git',
      ]
        .filter(Boolean)
        .join(' && '),
    });

    packageUtils.addOrRemoveScripts(pkg, withTests, {
      test: `${
        useYarnWorkspacesCommand
          ? 'yarn workspaces foreach --parallel -Av run'
          : 'lerna run --stream'
      } test`,
    });

    packageUtils.addOrRemoveScripts(pkg, withBabel, {
      build: `${
        useYarnWorkspacesCommand
          ? 'yarn workspaces foreach --parallel --topological-dev -Av run'
          : 'lerna run --stream'
      } build`,
      watch: `${
        useYarnWorkspacesCommand
          ? 'yarn workspaces foreach --parallel --exclude "*-example" -Av run'
          : 'lerna run --parallel --ignore "*-example"'
      } watch`,
    });

    // packageUtils.addOrRemoveScripts(pkg, withTypescript, {
    //   'build:definitions': `${
    //     useYarnWorkspacesCommand
    //       ? 'yarn workspaces foreach --parallel --exclude "*-example" -Av run'
    //       : 'lerna run --stream'
    //   } build:definitions`,
    // });

    // if (withTypescript) {
    //   pkg.scripts.build += `${packageManager} run build:definitions${
    //     useYarnWorkspacesCommand ? '' : ' --since'
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
      if (
        !pkg.scripts.postinstall ||
        !pkg.scripts.postinstall.includes('pob-root-postinstall')
      ) {
        pkg.scripts.postinstall = 'pob-root-postinstall';
      }
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

    switch (this.options.packageManager) {
      case 'npm':
        this.spawnCommandSync('npm', ['install']);
        this.spawnCommandSync('npm', ['run', 'preversion']);
        break;
      case 'yarn':
        // see CoreYarnGenerator
        break;
    }
  }
}
