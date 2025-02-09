interface Dependencies {
  "@babel/core": "7.26.8";
  "@babel/preset-env": "7.26.8";
  "@babel/preset-react": "7.26.3";
  "@babel/runtime": "7.26.7";
  "@playwright/test": "1.50.1";
  "@pob/commitlint-config": "9.1.0";
  "@pob/esbuild": "4.0.0";
  "@pob/eslint-config": "59.6.0";
  "@pob/eslint-config-typescript": "59.6.0";
  "@pob/eslint-config-typescript-react": "59.6.0";
  "@pob/pretty-pkg": "12.0.0";
  "@pob/rollup-esbuild": "6.2.0";
  "@pob/rollup-typescript": "7.0.0";
  "@swc-node/register": "1.10.9";
  "@swc/core": "1.10.15";
  "@swc/jest": "0.2.37";
  "@types/jest": "29.5.14";
  "@types/node": "22.13.1";
  "@vitest/coverage-v8": "3.0.5";
  "alp-rollup-plugin-config": "2.2.1";
  "check-package-dependencies": "9.1.0";
  eslint: "9.20.0";
  jest: "29.7.0";
  "jest-junit-reporter": "1.1.0";
  "pob-babel": "43.1.0";
  prettier: "3.5.0";
  "repository-check-dirty": "10.0.0";
  rollup: "4.33.0";
  semver: "7.7.1";
  "ts-node": "npm:ts-node-lite@11.0.0-beta.1";
  tslib: "2.8.1";
  typedoc: "0.27.6";
  typescript: "5.7.3";
  vitest: "3.0.5";
}

declare const dependencies: Dependencies;
export = dependencies;
