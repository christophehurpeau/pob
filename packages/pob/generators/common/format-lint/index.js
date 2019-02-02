const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');
const inLerna = require('../../../utils/inLerna');
const ensureJsonFileFormatted = require('../../../utils/ensureJsonFileFormatted');
const sortObject = require('../../../utils/sortObject');
const formatJson = require('../../../utils/formatJson');

module.exports = class LintGenerator extends Generator {
  initializing() {
    if (this.fs.exists(this.destinationPath('.eslintignore'))) {
      this.fs.delete(this.destinationPath('.eslintignore'));
    }
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const useBabel = packageUtils.transpileWithBabel(pkg);
    const hasReact = useBabel && packageUtils.hasReact(pkg);
    const babelEnvs = JSON.parse(this.options.babelEnvs);
    const useNodeOnly = !useBabel || (babelEnvs.every(env => env.target === 'node'));


    if (inLerna) {
      // see git-hooks
      packageUtils.removeDevDependencies(pkg, [
        'komet',
        'komet-karma',
        'husky',
        'yarnhook',
        'lint-staged',
        '@commitlint/cli',
        '@commitlint/config-conventional',
      ]);

      if (this.fs.exists('.git-hooks')) this.fs.delete('.git-hooks');
      if (this.fs.exists('git-hooks')) this.fs.delete('git-hooks');
      if (this.fs.exists('.commitrc.js')) this.fs.delete('.commitrc.js');
      delete pkg.commitlint;
      delete pkg.husky;
      delete pkg['lint-staged'];
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


    pkg.prettier = {
      trailingComma: !useBabel ? 'es5' : 'all',
      singleQuote: true,
      // https://github.com/airbnb/javascript/pull/1863
      arrowParens: 'always',
    };

    packageUtils.removeDevDependencies(pkg, [
      'eslint-config-airbnb-base',
      'eslint-config-prettier',
      'eslint-plugin-flowtype',
      'eslint-plugin-unicorn',
      'eslint-plugin-prettier',
      'eslint-plugin-typescript',
      'typescript-eslint-parser',
    ]);
    packageUtils.addDevDependencies(pkg, [
      'eslint',
      'eslint-config-pob',
      'eslint-plugin-import',
      'prettier',
    ]);

    packageUtils.addOrRemoveDevDependencies(pkg, useBabel, [
      'babel-eslint', // required...
      'eslint-plugin-babel',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
    ]);

    if (!pkg.name.startsWith('eslint-config')) {
      packageUtils.addOrRemoveDevDependencies(pkg, useNodeOnly, [
        'eslint-plugin-node',
      ]);

      packageUtils.addOrRemoveDevDependencies(pkg, hasReact, [
        'eslint-config-airbnb',
        'eslint-plugin-jsx-a11y',
        'eslint-plugin-react',
      ]);
    }

    const typescript = true;

    const config = (() => {
      if (useBabel) {
        return [
          useNodeOnly ? 'pob/babel-node' : 'pob/babel',
          typescript && 'pob/typescript',
          hasReact && `pob/${typescript ? 'typescript-' : ''}react`,
        ].filter(Boolean);
      }
      return ['pob', 'pob/node'];
    })();

    const dir = useBabel ? 'src' : 'lib';
    const ext = !useBabel ? 'js' : (hasReact ? '{ts,tsx}' : 'ts');

    const jestOverride = !packageUtils.hasJest(pkg) ? null : {
      files: [
        `${dir}/**/*.test.${ext}`,
        `${dir}/__tests__/**/*.${ext}`,
      ],
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
      const eslintConfig = { extends: config };
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
      const eslintConfig = this.fs.readJSON(eslintrcPath);
      // if (!eslintConfig.extends || typeof eslintConfig.extends === 'string') {
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
        if (eslintConfig.parser === 'typescript-eslint-parser' || eslintConfig.parser === '@typescript-eslint/parser') delete eslintConfig.parser;
        if (eslintConfig.plugins && (eslintConfig.plugins[0] === 'typescript' || eslintConfig.plugins[0] === '@typescript-eslint')) eslintConfig.plugins.splice(0, 1);
        if (eslintConfig.plugins && eslintConfig.plugins.length === 0) delete eslintConfig.plugins;
      }

      const existingJestOverrideIndex = !eslintConfig.overrides ? -1 : eslintConfig.overrides.findIndex(override => override.env && override.env.jest);
      if (!jestOverride) {
        if (existingJestOverrideIndex !== -1) {
          eslintConfig.overrides.splice(existingJestOverrideIndex, 1);
          if (eslintConfig.overrides.length === 0) delete eslintConfig.overrides;
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (existingJestOverrideIndex !== -1) {
          Object.assign(eslintConfig.overrides[existingJestOverrideIndex], jestOverride);
        } else {
          if (!eslintConfig.overrides) eslintConfig.overrides = [];
          eslintConfig.overrides.push(jestOverride);
        }
      }

      const sortedConfig = sortObject(eslintConfig, ['root', 'parser', 'parserOptions', 'plugins', 'extends', 'env', 'globals', 'settings', 'rules', 'overrides']);
      if (sortedConfig.overrides) {
        sortedConfig.overrides.forEach((override, index) => {
          sortedConfig.overrides[index] = sortObject(override, ['files', 'env', 'globals', 'settings', 'rules']);
        });
      }

      this.fs.write(eslintrcPath, formatJson(sortedConfig));
    }

    const srcDirectory = useBabel ? 'src' : 'lib';
    packageUtils.addScript(
      pkg,
      'lint',
      `${useBabel ? 'npm run typescript-check && ' : ''}eslint${!useBabel ? '' : ` --ext .ts${hasReact ? ',.tsx' : ''}`} ${srcDirectory}/`,
    );

    packageUtils.addOrRemoveScripts(pkg, useBabel, {
      'typescript-check': 'tsc --noEmit',
    });

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
