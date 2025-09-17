interface Dependencies {
  "@babel/core": "7.28.3";
  "@babel/preset-env": "7.28.3";
  "@babel/preset-react": "7.27.1";
  "@babel/runtime": "7.28.3";
  "@playwright/test": "1.55.0";
  "@pob/esbuild": "5.0.0";
  "@pob/eslint-config": "61.1.0";
  "@pob/eslint-config-typescript": "61.1.0";
  "@pob/eslint-config-typescript-react": "61.1.0";
  "@pob/pretty-pkg": "13.0.0";
  "@pob/rollup-esbuild": "7.0.0";
  "@pob/rollup-typescript": "8.0.0";
  "@swc-node/register": "1.11.1";
  "@swc/core": "1.13.5";
  "@swc/jest": "0.2.39";
  "@types/jest": "30.0.0";
  "@types/node": "22.17.2";
  "@vitest/coverage-v8": "3.2.4";
  "alp-rollup-plugin-config": "2.2.1";
  "check-package-dependencies": "10.3.0";
  eslint: "9.34.0";
  jest: "30.0.5";
  "jest-junit-reporter": "1.1.0";
  pinst: "3.0.0";
  "pob-babel": "44.0.0";
  prettier: "3.6.2";
  "repository-check-dirty": "11.0.0";
  rollup: "4.44.1";
  semver: "7.7.2";
  tslib: "2.8.1";
  typedoc: "0.28.10";
  typescript: "5.9.2";
  vitest: "3.2.4";
}

declare const dependencies: Dependencies;
export = dependencies;
