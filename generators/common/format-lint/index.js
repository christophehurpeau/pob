const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class LintGenerator extends Generator {
  initializing() {
    this.fs.copy(
      this.templatePath('eslintignore'),
      this.destinationPath('.eslintignore'),
    );
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const useBabel = packageUtils.transpileWithBabel(pkg);
    const hasReact = useBabel && packageUtils.hasReact(pkg);

    pkg.prettier = {
      trailingComma: !useBabel ? 'es5' : 'all',
      singleQuote: true,
      printWidth: 100,
    };

    packageUtils.removeDevDependencies(pkg, ['eslint-config-airbnb-base', 'eslint-config-prettier']);
    packageUtils.addDevDependencies(pkg, {
      eslint: '^4.19.1',
      'eslint-config-pob': '^18.0.0',
      'eslint-plugin-prettier': '^2.6.0',
      prettier: '^1.11.1',
    });

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      packageUtils.hasJest(pkg) || useBabel,
      { 'eslint-plugin-import': '^2.9.0' },
    );

    packageUtils.addOrRemoveDevDependencies(pkg, useBabel, {
      'babel-eslint': '^8.2.2',
      'eslint-plugin-babel': '^4.1.2',
    });

    packageUtils.addOrRemoveDevDependencies(pkg, !useBabel, {
      'eslint-plugin-node': '^6.0.0',
    });

    if (!useBabel) {
      this.fs.delete(this.destinationPath('.flowconfig'));
    }

    packageUtils.addOrRemoveDevDependencies(pkg, hasReact, {
      'eslint-config-airbnb': '^16.0.0',
      'eslint-plugin-jsx-a11y': '^6.0.2',
      'eslint-plugin-react': '^7.5.1',
    });

    // packageUtils.addOrRemoveDevDependencies(pkg, !hasReact, { 'eslint-config-airbnb-base': '^12.1.0' });

    const flow = this.fs.exists(this.destinationPath('.flowconfig'));

    packageUtils.addOrRemoveDevDependencies(pkg, flow, {
      'eslint-plugin-flowtype': '^2.46.1',
    });

    const config = (() => {
      if (useBabel) {
        return ['pob/babel', flow && 'pob/flow', hasReact && 'pob/react'].filter(Boolean);
      }
      return ['pob/node'];
    })();

    const dir = useBabel ? 'src' : 'lib';
    const ext = hasReact ? '{js,jsx}' : 'js';

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
      jestOverride.extends = 'pob/babel';
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
      this.fs.writeJSON(eslintrcPath, eslintConfig);
    } else {
      const eslintConfig = this.fs.readJSON(eslintrcPath);
      // if (!eslintConfig.extends || typeof eslintConfig.extends === 'string') {
      eslintConfig.extends = config;
      // } else if (Array.isArray(eslintConfig.extends)) {
      // eslintConfig.extends[0] = config;
      // eslintConfig.extends[0] = config;
      // }

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
    packageUtils.addScript(pkg, 'lint', `eslint ${hasReact ? '--ext .js,.jsx ' : ''}${srcDirectory}/`);


    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
