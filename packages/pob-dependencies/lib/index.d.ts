interface Dependencies {
  "@babel/core": "7.28.4";
  "@babel/preset-env": "7.28.3";
  "@babel/preset-react": "7.27.1";
  "@babel/runtime": "7.28.4";
  "@playwright/test": "1.56.0";
  "@pob/esbuild": "5.0.1";
  "@pob/eslint-config": "62.0.0";
  "@pob/eslint-config-typescript": "62.0.0";
  "@pob/eslint-config-typescript-react": "62.0.0";
  "@pob/pretty-pkg": "13.1.0";
  "@pob/rollup-esbuild": "7.1.0";
  "@pob/rollup-typescript": "8.0.0";
  "@swc-node/register": "1.11.1";
  "@swc/core": "1.13.5";
  "@swc/jest": "0.2.39";
  "@types/jest": "30.0.0";
  "@types/node": "22.18.10";
  "@vitest/coverage-v8": "3.2.4";
  "alp-rollup-plugin-config": "3.0.0";
  "check-package-dependencies": "10.4.1";
  eslint: "9.37.0";
  jest: "30.1.3";
  "jest-junit-reporter": "1.1.0";
  pinst: "3.0.0";
  "pob-babel": "44.2.0";
  prettier: "3.6.2";
  "repository-check-dirty": "11.0.0";
  rollup: "4.52.4";
  semver: "7.7.2";
  tslib: "2.8.1";
  typedoc: "0.28.13";
  typescript: "5.9.2";
  vitest: "3.2.4";
}

declare const dependencies: Dependencies;
export = dependencies;
