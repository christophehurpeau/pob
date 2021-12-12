interface Dependencies {
  '@babel/core': '7.16.0';
  '@babel/preset-env': '7.16.4';
  '@babel/preset-react': '7.16.0';
  '@babel/runtime': '7.16.3';
  '@pob/commitlint-config': '^4.0.0';
  '@pob/eslint-config': '48.0.5';
  '@pob/eslint-config-typescript': '48.0.5';
  '@pob/eslint-config-typescript-react': '48.0.5';
  '@pob/lerna-light': '^5.0.0';
  '@pob/pretty-pkg': '^4.0.1';
  '@pob/root': '6.1.3';
  '@types/jest': '27.0.3';
  'babel-preset-modern-browsers': '15.0.2';
  eslint: '8.4.1';
  jest: '27.4.4';
  'jest-junit-reporter': '1.1.0';
  'pob-babel': '29.4.2';
  'pob-lcov-reporter': '^6.0.0';
  prettier: '2.5.1';
  'repository-check-dirty': '^4.0.0';
  rollup: '2.61.1';
  semver: '7.3.5';
  'standard-version': '9.3.2';
  typedoc: '0.22.10';
  typescript: '4.5.3';
}

declare const dependencies: Dependencies;
export = dependencies;
