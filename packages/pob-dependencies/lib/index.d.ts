interface Dependencies {
  "@playwright/test": "1.64.0";
  "@pob/esbuild": "workspace:*";
  "@pob/eslint-config": "workspace:*";
  "@pob/eslint-config-typescript-react": "workspace:*";
  "@pob/pretty-pkg": "workspace:*";
  "@pob/rollup-esbuild": "workspace:*";
  "@pob/rollup-typescript": "workspace:*";
  "@types/node": "24.19.1";
  "@typescript/native": "npm:typescript@7.0.2";
  "@vitest/coverage-v8": "5.0.3";
  "alp-rollup-plugin-config": "4.1.1";
  eslint: "10.12.0";
  pinst: "3.0.0";
  playwright: "1.64.0";
  rollup: "4.60.4";
  semver: "7.8.5";
  tslib: "2.8.1";
  tsrs: "0.18.0-ts7.1.0-dev.20260929";
  typedoc: "0.28.20";
  typescript: "npm:@typescript/typescript6@6.0.2";
  vite: "8.3.4";
  vitest: "5.0.3";
}

declare const dependencies: Dependencies;
export = dependencies;
