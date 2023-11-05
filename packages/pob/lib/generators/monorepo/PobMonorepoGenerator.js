import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { platform } from 'node:process';
import { getPluginConfiguration } from '@yarnpkg/cli';
import { Configuration, Project } from '@yarnpkg/core';
import { ppath } from '@yarnpkg/fslib';
import {
  buildTopologicalOrderBatches,
  buildDependenciesMaps,
  getWorkspaceName,
} from 'yarn-workspace-utils';
import Generator from 'yeoman-generator';
import * as packageUtils from '../../utils/package.js';
import { copyAndFormatTpl } from '../../utils/writeAndFormat.js';

export const createYarnProject = async () => {
  const portablePath = ppath.cwd();

  const configuration = await Configuration.find(
    portablePath,
    // eslint-disable-next-line unicorn/no-array-method-this-argument -- not an array
    getPluginConfiguration(),
  );
  // eslint-disable-next-line unicorn/no-array-method-this-argument -- not an array
  const { project } = await Project.find(configuration, portablePath);
  return project;
};

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
        packages[index].pob &&
        packages[index].pob.babelEnvs &&
        packages[index].pob.babelEnvs.length > 0
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
      default: false,
      desc: 'Avoid asking questions',
    });

    this.option('isAppProject', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'app project, no pusblishing on npm',
    });

    this.option('packageManager', {
      type: String,
      default: 'yarn',
      desc: 'yarn or npm',
    });

    this.option('yarnNodeLinker', {
      type: String,
      required: false,
      default: 'pnp',
      desc: 'Defines what linker should be used for installing Node packages (useful to enable the node-modules plugin), one of: pnp, node-modules.',
    });

    this.option('onlyLatestLTS', {
      type: Boolean,
      required: true,
      desc: 'only latest lts',
    });

    this.option('disableYarnGitCache', {
      type: Boolean,
      required: false,
      default: false,
      desc: 'Disable git cache. See https://yarnpkg.com/features/caching#offline-mirror.',
    });
  }

  async initializing() {
    const yarnProject = await createYarnProject(this.destinationPath());
    const batches = buildTopologicalOrderBatches(
      yarnProject,
      buildDependenciesMaps(yarnProject),
    );

    this.packages = [];
    this.packageLocations = [];

    for (const batch of batches) {
      // sort by name to ensure consistent ordering
      batch.sort((a, b) =>
        getWorkspaceName(a).localeCompare(getWorkspaceName(b), 'en'),
      );

      batch.forEach((workspace) => {
        if (workspace === yarnProject.topLevelWorkspace) {
          return;
        }
        this.packages.push(workspace.manifest.raw);
        this.packageLocations.push(workspace.relativeCwd.toString());
      });
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

    const isYarnVersionEnabled = this.pobLernaConfig.ci;

    const splitCIJobs = this.packageNames.length > 8;

    this.composeWith('pob:common:testing', {
      monorepo: true,
      enable: this.pobLernaConfig.testing,
      disableYarnGitCache: this.options.disableYarnGitCache,
      enableReleasePlease: false,
      enableYarnVersion: isYarnVersionEnabled,
      testing: this.pobLernaConfig.testing,
      build: this.pobLernaConfig.typescript,
      typescript: this.pobLernaConfig.typescript,
      documentation: !!this.pobLernaConfig.documentation,
      codecov: this.pobLernaConfig.testing && this.pobLernaConfig.codecov,
      ci: this.pobLernaConfig.ci,
      packageManager: this.options.packageManager,
      isApp: this.options.isAppProject,
      onlyLatestLTS: this.options.onlyLatestLTS,
      splitCIJobs,
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
      rootIgnorePaths: [],
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
      enable: true,
      enablePublish: !this.options.isAppProject,
      withBabel: this.pobLernaConfig.typescript,
      isMonorepo: true,
      enableYarnVersion: isYarnVersionEnabled,
      ci: this.pobLernaConfig.ci,
      disableYarnGitCache: this.options.disableYarnGitCache,
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

    this.composeWith('pob:core:sort-package');
  }

  end() {
    console.log('save config');
    this.config.save();
  }
}
