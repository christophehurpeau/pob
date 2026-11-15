/**
 * Deliberate differences between the pipeline engine and the fixed point of
 * the yeoman engine, by fixture. Any other difference fails the harness.
 */
export const knownDifferences: Readonly<Record<string, readonly string[]>> = {
  // the yeoman engine failed: its lib README template references `ci`, which was never passed. Fixed: every lib with documentation gets its files.
  "lib-documentation": [
    "exit code: expected 1, got 0",
    ".claude/.gitignore: expected unchanged, got created",
    ".claude/settings.json: expected unchanged, got created",
    ".editorconfig: expected unchanged, got created",
    ".github/workflows/gh-pages.yml: expected unchanged, got created",
    ".github/workflows/push.yml: expected unchanged, got created",
    ".github/workflows/release.yml: expected unchanged, got created",
    ".gitignore: expected unchanged, got created",
    ".npmignore: expected unchanged, got created",
    ".oxfmtrc.jsonc: expected unchanged, got created",
    ".oxlintrc.json: expected unchanged, got created",
    ".vscode/extensions.json: expected unchanged, got created",
    ".vscode/settings.json: expected unchanged, got created",
    ".vscode/tasks.json: expected unchanged, got created",
    ".vscode/tsrs-tsdk/tsgo: expected unchanged, got created",
    "eslint.config.js: expected unchanged, got created",
    "lint-staged.config.js: expected unchanged, got created",
    "package.json: expected unchanged, got modified",
    "pnpm-workspace.yaml: expected unchanged, got created",
    "README.md: expected unchanged, got created",
    "renovate.json: expected unchanged, got created",
    "rollup.config.mjs: expected unchanged, got created",
    "tsconfig.doc.json: expected unchanged, got created",
    "tsconfig.json: expected unchanged, got created",
    "tsconfig.tools.json: expected unchanged, got created",
  ],
  // yarn2: true is migrated to yarnNodeLinker: node-modules. The yeoman engine skipped the migration when the project config was otherwise complete, and dropped nodeLinker (pnp).
  "legacy-pob-json": [
    '.yarnrc.yml: content differs, line 3: expected "npmMinimalAgeGate: 3600", got "nodeLinker: node-modules"',
  ],
  // a root named "*-lerna" is renamed with the "-monorepo" suffix replaced once. The yeoman engine replaced the first "-lerna" of the name, which needed two runs ("legacy-lerna-lerna" -> "legacy-monorepo-lerna" -> "legacy-monorepo-monorepo").
  "legacy-lerna-monorepo": [
    'package.json: content differs, line 2: expected "  \\"name\\": \\"legacy-monorepo-monorepo\\",", got "  \\"name\\": \\"legacy-lerna-monorepo\\","',
    'README.md: content differs, line 2: expected "  legacy-monorepo", got "  legacy-lerna"',
  ],
};
