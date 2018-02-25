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

    packageUtils.addDevDependencies(pkg, {
      eslint: '4.13.0',
      'eslint-config-pob': '^17.1.0',
      'eslint-config-prettier': '^2.9.0',
      'eslint-plugin-prettier': '^2.6.0',
      prettier: '^1.9.2',
    });

    packageUtils.addOrRemoveDevDependencies(
      pkg,
      packageUtils.hasJest(pkg) || useBabel,
      { 'eslint-plugin-import': '^2.8.0' },
    );

    packageUtils.addOrRemoveDevDependencies(pkg, useBabel, {
      'babel-eslint': '^7.2.3',
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
    packageUtils.addOrRemoveDevDependencies(pkg, !hasReact, { 'eslint-config-airbnb-base': '^12.1.0' });

    const flow = this.fs.exists(this.destinationPath('.flowconfig'));

    packageUtils.addOrRemoveDevDependencies(pkg, flow, {
      'eslint-plugin-flowtype': '^2.39.1',
    });

    const config = (() => {
      if (hasReact) {
        return flow ? 'pob/react-flow' : 'pob/react';
      }
      if (useBabel) {
        return flow ? 'pob/flow' : 'pob/babel';
      }
      return 'pob/node-lts';
    })();

    const eslintrcBadPath = this.destinationPath('.eslintrc');
    this.fs.delete(eslintrcBadPath);
    this.fs.delete(`${eslintrcBadPath}.yml`);
    this.fs.delete(`${eslintrcBadPath}.js`);
    const eslintrcPath = this.destinationPath('.eslintrc.json');
    if (!this.fs.exists(eslintrcPath)) {
      const eslintConfig = { extends: config };
      if (packageUtils.hasJest(pkg)) {
        const dir = useBabel ? 'src' : 'lib';
        const ext = hasReact ? '{js,jsx}' : 'js';

        const jestOverride = {
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

        if (!useBabel) {
          // see https://github.com/eslint/eslint/pull/9748 + https://github.com/eslint/eslint/issues/8813
          jestOverride.extends = 'pob/babel';
        }

        eslintConfig.overrides = [jestOverride];
      }
      this.fs.writeJSON(eslintrcPath, eslintConfig);
    }

    const srcDirectory = useBabel ? 'src' : 'lib';
    packageUtils.addScript(pkg, 'lint', `eslint ${hasReact ? '--ext .js,.jsx ' : ''}${srcDirectory}/`);


    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
