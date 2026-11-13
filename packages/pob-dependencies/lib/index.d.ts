interface Dependencies {
  "@playwright/test": "1.65.0";
  "@pob/esbuild": "workspace:*";
  "@pob/eslint-config": "workspace:*";
  "@pob/eslint-config-typescript-react": "workspace:*";
  "@pob/pretty-pkg": "workspace:*";
  "@pob/rollup-esbuild": "workspace:*";
  "@pob/rollup-typescript": "workspace:*";
  "@types/node": "24.19.1";
  "@typescript/native": "npm:typescript@7.0.2";
  "@vitest/coverage-v8": "5.1.0";
  "alp-rollup-plugin-config": "4.1.1";
  eslint: "10.14.0";
  pinst: "3.0.0";
  playwright: "1.65.0";
  rollup: "4.68.2";
  semver: "7.8.6";
  tslib: "2.9.1";
  tsrs: "0.24.0-ts7.1.0-beta";
  typedoc: "0.28.20";
  typescript: "npm:@typescript/typescript6@6.0.2";
  vite: "8.3.8";
  vitest: "5.1.0";
}

declare const dependencies: Dependencies;
export = dependencies;
