const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class extends Generator {
  initializing() {
    this.fs.copy(
      this.templatePath('eslintignore'),
      this.destinationPath('.eslintignore'),
    );
  }

  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.addDevDependencies(pkg, {
      eslint: '^4.8.0',
      'eslint-config-pob': '^17.0.0',
      'eslint-config-prettier': '^2.6.0',
      'eslint-plugin-prettier': '^2.3.1',
      prettier: '^1.7.4',
    });

    if (packageUtils.hasBabel(pkg)) {
      packageUtils.addDevDependency(pkg, 'babel-eslint', '^7.2.3');
      packageUtils.addDevDependency(pkg, 'eslint-plugin-babel', '^4.1.2');
      packageUtils.addDevDependency(pkg, 'eslint-plugin-import', '^2.7.0');
    } else {
      packageUtils.addDevDependency(pkg, 'eslint-plugin-node', '^5.1.1');
      packageUtils.removeDevDependency(pkg, 'babel-eslint');
      packageUtils.removeDevDependency(pkg, 'eslint-plugin-babel');
      packageUtils.removeDevDependency(pkg, 'eslint-plugin-import');
      this.fs.delete(this.destinationPath('.flowconfig'));
    }

    if (packageUtils.hasReact(pkg)) {
      packageUtils.addDevDependencies(pkg, {
        'eslint-config-airbnb': '^16.0.0',
        'eslint-plugin-jsx-a11y': '^6.0.2',
        'eslint-plugin-react': '^7.4.0',
      });
      packageUtils.removeDevDependency(pkg, 'eslint-config-airbnb-base');
    } else {
      packageUtils.addDevDependency(pkg, 'eslint-config-airbnb-base', '^12.0.1');
      packageUtils.removeDevDependencies(pkg, [
        'eslint-config-airbnb',
        'eslint-plugin-react',
        'eslint-plugin-jsx-a11y',
      ]);
    }

    const flow = this.fs.exists(this.destinationPath('.flowconfig'));

    if (flow) {
      packageUtils.addDevDependencies(pkg, {
        'eslint-plugin-flowtype': '^2.39.1',
      });
    } else {
      packageUtils.removeDevDependency(pkg, 'eslint-plugin-flowtype');
    }

    const config = (() => {
      if (packageUtils.hasReact(pkg)) {
        return flow ? 'pob/react-flow' : 'pob/react';
      }
      if (packageUtils.hasBabel(pkg)) {
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
      this.fs.writeJSON(eslintrcPath, { extends: config });
    }

    const srcDirectory = packageUtils.hasBabel(pkg) ? 'src' : 'lib';
    packageUtils.addScript(pkg, 'lint', `eslint --ext .js,.jsx ${srcDirectory}/`);


    packageUtils.sort(pkg);
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
