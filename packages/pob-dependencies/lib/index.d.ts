interface Dependencies {
  '@babel/core': '7.22.10';
  '@babel/preset-env': '7.22.10';
  '@babel/preset-react': '7.22.5';
  '@babel/runtime': '7.22.10';
  '@pob/commitlint-config': '6.0.1';
  '@pob/eslint-config': '51.0.0';
  '@pob/eslint-config-typescript': '51.0.0';
  '@pob/eslint-config-typescript-react': '51.0.0';
  '@pob/lerna-light': '7.0.1';
  '@pob/pretty-pkg': '6.1.0';
  '@types/jest': '29.5.3';
  'alp-rollup-plugin-config': '2.1.0';
  'check-package-dependencies': '6.7.0';
  eslint: '8.47.0';
  jest: '29.6.2';
  'jest-junit-reporter': '1.1.0';
  'pob-babel': '36.2.0';
  prettier: '2.8.8';
  'repository-check-dirty': '6.1.0';
  rollup: '3.28.0';
  semver: '7.5.4';
  typedoc: '0.24.8';
  typescript: '5.1.6';
}

declare const dependencies: Dependencies;
export = dependencies;
