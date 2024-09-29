interface Dependencies {
  "@babel/core": "7.25.2";
  "@babel/preset-env": "7.25.4";
  "@babel/preset-react": "7.24.7";
  "@babel/runtime": "7.25.6";
  "@playwright/test": "1.47.2";
  "@pob/commitlint-config": "7.0.0";
  "@pob/esbuild": "2.0.0";
  "@pob/eslint-config": "58.1.0";
  "@pob/eslint-config-typescript": "58.1.0";
  "@pob/eslint-config-typescript-react": "58.1.0";
  "@pob/pretty-pkg": "9.0.0";
  "@pob/rollup-esbuild": "4.0.0";
  "@pob/rollup-typescript": "5.0.0";
  "@swc-node/register": "1.10.9";
  "@swc/core": "1.7.28";
  "@swc/jest": "0.2.36";
  "@types/jest": "29.5.13";
  "@types/node": "20.16.10";
  "@vitest/coverage-v8": "2.1.1";
  "alp-rollup-plugin-config": "2.2.1";
  "check-package-dependencies": "7.2.0";
  eslint: "9.11.1";
  jest: "29.7.0";
  "jest-junit-reporter": "1.1.0";
  "pob-babel": "41.0.2";
  prettier: "3.3.3";
  "repository-check-dirty": "8.0.0";
  rollup: "4.22.5";
  semver: "7.6.3";
  "ts-node": "npm:ts-node-lite@11.0.0-beta.1";
  tslib: "2.7.0";
  typedoc: "0.26.7";
  typescript: "5.6.2";
  vitest: "2.1.1";
}

declare const dependencies: Dependencies;
export = dependencies;
