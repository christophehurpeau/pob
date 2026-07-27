interface Dependencies {
  "@playwright/test": "1.61.1";
  "@pob/esbuild": "workspace:*";
  "@pob/eslint-config": "workspace:*";
  "@pob/eslint-config-typescript-react": "workspace:*";
  "@pob/pretty-pkg": "workspace:*";
  "@pob/rollup-esbuild": "workspace:*";
  "@pob/rollup-typescript": "workspace:*";
  "@types/node": "24.13.3";
  "@typescript/native": "npm:typescript@7.0.2";
  "@vitest/coverage-v8": "4.1.10";
  "alp-rollup-plugin-config": "4.1.1";
  eslint: "10.7.0";
  pinst: "3.0.0";
  rollup: "4.60.4";
  semver: "7.8.5";
  tslib: "2.8.1";
  typedoc: "0.28.20";
  typescript: "npm:@typescript/typescript6@6.0.2";
  vite: "8.1.5";
  vitest: "4.1.10";
}

declare const dependencies: Dependencies;
export = dependencies;
