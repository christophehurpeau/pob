interface Dependencies {
  "@babel/core": "7.29.0";
  "@babel/preset-env": "7.29.5";
  "@babel/preset-react": "7.28.5";
  "@babel/runtime": "7.29.2";
  "@playwright/test": "1.60.0";
  "@pob/esbuild": "5.4.0";
  "@pob/eslint-config": "65.4.3";
  "@pob/eslint-config-typescript-react": "65.4.3";
  "@pob/pretty-pkg": "13.2.3";
  "@pob/rollup-esbuild": "8.3.0";
  "@pob/rollup-typescript": "8.0.2";
  "@types/jest": "30.0.0";
  "@types/node": "24.12.4";
  "@vitest/coverage-v8": "4.1.6";
  "alp-rollup-plugin-config": "4.0.2";
  "check-package-dependencies": "11.1.1";
  eslint: "10.4.0";
  pinst: "3.0.0";
  "pob-babel": "45.0.1";
  rollup: "4.60.4";
  semver: "7.8.0";
  tslib: "2.8.1";
  typedoc: "0.28.19";
  typescript: "6.0.3";
  vite: "8.0.13";
  vitest: "4.1.6";
}

declare const dependencies: Dependencies;
export = dependencies;
