import Generator from 'yeoman-generator';
import * as packageUtils from '../../../utils/package.js';

export default class CommonRemoveOldDependenciesGenerator extends Generator {
  writing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    // old pob dependencies
    packageUtils.removeDependencies(pkg, ['flow-runtime']);
    packageUtils.removeDevDependencies(pkg, [
      'tcomb',
      'tcomb-forked',
      'flow-runtime',
      'flow-bin',
      'springbokjs-library',
      'babel-preset-es2015',
      'babel-preset-es2015-webpack',
      'babel-preset-es2015-node5',
      'babel-preset-es2015-node6',
      'babel-preset-pob',
      'babel-preset-latest',
      'babel-preset-stage-0',
      'babel-preset-stage-1',
      'babel-preset-modern-browsers-stage-1',
      'babel-preset-flow',
      'babel-preset-flow-tcomb',
      'babel-preset-flow-tcomb-forked',
      'babel-plugin-typecheck',
      'babel-plugin-defines',
      'babel-plugin-import-rename',
      'babel-plugin-discard-module-references',
      'babel-plugin-remove-dead-code',
      'babel-plugin-react-require',
      'babel-preset-react',
      'babel-preset-pob-react',
      'komet',
      'komet-karma',
      '@commitlint/cli',
      '@commitlint/config-conventional',
      'lint-staged',
      'yarnhook',
      'yarn-deduplicate', // in @pob/root (for yarn 1)
      'yarn-berry-deduplicate', // use yarn dedupe with yarn 2
      'yarn-update-lock',
      '@pob/version',
      'pob-release',
      'eslint-plugin-typescript',
    ]);

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
}
