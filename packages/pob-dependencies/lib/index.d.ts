interface Dependencies {
  '@babel/core': '7.22.5';
  '@babel/preset-env': '7.22.5';
  '@babel/preset-react': '7.22.5';
  '@babel/runtime': '7.22.5';
  '@pob/commitlint-config': '6.0.0';
  '@pob/eslint-config': '51.0.0';
  '@pob/eslint-config-typescript': '51.0.0';
  '@pob/eslint-config-typescript-react': '51.0.0';
  '@pob/lerna-light': '7.0.0';
  '@pob/pretty-pkg': '6.0.0';
  '@types/jest': '29.5.2';
  'alp-rollup-plugin-config': '2.0.0';
  'check-package-dependencies': '6.4.1';
  eslint: '8.43.0';
  jest: '29.5.0';
  'jest-junit-reporter': '1.1.0';
  'pob-babel': '36.0.0';
  prettier: '2.8.8';
  'repository-check-dirty': '6.0.0';
  rollup: '3.26.0';
  semver: '7.5.3';
  typedoc: '0.24.8';
  typescript: '5.1.6';
}

declare const dependencies: Dependencies;
export = dependencies;
