interface Dependencies {
  "@babel/core": "7.29.7";
  "@babel/preset-env": "7.29.7";
  "@babel/preset-react": "7.29.7";
  "@babel/runtime": "7.29.7";
  "@playwright/test": "1.61.1";
  "@pob/esbuild": "workspace:*";
  "@pob/eslint-config": "65.6.0";
  "@pob/eslint-config-typescript-react": "65.6.0";
  "@pob/pretty-pkg": "workspace:*";
  "@pob/rollup-esbuild": "workspace:*";
  "@pob/rollup-typescript": "workspace:*";
  "@types/jest": "30.0.0";
  "@types/node": "24.13.3";
  "@vitest/coverage-v8": "4.1.10";
  "alp-rollup-plugin-config": "4.1.1";
  "check-package-dependencies": "11.1.1";
  eslint: "10.4.0";
  pinst: "3.0.0";
  rollup: "4.60.4";
  semver: "7.8.5";
  tslib: "2.8.1";
  typedoc: "0.28.20";
  typescript: "6.0.3";
  vite: "8.1.4";
  vitest: "4.1.10";
}

declare const dependencies: Dependencies;
export = dependencies;
