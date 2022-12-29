import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { platform } from 'process';
import { PackageGraph } from '@lerna/package-graph';
import { Project as LernaProject } from '@lerna/project';
import Generator from 'yeoman-generator';
import * as packageUtils from '../../utils/package.js';
import { copyAndFormatTpl } from '../../utils/writeAndFormat.js';

const getAppTypes = (configs) => {
  const appConfigs = configs.filter(
    (config) => config && config.project && config.project.type === 'app',
  );

  const appTypes = new Set();
  appConfigs.forEach((config) => {
    appTypes.add(config.app.type);
  });

  return [...appTypes];
};

const hasDist = (packages, configs) =>
  configs.some(
    (config, index) =>
      !!(config && config.project && config.project.type === 'lib') &&
      !!(
        packages[index].get('pob') &&
        packages[index].get('pob').babelEnvs &&
        packages[index].get('pob').babelEnvs.length > 0
      ),
  );

const hasBuild = (packages, configs) =>
  configs.some(
    (config, index) =>
      !!(
        config &&
        config.project &&
        config.project.type === 'app' &&
        config.app.type === 'alp-node'
      ),
  );

export default class PobMonorepoGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });

    this.option('isAppProject', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'app project, no pusblishing on npm',
    });

    this.option('packageManager', {
      type: String,
      defaults: 'yarn',
      desc: 'yarn or npm',
    });

    this.option('yarnNodeLinker', {
      type: String,
      required: false,
      defaults: 'pnp',
      desc: 'Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.',
    });
  }

  async initializing() {
    this.lernaProject = new LernaProject(this.destinationPath());
    const packages = await this.lernaProject.getPackages();
    const graph = new PackageGraph(packages);
    const [cyclePaths] = graph.partitionCycles();

    if (cyclePaths.size > 0) {
      const cycleMessage = [
        'Dependency cycles detected, you should fix these!',
        ...cyclePaths.map((cycle) => cycle.join(' -> ')),
      ].join('\n');

      console.warn(cycleMessage);
    }

    this.packages = [];
    this.packageLocations = [];

    while (graph.size > 0) {
      // pick the current set of nodes _without_ localDependencies (aka it is a "source" node)
      const batch = [...graph.values()].filter(
        (node) => node.localDependencies.size === 0,
      );
      batch.sort((a, b) => a.name.localeCompare(b.name, 'en'));

      // batches are composed of Package instances, not PackageGraphNodes
      this.packages.push(...batch.map((node) => node.pkg));
      this.packageLocations.push(
        ...batch.map((node) =>
          path
            .relative(this.destinationPath(), node.location)
            // transform windows path to linux
            .replace(/\\+/g, '/'),
        ),
      );

      // pruning the graph changes the node.localDependencies.size test
      graph.prune(...batch);
    }

    this.packageNames = this.packages.map((pkg) => pkg.name);
    this.packageConfigs = this.packageLocations.map((location) => {
      try {
        return JSON.parse(fs.readFileSync(`${location}/.yo-rc.json`)).pob;
      } catch {
        console.warn(`warn: could not read pob config in ${location}`);
        return {};
      }
    });
  }

  async prompting() {
    const config = this.config.get('monorepo');
    if (this.options.updateOnly && config) {
      this.pobLernaConfig = config;
      this.pobLernaConfig.packageNames = this.packageNames;
      this.config.set('monorepo', this.pobLernaConfig);
      return;
    }

    this.pobLernaConfig = await this.prompt([
      {
        type: 'confirm',
        name: 'ci',
        message: 'Would you like ci with github actions ?',
        default: config
          ? config.ci
          : this.fs.exists(this.destinationPath('.circleci/config.yml')) ||
            this.fs.exists(this.destinationPath('.github/workflows')),
      },
      {
        type: 'confirm',
        name: 'testing',
        message: 'Would you like testing ?',
        when: (answers) => answers.ci,
        default: config ? config.testing : true,
      },
      {
        type: 'confirm',
        name: 'codecov',
        message: 'Would you like code coverage ?',
        when: (answers) => answers.ci && answers.testing,
        default: config ? config.codecov : true,
      },
      {
        type: 'confirm',
        name: 'documentation',
        message: 'Would you like documentation ?',
        when: (answers) => answers.ci && !this.options.isAppProject,
        default: config ? config.documentation : true,
      },
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Would you like typescript monorepo ?',
        default: config ? config.typescript : true,
      },
      {
        type: 'confirm',
        name: 'eslint',
        message: 'Would you like eslint in monorepo ?',
        default: config ? config.eslint : true,
      },
    ]);
    this.pobLernaConfig.packageNames = this.packageNames;
    this.config.set('monorepo', this.pobLernaConfig);
    this.config.delete('pob-config');
  }

  default() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    const packageNames = this.packageNames;
    const packagePaths = this.packageLocations.filter(
      this.pobLernaConfig.typescript
        ? (packagePath) => fs.existsSync(`${packagePath}/tsconfig.json`)
        : Boolean,
    );

    if (packagePaths.length === 0 && packageNames.length > 0) {
      console.log(packageNames, packagePaths);
      throw new Error('packages should not be empty');
    }

    this.composeWith('pob:common:husky', {});

    const isReleasePleaseEnabled =
      this.pobLernaConfig.testing &&
      this.pobLernaConfig.ci &&
      !pkg.devDependencies?.['@pob/lerna-light'];

    this.composeWith('pob:common:testing', {
      monorepo: true,
      enable: this.pobLernaConfig.testing,
      enableReleasePlease: isReleasePleaseEnabled,
      testing: this.pobLernaConfig.testing,
      typescript: this.pobLernaConfig.typescript,
      documentation: !!this.pobLernaConfig.documentation,
      codecov: this.pobLernaConfig.testing && this.pobLernaConfig.codecov,
      ci: this.pobLernaConfig.ci,
      packageManager: this.options.packageManager,
      isApp: this.options.isAppProject,
    });

    this.composeWith('pob:common:format-lint', {
      monorepo: true,
      documentation: this.pobLernaConfig.documentation,
      typescript: this.pobLernaConfig.typescript,
      testing: this.pobLernaConfig.testing,
      packageManager: this.options.packageManager,
      yarnNodeLinker: this.options.yarnNodeLinker,
      appTypes: JSON.stringify(getAppTypes(this.packageConfigs)),
      ignorePaths: [
        hasDist(this.packages, this.packageConfigs) && '/dist',
        hasBuild(this.packages, this.packageConfigs) && '/build',
      ]
        .filter(Boolean)
        .join('\n'),
      rootIgnorePaths: [
        isReleasePleaseEnabled && '/.release-please-manifest.json',
      ]
        .filter(Boolean)
        .join('\n'),
    });

    this.composeWith('pob:lib:doc', {
      enabled: this.pobLernaConfig.documentation,
      testing: this.pobLernaConfig.testing,
      packageNames: JSON.stringify(packageNames),
      packagePaths: JSON.stringify(packagePaths),
      packageManager: this.options.packageManager,
    });

    this.composeWith('pob:core:vscode', {
      root: true,
      monorepo: true,
      packageManager: this.options.packageManager,
      yarnNodeLinker: this.options.yarnNodeLinker,
      typescript: this.pobLernaConfig.typescript,
      testing: this.pobLernaConfig.testing,
      packageNames: JSON.stringify(packageNames),
      packageLocations: JSON.stringify(this.packageLocations),
    });

    // Always add a gitignore, because npm publish uses it.
    this.composeWith('pob:core:gitignore', {
      root: true,
      typescript: this.pobLernaConfig.typescript,
      documentation: this.pobLernaConfig.documentation,
      testing: this.pobLernaConfig.testing,
    });

    this.composeWith('pob:common:remove-old-dependencies');

    this.composeWith('pob:common:release', {
      enable: this.pobLernaConfig.testing && this.pobLernaConfig.ci,
      isReleasePleaseEnabled,
      withBabel: this.pobLernaConfig.typescript,
      documentation: this.pobLernaConfig.documentation,
      updateOnly: this.options.updateOnly,
    });

    this.composeWith('pob:monorepo:typescript', {
      enable: this.pobLernaConfig.typescript,
      isAppProject: this.options.isAppProject,
      packageNames: JSON.stringify(packageNames),
      packagePaths: JSON.stringify(packagePaths),
    });

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    if (platform !== 'win32') {
      execSync(
        `rm -Rf ${['lib-*', 'coverage', 'docs'].filter(Boolean).join(' ')}`,
      );
    }
  }

  writing() {
    if (!this.options.isAppProject) {
      const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

      const rollupConfigs = [];
      this.packageLocations.forEach((location) => {
        const rollupPath = `${location}/rollup.config.mjs`;
        const rollupConfig = this.fs.read(this.destinationPath(rollupPath), {
          defaults: null,
        });
        if (rollupConfig) {
          rollupConfigs.push(rollupPath);
        }
      });

      if (rollupConfigs.length > 0) {
        copyAndFormatTpl(
          this.fs,
          this.templatePath('monorepo.rollup.config.mjs.ejs'),
          this.destinationPath('rollup.config.mjs'),
          {
            configLocations: rollupConfigs,
          },
        );
      } else {
        this.fs.delete('rollup.config.mjs');
      }
      packageUtils.addOrRemoveScripts(pkg, rollupConfigs.length > 0, {
        'clean:build': 'yarn workspaces foreach --parallel -A run clean:build',
        build: 'yarn clean:build && rollup --config rollup.config.mjs',
        watch: 'yarn clean:build && rollup --config rollup.config.mjs --watch',
      });
      packageUtils.addOrRemoveDevDependencies(pkg, rollupConfigs.length, [
        '@babel/core',
        'pob-babel',
      ]);
      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    }
  }

  end() {
    console.log('save config');
    this.config.save();
  }
}
