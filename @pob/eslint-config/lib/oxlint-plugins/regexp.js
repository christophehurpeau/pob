// JS plugin of oxlint/*.json. oxlint resolves a package name from the
// directory of the config file, not from its real path: when this package is
// symlinked (pnpm or yarn isolated node_modules), its dependencies are not
// found. Node resolves the imports of this file from its real path.
export { default } from "eslint-plugin-regexp";
