'use strict';

const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');
const ensureJsonFileFormatted = require('../../../utils/ensureJsonFileFormatted');
const sortObject = require('../../../utils/sortObject');
const formatJson = require('../../../utils/formatJson');
const inLerna = require('../../../utils/inLerna');

module.exports = class LintGenerator extends Generator {
  initializing() {
    if (this.fs.exists(this.destinationPath('.eslintignore'))) {
      this.fs.delete(this.destinationPath('.eslintignore'));
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const babelEnvs = JSON.parse(this.options.babelEnvs);
    const useBabel = babelEnvs.length !== 0;
    const hasReact = useBabel && packageUtils.hasReact(pkg);
    const useNodeOnly =
      !useBabel || babelEnvs.every((env) => env.target === 'node');

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
      'eslint-plugin-import',
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

    packageUtils.addDevDependencies(pkg, ['eslint', 'prettier']);

    const typescript = true;

    if (
      !pkg.name.startsWith('eslint-config') &&
      !pkg.name.startsWith('@pob/eslint-config')
    ) {
      packageUtils.addOrRemoveDevDependencies(pkg, !useBabel, [
        '@pob/eslint-config',
        '@pob/eslint-config-node',
      ]);

      packageUtils.addOrRemoveDevDependencies(pkg, useBabel, [
        '@pob/eslint-config-babel',
      ]);
      packageUtils.addOrRemoveDevDependencies(pkg, useBabel && useNodeOnly, [
        '@pob/eslint-config-babel-node',
      ]);
      packageUtils.addOrRemoveDevDependencies(pkg, useBabel && typescript, [
        '@pob/eslint-config-typescript',
      ]);

      packageUtils.addOrRemoveDevDependencies(pkg, hasReact && !typescript, [
        '@pob/eslint-config-react',
      ]);
      packageUtils.addOrRemoveDevDependencies(pkg, hasReact && typescript, [
        '@pob/eslint-config-typescript-react',
      ]);
    }

    const config = (() => {
      if (
        pkg.name === 'eslint-config-pob' ||
        pkg.name.startsWith('@pob/eslint-config')
      ) {
        return [
          '../eslint-config/lib/index.js',
          '../eslint-config-node/lib/index.js',
        ];
      }

      if (useBabel) {
        return [
          '@pob/eslint-config-babel',
          useNodeOnly && '@pob/eslint-config-babel-node',
          typescript && '@pob/eslint-config-typescript',
          hasReact &&
            `@pob/eslint-config-${typescript ? 'typescript-' : ''}react`,
        ].filter(Boolean);
      }

      return ['@pob/eslint-config', '@pob/eslint-config-node'];
    })();

    const dir = useBabel ? 'src' : 'lib';
    // eslint-disable-next-line no-nested-ternary
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
        } else {
          if (
            eslintConfig.parser === 'typescript-eslint-parser' ||
            eslintConfig.parser === '@typescript-eslint/parser'
          ) {
            delete eslintConfig.parser;
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

    const yoConfig = inLerna && inLerna.rootYoConfig;
    const composite =
      yoConfig &&
      yoConfig.pob &&
      yoConfig.pob.monorepo &&
      yoConfig.pob.monorepo.typescript;

    const srcDirectory = useBabel ? 'src' : 'lib';
    packageUtils.addScripts(pkg, {
      lint: `${useBabel && !composite ? 'tsc && ' : ''}eslint${
        !useBabel ? '' : ` --ext .ts${hasReact ? ',.tsx' : ''}`
      } --quiet ${srcDirectory}/`,
    });

    delete pkg.scripts['typescript-check'];

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
