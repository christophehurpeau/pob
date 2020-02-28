'use strict';

const fs = require('fs');
const Generator = require('yeoman-generator');
const sortObject = require('@pob/sort-object');
const packageUtils = require('../../../utils/package');
const ensureJsonFileFormatted = require('../../../utils/ensureJsonFileFormatted');
const formatJson = require('../../../utils/formatJson');
const inLerna = require('../../../utils/inLerna');

module.exports = class LintGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('babel', {
      type: String,
      required: false,
      defaults: 'undefined',
      desc: 'Use babel.',
    });
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const babelEnvs = (pkg.pob && pkg.pob.babelEnvs) || [];
    const useBabel =
      this.options.babel !== 'undefined'
        ? this.options.babel === 'true'
        : babelEnvs.length !== 0;
    const hasReact = useBabel && packageUtils.hasReact(pkg);
    const useNodeOnly =
      !useBabel ||
      (babelEnvs.length !== 0 &&
        babelEnvs.every((env) => env.target === 'node'));
    const useTypescript = useBabel;

    if (useTypescript) {
      this.fs.copy(
        this.templatePath('eslintignore.txt'),
        this.destinationPath('.eslintignore')
      );
    } else if (inLerna && inLerna.root) {
      this.fs.copy(
        this.templatePath('eslintignore.monorepoEslint.txt'),
        this.destinationPath('.eslintignore')
      );
    } else if (this.fs.exists(this.destinationPath('.eslintignore'))) {
      this.fs.delete(this.destinationPath('.eslintignore'));
    }

    if (pkg.scripts) {
      delete pkg.scripts.postmerge;
      delete pkg.scripts.postcheckout;
      delete pkg.scripts.postrewrite;
      delete pkg.scripts.precommit;
      delete pkg.scripts.commitmsg;
      delete pkg.scripts.preparecommitmsg;
      delete pkg.scripts.prepublish;
      delete pkg.scripts.postpublish;
      delete pkg.scripts.prepare;
    }

    delete pkg.standard;

    pkg.prettier = {
      trailingComma: !useBabel ? 'es5' : 'all',
      singleQuote: true,
      // https://github.com/airbnb/javascript/pull/1863
      arrowParens: 'always',
    };

    packageUtils.removeDevDependencies(pkg, [
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      'babel-eslint',
      'eslint-config-airbnb',
      'eslint-config-airbnb-base',
      'eslint-config-pob',
      'eslint-config-prettier',
      'eslint-plugin-babel',
      'eslint-plugin-flowtype',
      // 'eslint-plugin-import',
      'eslint-plugin-jsx-a11y',
      'eslint-plugin-node',
      'eslint-plugin-prettier',
      'eslint-plugin-react',
      'eslint-plugin-react-hooks',
      'eslint-plugin-typescript',
      'eslint-plugin-unicorn',
      'typescript-eslint-parser',
      'standard',
    ]);

    const yoConfigPobMonorepo = inLerna && inLerna.pobMonorepoConfig;
    const globalEslint = yoConfigPobMonorepo && yoConfigPobMonorepo.eslint;
    const composite = yoConfigPobMonorepo && yoConfigPobMonorepo.typescript;

    const typescript = true;
    const hasScripts = fs.existsSync(this.destinationPath('scripts'));

    if (globalEslint) {
      packageUtils.removeDevDependencies(
        pkg,
        [
          'eslint',
          'prettier',
          '@pob/eslint-config',
          '@pob/eslint-config-node',
          '@pob/eslint-config-babel',
          '@pob/eslint-config-babel-node',
          '@pob/eslint-config-typescript',
          '@pob/eslint-config-typescript-react',
          '@pob/eslint-config-react',
          '@typescript-eslint/eslint-plugin',
          'eslint-plugin-node',
          'eslint-plugin-prettier',
          'eslint-plugin-unicorn',
          'eslint-plugin-import',
        ],
        true
      );
    } else {
      packageUtils.addDevDependencies(pkg, ['eslint', 'prettier']);
      if (
        !pkg.name.startsWith('eslint-config') &&
        !pkg.name.startsWith('@pob/eslint-config') &&
        pkg.name !== '@pob/use-eslint-plugin'
      ) {
        packageUtils.addDevDependencies(pkg, [
          '@pob/eslint-config',
          'eslint-plugin-import',
          'eslint-plugin-prettier',
          'eslint-plugin-unicorn',
        ]);

        packageUtils.addOrRemoveDevDependencies(pkg, !useBabel || hasScripts, [
          '@pob/eslint-config-node',
          'eslint-plugin-node',
        ]);

        packageUtils.addOrRemoveDevDependencies(pkg, useBabel && !typescript, [
          '@pob/eslint-config-babel',
        ]);
        packageUtils.addOrRemoveDevDependencies(pkg, useBabel && useNodeOnly, [
          '@pob/eslint-config-babel-node',
        ]);
        packageUtils.addOrRemoveDevDependencies(pkg, useBabel && typescript, [
          '@pob/eslint-config-typescript',
          '@typescript-eslint/eslint-plugin',
        ]);

        packageUtils.addOrRemoveDevDependencies(pkg, hasReact && !typescript, [
          '@pob/eslint-config-react',
        ]);
        packageUtils.addOrRemoveDevDependencies(pkg, hasReact && typescript, [
          '@pob/eslint-config-typescript-react',
        ]);
      }
    }
    const config = (() => {
      if (
        pkg.name === 'eslint-config-pob' ||
        pkg.name.startsWith('@pob/eslint-config') ||
        pkg.name === '@pob/use-eslint-plugin'
      ) {
        return [
          '../eslint-config/lib/index.js',
          '../eslint-config-node/lib/index.js',
        ];
      }

      if (useBabel) {
        return [
          !typescript && '@pob/eslint-config-babel',
          typescript && '@pob/eslint-config-typescript',
          useNodeOnly && '@pob/eslint-config-babel-node',
          hasReact &&
            `@pob/eslint-config-${typescript ? 'typescript-' : ''}react`,
        ].filter(Boolean);
      }

      return ['@pob/eslint-config', '@pob/eslint-config-node'];
    })();

    const dir = useBabel ? 'src' : 'lib';
    // eslint-disable-next-line unicorn/no-nested-ternary
    const ext = !useBabel ? 'js' : hasReact ? '{ts,tsx}' : 'ts';

    const jestOverride = !packageUtils.hasJest(pkg)
      ? null
      : {
          files: [`${dir}/**/*.test.${ext}`, `${dir}/__tests__/**/*.${ext}`],
          env: { jest: true },
          rules: {
            'import/no-extraneous-dependencies': [
              'error',
              { devDependencies: true },
            ],
          },
        };

    if (!useBabel && jestOverride) {
      // see https://github.com/eslint/eslint/pull/9748 + https://github.com/eslint/eslint/issues/8813
      // jestOverride.extends = 'pob/babel';
    }

    const eslintrcBadPath = this.destinationPath('.eslintrc');
    this.fs.delete(eslintrcBadPath);
    this.fs.delete(`${eslintrcBadPath}.yml`);
    this.fs.delete(`${eslintrcBadPath}.js`);
    const eslintrcPath = this.destinationPath('.eslintrc.json');
    if (!this.fs.exists(eslintrcPath)) {
      const eslintConfig = { root: true, extends: config };
      if (jestOverride) {
        eslintConfig.overrides = [jestOverride];
      }
      if (useBabel) {
        // webstorm uses this to detect eslint .ts compat
        eslintConfig.parser = '@typescript-eslint/parser';
        eslintConfig.plugins = ['@typescript-eslint'];
        eslintConfig.parserOptions = {
          project: './tsconfig.json',
          createDefaultProgram: true, // fix for lint-staged
        };
      }
      this.fs.writeJSON(eslintrcPath, eslintConfig);
    } else {
      ensureJsonFileFormatted(eslintrcPath);
      try {
        const eslintConfig = this.fs.readJSON(eslintrcPath);
        // if (!eslintConfig.extends || typeof eslintConfig.extends === 'string') {
        eslintConfig.root = true;
        eslintConfig.extends = config;
        // } else if (Array.isArray(eslintConfig.extends)) {
        // eslintConfig.extends[0] = config;
        // eslintConfig.extends[0] = config;
        // }

        if (useBabel) {
          // webstorm uses this to detect eslint .ts compat
          eslintConfig.parser = '@typescript-eslint/parser';
          eslintConfig.plugins = ['@typescript-eslint'];
          eslintConfig.parserOptions = {
            project: './tsconfig.json',
            createDefaultProgram: true, // fix for lint-staged
          };
        } else {
          if (
            eslintConfig.parser === 'typescript-eslint-parser' ||
            eslintConfig.parser === '@typescript-eslint/parser'
          ) {
            delete eslintConfig.parser;
          }
          if (
            eslintConfig.parserOptions &&
            eslintConfig.parserOptions.project
          ) {
            delete eslintConfig.parserOptions;
          }
          if (
            eslintConfig.plugins &&
            (eslintConfig.plugins[0] === 'typescript' ||
              eslintConfig.plugins[0] === '@typescript-eslint')
          ) {
            eslintConfig.plugins.splice(0, 1);
          }
          if (eslintConfig.plugins && eslintConfig.plugins.length === 0) {
            delete eslintConfig.plugins;
          }
        }

        const existingJestOverrideIndex = !eslintConfig.overrides
          ? -1
          : eslintConfig.overrides.findIndex(
              (override) => override.env && override.env.jest
            );
        if (!jestOverride) {
          if (existingJestOverrideIndex !== -1) {
            eslintConfig.overrides.splice(existingJestOverrideIndex, 1);
            if (eslintConfig.overrides.length === 0) {
              delete eslintConfig.overrides;
            }
          }
        } else {
          // eslint-disable-next-line no-lonely-if
          if (existingJestOverrideIndex !== -1) {
            Object.assign(
              eslintConfig.overrides[existingJestOverrideIndex],
              jestOverride
            );
          } else {
            if (!eslintConfig.overrides) eslintConfig.overrides = [];
            eslintConfig.overrides.push(jestOverride);
          }
        }

        const sortedConfig = sortObject(eslintConfig, [
          'root',
          'parser',
          'parserOptions',
          'plugins',
          'extends',
          'env',
          'globals',
          'settings',
          'rules',
          'overrides',
        ]);
        if (sortedConfig.overrides) {
          sortedConfig.overrides.forEach((override, index) => {
            sortedConfig.overrides[index] = sortObject(override, [
              'files',
              'env',
              'globals',
              'settings',
              'rules',
            ]);
          });
        }

        this.fs.write(eslintrcPath, formatJson(sortedConfig));
      } catch (err) {
        console.warn('Could not parse/edit eslintrc.json: ', err);
      }
    }

    const srcDirectory = useBabel ? 'src' : 'lib';

    const lintDirectories = [
      srcDirectory,
      'scripts',
      'migrations',
    ].filter((dir) => fs.existsSync(this.destinationPath(dir)));
    packageUtils.addScripts(pkg, {
      lint: `${useBabel && !composite ? 'tsc && ' : ''}eslint${
        !useBabel ? '' : ` --ext .js,.ts${hasReact ? ',.tsx' : ''}`
      } --quiet ${lintDirectories.join(' ')}`,
    });

    delete pkg.scripts['typescript-check'];

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
