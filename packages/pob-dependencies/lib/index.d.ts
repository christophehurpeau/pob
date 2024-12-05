interface Dependencies {
  "@babel/core": "7.26.0";
  "@babel/preset-env": "7.26.0";
  "@babel/preset-react": "7.26.3";
  "@babel/runtime": "7.26.0";
  "@playwright/test": "1.49.0";
  "@pob/commitlint-config": "8.0.1";
  "@pob/esbuild": "3.0.0";
  "@pob/eslint-config": "58.1.0";
  "@pob/eslint-config-typescript": "58.1.0";
  "@pob/eslint-config-typescript-react": "58.1.0";
  "@pob/pretty-pkg": "10.0.0";
  "@pob/rollup-esbuild": "5.1.0";
  "@pob/rollup-typescript": "6.0.0";
  "@swc-node/register": "1.10.9";
  "@swc/core": "1.10.0";
  "@swc/jest": "0.2.37";
  "@types/jest": "29.5.14";
  "@types/node": "22.10.1";
  "@vitest/coverage-v8": "2.1.8";
  "alp-rollup-plugin-config": "2.2.1";
  "check-package-dependencies": "7.2.0";
  eslint: "9.14.0";
  jest: "29.7.0";
  "jest-junit-reporter": "1.1.0";
  "pob-babel": "42.0.2";
  prettier: "3.4.2";
  "repository-check-dirty": "9.0.0";
  rollup: "4.28.0";
  semver: "7.6.3";
  "ts-node": "npm:ts-node-lite@11.0.0-beta.1";
  tslib: "2.8.1";
  typedoc: "0.27.3";
  typescript: "5.7.2";
  vitest: "2.1.8";
}

declare const dependencies: Dependencies;
export = dependencies;
