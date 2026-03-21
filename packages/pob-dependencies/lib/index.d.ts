interface Dependencies {
  "@babel/core": "7.29.0";
  "@babel/preset-env": "7.29.0";
  "@babel/preset-react": "7.28.5";
  "@babel/runtime": "7.28.6";
  "@playwright/test": "1.58.2";
  "@pob/esbuild": "5.2.1";
  "@pob/eslint-config": "65.2.0";
  "@pob/eslint-config-typescript-react": "65.2.0";
  "@pob/pretty-pkg": "13.2.3";
  "@pob/rollup-esbuild": "8.1.1";
  "@pob/rollup-typescript": "8.0.2";
  "@types/jest": "30.0.0";
  "@types/node": "22.19.15";
  "@vitest/coverage-v8": "4.0.18";
  "alp-rollup-plugin-config": "4.0.2";
  "check-package-dependencies": "10.5.0";
  eslint: "10.0.3";
  jest: "30.3.0";
  "jest-junit-reporter": "1.1.0";
  pinst: "3.0.0";
  "pob-babel": "45.0.1";
  prettier: "3.8.1";
  rollup: "4.59.0";
  semver: "7.7.4";
  tslib: "2.8.1";
  typedoc: "0.28.17";
  typescript: "5.9.3";
  vitest: "4.0.18";
}

declare const dependencies: Dependencies;
export = dependencies;
