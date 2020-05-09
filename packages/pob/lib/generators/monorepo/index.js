'use strict';

const Generator = require('yeoman-generator');
const LernaProject = require('@lerna/project');
const PackageGraph = require('@lerna/package-graph');

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
  }

  async initializing() {
    this.lernaProject = new LernaProject(this.destinationPath());
    this.packages = await this.lernaProject.getPackages();
    const graph = new PackageGraph(this.packages);
    const [cyclePaths] = graph.partitionCycles();

    if (cyclePaths.size) {
      const cycleMessage = ['Dependency cycles detected, you should fix these!']
        .concat([...cyclePaths].map((cycle) => cycle.join(' -> ')))
        .join('\n');

      console.warn(cycleMessage);
    }

    const packages = [];

    while (graph.size) {
      // pick the current set of nodes _without_ localDependencies (aka it is a "source" node)
      const batch = [...graph.values()].filter(
        (node) => node.localDependencies.size === 0
      );

      // batches are composed of Package instances, not PackageGraphNodes
      packages.push(...batch.map((node) => node.pkg));

      // pruning the graph changes the node.localDependencies.size test
      graph.prune(...batch);
    }

    this.packageNames = packages.map((pkg) => pkg.name);
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
        message: 'Would you like ci ?',
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
        default: config ? config.eslint : false,
      },
    ]);
    this.pobLernaConfig.packageNames = this.packageNames;
    this.config.set('monorepo', this.pobLernaConfig);
    this.config.delete('pob-config');
  }

  default() {
    this.composeWith(require.resolve('../core/ci'), {
      enable: this.pobLernaConfig.ci,
      testing: this.pobLernaConfig.testing,
      codecov: this.pobLernaConfig.codecov,
      documentation: this.pobLernaConfig.documentation,
      updateOnly: this.options.updateOnly,
    });

    this.composeWith(require.resolve('../common/husky'), {});

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
  }

  end() {
    console.log('save config');
    this.config.save();
  }
};
