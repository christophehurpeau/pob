interface Dependencies {
  '@babel/core': '7.21.4';
  '@babel/preset-env': '7.21.4';
  '@babel/preset-react': '7.18.6';
  '@babel/runtime': '7.21.0';
  '@pob/commitlint-config': '5.1.1';
  '@pob/eslint-config': '50.0.4';
  '@pob/eslint-config-typescript': '50.0.4';
  '@pob/eslint-config-typescript-react': '50.0.4';
  '@pob/lerna-light': '6.2.0';
  '@pob/pretty-pkg': '5.1.2';
  '@types/jest': '29.5.0';
  'alp-rollup-plugin-config': '2.0.0';
  eslint: '8.37.0';
  jest: '29.5.0';
  'jest-junit-reporter': '1.1.0';
  'pob-babel': '35.6.2';
  prettier: '2.8.7';
  'repository-check-dirty': '5.1.1';
  rollup: '3.20.2';
  semver: '7.3.8';
  typedoc: '0.23.28';
  typescript: '5.0.3';
}

declare const dependencies: Dependencies;
export = dependencies;
