interface Dependencies {
  "@babel/core": "7.29.0";
  "@babel/preset-env": "7.29.5";
  "@babel/preset-react": "7.28.5";
  "@babel/runtime": "7.29.2";
  "@playwright/test": "1.60.0";
  "@pob/esbuild": "workspace:*";
  "@pob/eslint-config": "65.4.3";
  "@pob/eslint-config-typescript-react": "65.4.3";
  "@pob/pretty-pkg": "workspace:*";
  "@pob/rollup-esbuild": "workspace:*";
  "@pob/rollup-typescript": "workspace:*";
  "@types/jest": "30.0.0";
  "@types/node": "24.12.4";
  "@vitest/coverage-v8": "4.1.7";
  "alp-rollup-plugin-config": "4.0.2";
  "check-package-dependencies": "11.1.1";
  eslint: "10.4.0";
  pinst: "3.0.0";
  "pob-babel": "workspace:*";
  rollup: "4.60.4";
  semver: "7.8.0";
  tslib: "2.8.1";
  typedoc: "0.28.19";
  typescript: "6.0.3";
  vite: "8.0.14";
  vitest: "4.1.7";
}

declare const dependencies: Dependencies;
export = dependencies;
