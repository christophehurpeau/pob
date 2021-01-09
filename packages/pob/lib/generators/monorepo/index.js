'use strict';

const fs = require('fs');
const PackageGraph = require('@lerna/package-graph');
const LernaProject = require('@lerna/project');
const Generator = require('yeoman-generator');

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

const hasDist = (configs) =>
  configs.some(
    (config) => config && config.project && config.project.type === 'lib',
  );

module.exports = class PobMonorepoGenerator extends Generator {
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

    this.option('useYarn2', {
      type: Boolean,
      required: false,
      defaults: false,
    });
  }

  async initializing() {
    this.lernaProject = new LernaProject(this.destinationPath());
    const packages = await this.lernaProject.getPackages();
    const graph = new PackageGraph(packages);
    const [cyclePaths] = graph.partitionCycles();

    if (cyclePaths.size) {
      const cycleMessage = ['Dependency cycles detected, you should fix these!']
        .concat([...cyclePaths].map((cycle) => cycle.join(' -> ')))
        .join('\n');

      console.warn(cycleMessage);
    }

    this.packages = [];
    this.packageLocations = [];

    while (graph.size) {
      // pick the current set of nodes _without_ localDependencies (aka it is a "source" node)
      const batch = [...graph.values()].filter(
        (node) => node.localDependencies.size === 0,
      );

      // batches are composed of Package instances, not PackageGraphNodes
      this.packages.push(...batch.map((node) => node.pkg));
      this.packageLocations.push(...batch.map((node) => node.location));

      // pruning the graph changes the node.localDependencies.size test
      graph.prune(...batch);
    }

    this.packageNames = this.packages.map((pkg) => pkg.name);
    this.packageConfigs = this.packageLocations.map((location) => {
      try {
        return JSON.parse(fs.readFileSync(`${location}/.yo-rc.json`, 'utf-8'))
          .pob;
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
    this.composeWith(require.resolve('../core/ci'), {
      enable: this.pobLernaConfig.ci,
      typescript: this.pobLernaConfig.typescript,
      testing: this.pobLernaConfig.testing,
      codecov: this.pobLernaConfig.codecov,
      documentation: this.pobLernaConfig.documentation,
      updateOnly: this.options.updateOnly,
    });

    this.composeWith(require.resolve('../common/husky'), {});

    this.composeWith(require.resolve('../common/format-lint'), {
      documentation: this.pobLernaConfig.documentation,
      typescript: this.pobLernaConfig.typescript,
      testing: this.pobLernaConfig.testing,
      useYarn2: this.options.useYarn2,
      appTypes: JSON.stringify(getAppTypes(this.packageConfigs)),
      ignorePaths:
        this.pobLernaConfig.typescript && hasDist(this.packageConfigs)
          ? '/dist'
          : '',
    });

    this.composeWith(require.resolve('../lib/doc'), {
      enabled: this.pobLernaConfig.documentation,
      testing: this.pobLernaConfig.testing,
      packageNames: JSON.stringify(this.pobLernaConfig.packageNames),
      useYarn2: this.options.useYarn2,
    });
    // Always add a gitignore, because npm publish uses it.
    this.composeWith(require.resolve('../core/gitignore'), {
      root: true,
      typescript: this.pobLernaConfig.typescript,
    });

    this.composeWith(require.resolve('../common/old-dependencies'));

    this.composeWith(require.resolve('./typescript'), {
      enable: this.pobLernaConfig.typescript,
      isAppProject: this.options.isAppProject,
      packageNames: JSON.stringify(this.pobLernaConfig.packageNames),
    });

    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    // packageUtils.addOrRemoveScripts(pkg, this.pobLernaConfig.documentation, {
    //   'generate:test-coverage':
    //     'lerna run --parallel --ignore "*-example" generate:test-coverage',
    // });

    if (this.pobLernaConfig.documentation) {
      pkg.scripts.build = `${
        pkg.scripts.build ? `${pkg.scripts.build} && ` : ''
      }yarn run generate:docs`;
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  end() {
    console.log('save config');
    this.config.save();
  }
};
