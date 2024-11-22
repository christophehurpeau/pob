interface Dependencies {
  "@babel/core": "7.26.0";
  "@babel/preset-env": "7.26.0";
  "@babel/preset-react": "7.25.9";
  "@babel/runtime": "7.26.0";
  "@playwright/test": "1.48.2";
  "@pob/commitlint-config": "8.0.0";
  "@pob/esbuild": "3.0.0";
  "@pob/eslint-config": "58.1.0";
  "@pob/eslint-config-typescript": "58.1.0";
  "@pob/eslint-config-typescript-react": "58.1.0";
  "@pob/pretty-pkg": "10.0.0";
  "@pob/rollup-esbuild": "5.0.0";
  "@pob/rollup-typescript": "6.0.0";
  "@swc-node/register": "1.10.9";
  "@swc/core": "1.9.2";
  "@swc/jest": "0.2.37";
  "@types/jest": "29.5.14";
  "@types/node": "22.9.0";
  "@vitest/coverage-v8": "2.1.5";
  "alp-rollup-plugin-config": "2.2.1";
  "check-package-dependencies": "7.2.0";
  eslint: "9.14.0";
  jest: "29.7.0";
  "jest-junit-reporter": "1.1.0";
  "pob-babel": "42.0.0";
  prettier: "3.3.3";
  "repository-check-dirty": "9.0.0";
  rollup: "4.24.0";
  semver: "7.6.3";
  "ts-node": "npm:ts-node-lite@11.0.0-beta.1";
  tslib: "2.8.1";
  typedoc: "0.26.10";
  typescript: "5.6.3";
  vitest: "2.1.5";
}

declare const dependencies: Dependencies;
export = dependencies;
