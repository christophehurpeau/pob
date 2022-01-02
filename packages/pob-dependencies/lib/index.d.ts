interface Dependencies {
  '@babel/core': '7.16.7';
  '@babel/preset-env': '7.16.7';
  '@babel/preset-react': '7.16.7';
  '@babel/runtime': '7.16.7';
  '@pob/commitlint-config': '4.1.0';
  '@pob/eslint-config': '48.0.5';
  '@pob/eslint-config-typescript': '48.0.6';
  '@pob/eslint-config-typescript-react': '48.0.6';
  '@pob/lerna-light': '5.1.0';
  '@pob/pretty-pkg': '^4.0.1';
  '@pob/root': '6.3.1';
  '@types/jest': '27.4.0';
  'babel-preset-modern-browsers': '15.0.2';
  eslint: '8.6.0';
  jest: '27.4.5';
  'jest-junit-reporter': '1.1.0';
  'pob-babel': '29.6.1';
  'pob-lcov-reporter': '6.0.1';
  prettier: '2.5.1';
  'repository-check-dirty': '^4.0.0';
  rollup: '2.62.0';
  semver: '7.3.5';
  'standard-version': '9.3.2';
  typedoc: '0.22.10';
  typescript: '4.5.4';
}

declare const dependencies: Dependencies;
export = dependencies;
