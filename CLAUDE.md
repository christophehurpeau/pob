# pob-monorepo

Library generator/tools/scripts. pnpm monorepo. ESM only (`"type": "module"`).

## Workspaces

- `packages/*` — published tools: [pob](packages/pob) (yeoman-based library generator, the flagship), `pob-dependencies`, `repository-check-dirty`, `yarn-version`, `babel-preset-pob-env`.
- `@pob/*` — internal-ish scoped packages: eslint configs/plugin, rollup/esbuild configs, `version` (conventional-commits versioning), `root` (shared root config: commitlint, lint-staged, tsconfigs), `sort-pkg`, `sort-object`, `codemods`, `pretty-pkg`.
- `pob-examples/*` — example consumer projects, also used as lint/build fixtures.

## Commands (run from repo root)

- Test: `pnpm test` (vitest, `TZ=UTC`). Single package: `pnpm test -- <pkgName>`. Coverage: `pnpm test:coverage`.
- Lint: `pnpm lint` (runs format, then oxlint, then eslint). Oxlint only: `pnpm lint:oxlint`. ESLint only: `pnpm lint:eslint`. oxlint runs every rule it supports, eslint only JSON, import-x and a few core rules: history in [docs/oxlint-migration.md](docs/oxlint-migration.md), how-to in the `eslint-config` skill.
- Format: `pnpm format` (oxfmt — NOT prettier).
- Typecheck: `pnpm tsc`
- Build: `pnpm build` (rollup bundles + `tsc` for `.d.ts`).

## Conventions

- Commits: conventional commits, enforced by commitlint (`@pob/root/commitlint-config`). Types: build/chore/ci/docs/feat/fix/perf/refactor/revert/style/test.
- Formatting: oxfmt, printWidth 80, config in [.oxfmtrc.jsonc](.oxfmtrc.jsonc). A PostToolUse hook runs lint-staged after every Edit/Write.
- Source lives in `src/`, builds to `dist/` (rollup packages) or `lib/` (pob). Tests are `*.test.ts` colocated in `src/`.
- Dependency hygiene enforced in-lint via `check-package-dependencies` (see the file-scoped rule blocks in [eslint.config.js](eslint.config.js)).

## Central aggregating configs (edit when adding/removing a package)

These are single root files that reference every package individually — a new package is invisible to tooling until wired into them:

- [tsconfig.json](tsconfig.json) — `references[]` lists each package's tsconfig.
- [rollup.config.mjs](rollup.config.mjs) — imports each rollup-built package's `rollup.config.mjs`.
- [eslint.config.js](eslint.config.js) — per-package `apply({ files, configs })` override blocks.

See the `add-package` skill for the full wiring checklist.
