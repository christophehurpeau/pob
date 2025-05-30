interface Dependencies {
  "@babel/core": "7.26.10";
  "@babel/preset-env": "7.26.9";
  "@babel/preset-react": "7.26.3";
  "@babel/runtime": "7.27.0";
  "@playwright/test": "1.52.0";
  "@pob/commitlint-config": "9.1.3";
  "@pob/esbuild": "4.0.3";
  "@pob/eslint-config": "60.0.0";
  "@pob/eslint-config-typescript": "60.0.0";
  "@pob/eslint-config-typescript-react": "60.0.0";
  "@pob/pretty-pkg": "12.1.0";
  "@pob/rollup-esbuild": "6.4.2";
  "@pob/rollup-typescript": "7.0.1";
  "@swc-node/register": "1.10.10";
  "@swc/core": "1.11.22";
  "@swc/jest": "0.2.38";
  "@types/jest": "29.5.14";
  "@types/node": "22.15.2";
  "@vitest/coverage-v8": "3.1.2";
  "alp-rollup-plugin-config": "2.2.1";
  "check-package-dependencies": "10.2.0";
  eslint: "9.25.1";
  jest: "29.7.0";
  "jest-junit-reporter": "1.1.0";
  pinst: "3.0.0";
  "pob-babel": "43.4.1";
  prettier: "3.5.3";
  "repository-check-dirty": "10.0.1";
  rollup: "4.40.0";
  semver: "7.7.1";
  "ts-node": "npm:ts-node-lite@11.0.0-beta.1";
  tslib: "2.8.1";
  typedoc: "0.28.3";
  typescript: "5.8.3";
  vitest: "3.1.2";
}

declare const dependencies: Dependencies;
export = dependencies;
