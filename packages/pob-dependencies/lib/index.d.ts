interface Dependencies {
  '@babel/core': '7.23.9';
  '@babel/preset-env': '7.23.9';
  '@babel/preset-react': '7.23.3';
  '@babel/runtime': '7.23.9';
  '@playwright/test': '1.41.2';
  '@pob/commitlint-config': '6.3.1';
  '@pob/eslint-config': '54.0.0';
  '@pob/eslint-config-typescript': '54.0.0';
  '@pob/eslint-config-typescript-react': '54.0.0';
  '@pob/pretty-pkg': '7.0.0';
  '@pob/rollup-typescript': '2.2.1';
  '@types/jest': '29.5.12';
  '@types/node': '20.11.19';
  'alp-rollup-plugin-config': '2.2.1';
  'check-package-dependencies': '7.0.0';
  eslint: '8.56.0';
  jest: '29.7.0';
  'jest-junit-reporter': '1.1.0';
  'pob-babel': '38.0.2';
  prettier: '2.8.8';
  'repository-check-dirty': '6.3.1';
  rollup: '3.29.4';
  semver: '7.6.0';
  'ts-node': '11.0.0-beta.1';
  typedoc: '0.25.8';
  typescript: '5.3.3';
}

declare const dependencies: Dependencies;
export = dependencies;
