interface Dependencies {
  "@babel/core": "7.25.2";
  "@babel/preset-env": "7.25.3";
  "@babel/preset-react": "7.24.7";
  "@babel/runtime": "7.25.0";
  "@playwright/test": "1.46.0";
  "@pob/commitlint-config": "6.4.0";
  "@pob/esbuild": "1.2.0";
  "@pob/eslint-config": "57.3.0";
  "@pob/eslint-config-typescript": "57.3.0";
  "@pob/eslint-config-typescript-react": "57.3.0";
  "@pob/pretty-pkg": "8.1.0";
  "@pob/rollup-esbuild": "3.1.2";
  "@pob/rollup-typescript": "4.0.3";
  "@swc-node/register": "1.10.9";
  "@swc/core": "1.7.10";
  "@swc/jest": "0.2.36";
  "@types/jest": "29.5.12";
  "@types/node": "20.14.15";
  "@vitest/coverage-v8": "2.0.5";
  "alp-rollup-plugin-config": "2.2.1";
  "check-package-dependencies": "7.2.0";
  eslint: "8.57.0";
  jest: "29.7.0";
  "jest-junit-reporter": "1.1.0";
  "pob-babel": "40.0.3";
  prettier: "3.3.3";
  "repository-check-dirty": "7.0.0";
  rollup: "4.20.0";
  semver: "7.6.3";
  "ts-node": "npm:ts-node-lite@11.0.0-beta.1";
  tslib: "2.6.3";
  typedoc: "0.26.5";
  typescript: "5.5.4";
  vitest: "2.0.5";
}

declare const dependencies: Dependencies;
export = dependencies;
