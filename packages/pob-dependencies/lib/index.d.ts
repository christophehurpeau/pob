interface Dependencies {
  "@playwright/test": "1.64.1";
  "@pob/esbuild": "workspace:*";
  "@pob/eslint-config": "workspace:*";
  "@pob/eslint-config-typescript-react": "workspace:*";
  "@pob/pretty-pkg": "workspace:*";
  "@pob/rollup-esbuild": "workspace:*";
  "@pob/rollup-typescript": "workspace:*";
  "@types/node": "24.19.1";
  "@typescript/native": "npm:typescript@7.0.2";
  "@vitest/coverage-v8": "5.0.5";
  "alp-rollup-plugin-config": "4.1.1";
  eslint: "10.14.0";
  pinst: "3.0.0";
  playwright: "1.64.1";
  rollup: "4.67.3";
  semver: "7.8.5";
  tslib: "2.9.1";
  tsrs: "0.18.0-ts7.1.0-dev.20260929";
  typedoc: "0.28.20";
  typescript: "npm:@typescript/typescript6@6.0.2";
  vite: "8.3.5";
  vitest: "5.0.5";
}

declare const dependencies: Dependencies;
export = dependencies;
