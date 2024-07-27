interface Dependencies {
  "@babel/core": "7.24.5";
  "@babel/preset-env": "7.24.5";
  "@babel/preset-react": "7.24.1";
  "@babel/runtime": "7.24.5";
  "@playwright/test": "1.45.3";
  "@pob/commitlint-config": "6.4.0";
  "@pob/esbuild": "1.1.0";
  "@pob/eslint-config": "56.0.0";
  "@pob/eslint-config-typescript": "56.0.0";
  "@pob/eslint-config-typescript-react": "56.0.0";
  "@pob/pretty-pkg": "8.0.0";
  "@pob/rollup-esbuild": "3.0.0";
  "@pob/rollup-typescript": "4.0.0";
  "@swc-node/register": "1.10.0";
  "@swc/core": "1.6.6";
  "@swc/jest": "0.2.36";
  "@types/jest": "29.5.12";
  "@types/node": "20.14.12";
  "alp-rollup-plugin-config": "2.2.1";
  "check-package-dependencies": "7.2.0";
  eslint: "8.57.0";
  jest: "29.7.0";
  "jest-junit-reporter": "1.1.0";
  "pob-babel": "40.0.0";
  prettier: "3.3.3";
  "repository-check-dirty": "7.0.0";
  rollup: "4.19.0";
  semver: "7.6.3";
  "ts-node": "npm:ts-node-lite@11.0.0-beta.1";
  tslib: "2.6.2";
  typedoc: "0.26.5";
  typescript: "5.4.5";
  vitest: "2.0.4";
}

declare const dependencies: Dependencies;
export = dependencies;
