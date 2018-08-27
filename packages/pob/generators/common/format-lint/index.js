const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

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
    const useNodeOnly = !useBabel || (babelEnvs.length === 1 && babelEnvs[0].target === 'node');

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
    ]);
    packageUtils.addDevDependencies(pkg, {
      eslint: '5.4.0',
      'eslint-config-pob': '22.0.3',
      'eslint-plugin-import': '2.14.0',
      prettier: '1.14.2',
    });

    packageUtils.addOrRemoveDevDependencies(pkg, useBabel, {
      'babel-eslint': '9.0.0-beta.3', // required...
      'typescript-eslint-parser': '18.0.0',
      'eslint-plugin-babel': '5.1.0',
      'eslint-plugin-typescript': '0.12.0',
    });

    packageUtils.addOrRemoveDevDependencies(pkg, useNodeOnly, {
      'eslint-plugin-node': '7.0.1',
    });

    packageUtils.addOrRemoveDevDependencies(pkg, hasReact, {
      'eslint-config-airbnb': '17.1.0',
      'eslint-plugin-jsx-a11y': '6.1.0',
      'eslint-plugin-react': '7.11.1',
    });

    // packageUtils.addOrRemoveDevDependencies(pkg, !hasReact, { 'eslint-config-airbnb-base': '^12.1.0' });

    const config = (() => {
      if (useBabel) {
        return [
          useNodeOnly ? 'pob/babel-node' : 'pob/babel',
          hasReact && 'pob/react',
          'pob/typescript',
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
        eslintConfig.parser = 'typescript-eslint-parser';
        eslintConfig.plugins = ['typescript'];
      }
      this.fs.writeJSON(eslintrcPath, eslintConfig);
    } else {
      const eslintConfig = this.fs.readJSON(eslintrcPath);
      // if (!eslintConfig.extends || typeof eslintConfig.extends === 'string') {
      eslintConfig.extends = config;
      // } else if (Array.isArray(eslintConfig.extends)) {
      // eslintConfig.extends[0] = config;
      // eslintConfig.extends[0] = config;
      // }

      if (useBabel) {
        // webstorm uses this to detect eslint .ts compat
        eslintConfig.parser = 'typescript-eslint-parser';
        eslintConfig.plugins = ['typescript'];
      } else {
        if (eslintConfig.parser === 'typescript-eslint-parser') delete eslintConfig.parser;
        if (eslintConfig.plugins && eslintConfig.plugins[0] === 'typescript') eslintConfig.plugins.splice(0, 1);
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

      this.fs.writeJSON(eslintrcPath, eslintConfig);
    }

    const srcDirectory = useBabel ? 'src' : 'lib';
    packageUtils.addScript(
      pkg,
      'lint',
      `${useBabel ? 'npm run typescript-check && ' : ''}eslint${!useBabel ? '' : ` --ext .ts${hasReact ? ',.tsx' : ''} `} ${srcDirectory}/`,
    );

    packageUtils.addOrRemoveScripts(pkg, useBabel, {
      'typescript-check': 'tsc --noEmit',
    });

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
