/**
 * Fixture repositories of the differential harness. Each one is written to a
 * temporary git repository before pob runs in it.
 */

export interface Fixture {
  name: string;
  description: string;
  /** commit of this repository extracted with `git archive` before `files` */
  gitArchive?: string;
  files: Record<string, string>;
  /** origin remote, a github one by default */
  remote?: string | null;
}

/** this monorepo, pinned so that the snapshot does not change on every commit */
export const MONOREPO_FIXTURE_COMMIT =
  "0377f6289e3dbc5b1cc9f9bec71f27112a12825e";

const author = "Test Author <test@example.com> (https://example.com)";

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const yoRc = (pob: Record<string, unknown>): string => json({ pob });

const rootYoRc = (pob: Record<string, unknown>): string =>
  yoRc({ renovate: { enable: true }, ...pob });

const pkg = (
  name: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
  name,
  version: "1.0.0",
  description: `${name} fixture`,
  license: "MIT",
  author,
  type: "module",
  ...extra,
});

const tsSource = 'export const hello = (): string => "hello";\n';
const jsSource = 'export const hello = () => "hello";\n';

export const fixtures: Fixture[] = [
  {
    name: "pob-monorepo",
    description: "this monorepo at a pinned commit, with its 4 pob-examples",
    gitArchive: MONOREPO_FIXTURE_COMMIT,
    remote: "https://github.com/christophehurpeau/pob.git",
    files: {},
  },
  {
    name: "js-lib-npm",
    description: "untranspiled js library, npm, node:test",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "npm", ci: true },
        lib: {
          documentation: false,
          testing: { runner: "node", codecov: false },
          e2e: false,
          buildInGit: false,
        },
      }),
      "package.json": json(pkg("js-lib-npm", { pob: {} })),
      "lib/index.js": jsSource,
    },
  },
  {
    name: "ts-lib-rollup-esbuild-pnpm",
    description: "typescript library built with rollup-esbuild, pnpm, vitest",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "pnpm", ci: true },
        lib: {
          documentation: false,
          testing: { runner: "vitest", codecov: true },
          e2e: false,
          buildInGit: false,
        },
      }),
      "package.json": json(
        pkg("ts-lib-rollup-esbuild-pnpm", {
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "24" }, { target: "browser" }],
            typescript: true,
          },
        }),
      ),
      "src/index.ts": tsSource,
    },
  },
  {
    name: "ts-lib-tsc-yarn",
    description: "typescript library built with tsc, yarn node-modules",
    files: {
      ".yo-rc.json": rootYoRc({
        project: {
          type: "lib",
          packageManager: "yarn",
          yarnNodeLinker: "node-modules",
          ci: true,
        },
        lib: {
          documentation: false,
          testing: { runner: "vitest", codecov: false },
          e2e: false,
          buildInGit: false,
        },
      }),
      "package.json": json(
        pkg("ts-lib-tsc-yarn", {
          pob: {
            bundler: "tsc",
            entries: ["index"],
            envs: [{ target: "node", version: "24" }],
            typescript: true,
          },
        }),
      ),
      "src/index.ts": tsSource,
    },
  },
  {
    name: "vite-app-bun",
    description: "vite app, bun",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "app", packageManager: "bun", ci: true },
        app: { type: "vite", testing: false, codecov: false, e2e: false },
      }),
      "package.json": json(
        pkg("vite-app-bun", {
          private: true,
          dependencies: { react: "19.0.0", "react-dom": "19.0.0" },
        }),
      ),
      "src/index.tsx": "export const App = () => null;\n",
    },
  },
  {
    name: "node-app-pnpm",
    description: "node app, pnpm, vitest",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "app", packageManager: "pnpm", ci: true },
        app: {
          type: "node",
          testing: true,
          testRunner: "vitest",
          codecov: false,
          e2e: false,
        },
      }),
      "package.json": json(
        pkg("node-app-pnpm", {
          private: true,
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "24" }],
            typescript: true,
          },
        }),
      ),
      "src/index.ts": tsSource,
    },
  },
  {
    name: "expo-app-yarn",
    description: "expo app, yarn node-modules",
    files: {
      ".yo-rc.json": rootYoRc({
        project: {
          type: "app",
          packageManager: "yarn",
          yarnNodeLinker: "node-modules",
          ci: true,
        },
        app: { type: "expo", testing: false, codecov: false, e2e: false },
      }),
      "package.json": json(
        pkg("expo-app-yarn", {
          private: true,
          main: "expo-router/entry",
          dependencies: {
            expo: "55.0.0",
            react: "19.0.0",
            "react-native": "0.83.0",
          },
        }),
      ),
      "src/app/index.tsx": "export default function Index() { return null; }\n",
    },
  },
  {
    name: "pnpm-monorepo",
    description: "pnpm monorepo with a typescript library and a node app",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "pnpm", ci: true },
        monorepo: {
          ci: true,
          disablePushWorkflow: false,
          testing: true,
          testRunner: "vitest",
          e2eTesting: false,
          codecov: false,
          documentation: false,
          typescript: true,
          eslint: true,
          storybook: false,
          storybookReactNative: false,
        },
      }),
      "package.json": json({
        name: "pnpm-monorepo",
        version: "1.0.0",
        private: true,
        license: "MIT",
        author,
        type: "module",
        workspaces: ["packages/*"],
      }),
      "packages/lib-a/.yo-rc.json": yoRc({
        project: { type: "lib" },
        lib: {
          documentation: false,
          testing: {},
          e2e: false,
          buildInGit: false,
        },
      }),
      "packages/lib-a/package.json": json(
        pkg("@pnpm-monorepo/lib-a", {
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "24" }],
            typescript: true,
          },
        }),
      ),
      "packages/lib-a/src/index.ts": tsSource,
      "packages/lib-a/tsconfig.json": json({}),
      "packages/app-b/.yo-rc.json": yoRc({
        project: { type: "app" },
        app: {
          type: "node",
          testing: true,
          testRunner: "vitest",
          codecov: false,
          e2e: false,
        },
      }),
      "packages/app-b/package.json": json(
        pkg("@pnpm-monorepo/app-b", {
          private: true,
          dependencies: { "@pnpm-monorepo/lib-a": "workspace:*" },
        }),
      ),
      "packages/app-b/src/index.ts": tsSource,
      "packages/app-b/tsconfig.json": json({}),
    },
  },
  {
    name: "yarn-monorepo",
    description: "yarn pnp monorepo of untranspiled js libraries",
    files: {
      ".yo-rc.json": rootYoRc({
        project: {
          type: "lib",
          packageManager: "yarn",
          yarnNodeLinker: "pnp",
          ci: true,
        },
        monorepo: {
          ci: true,
          disablePushWorkflow: false,
          testing: true,
          testRunner: "node",
          e2eTesting: false,
          codecov: false,
          documentation: false,
          typescript: false,
          eslint: true,
          storybook: false,
          storybookReactNative: false,
        },
      }),
      "package.json": json({
        name: "yarn-monorepo",
        version: "1.0.0",
        private: true,
        license: "MIT",
        author,
        type: "module",
        workspaces: ["packages/*"],
      }),
      "packages/one/.yo-rc.json": yoRc({
        project: { type: "lib" },
        lib: {
          documentation: false,
          testing: {},
          e2e: false,
          buildInGit: false,
        },
      }),
      "packages/one/package.json": json(pkg("yarn-monorepo-one", { pob: {} })),
      "packages/one/lib/index.js": jsSource,
      "packages/two/.yo-rc.json": yoRc({
        project: { type: "lib" },
        lib: {
          documentation: false,
          testing: false,
          e2e: false,
          buildInGit: false,
        },
      }),
      "packages/two/package.json": json(
        pkg("yarn-monorepo-two", {
          pob: {},
          dependencies: { "yarn-monorepo-one": "workspace:*" },
        }),
      ),
      "packages/two/lib/index.js": jsSource,
    },
  },
  {
    name: "lib-documentation",
    description:
      "library with documentation: the readme template of old pob fails on it",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "pnpm", ci: true },
        lib: {
          documentation: true,
          testing: { runner: "vitest", codecov: true },
          e2e: false,
          buildInGit: false,
        },
      }),
      "package.json": json(
        pkg("lib-documentation", {
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "24" }],
            typescript: true,
          },
        }),
      ),
      "src/index.ts": tsSource,
    },
  },
  {
    name: "legacy-pob-json",
    description:
      ".pob.json of old pob versions, string envs, testing: true, yarn2",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "yarn", yarn2: true, ci: true },
      }),
      ".pob.json": json({
        documentation: false,
        testing: { runner: "vitest", codecov: false, travisci: true },
        e2e: false,
        flow: false,
        react: false,
        doclets: false,
      }),
      "package.json": json(pkg("legacy-pob-json", { pob: {} })),
      "lib/index.js": jsSource,
    },
  },
  {
    name: "legacy-babel-envs",
    description: "pob.babelEnvs: old pob refuses babel and fails",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "yarn", ci: true },
        lib: {
          documentation: false,
          testing: false,
          e2e: false,
          buildInGit: false,
        },
      }),
      "package.json": json(
        pkg("legacy-babel-envs", {
          pob: {
            babelEnvs: [{ target: "node", version: "14", formats: ["cjs"] }],
            entries: ["index"],
          },
        }),
      ),
      "src/index.js": jsSource,
    },
  },
  {
    name: "legacy-tooling",
    description:
      "old husky, commitlint, prettier, eslintrc, ci, jest, flow and generated docs files",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "yarn", ci: true },
        lib: {
          documentation: false,
          testing: { runner: "vitest", codecov: false },
          e2e: false,
          buildInGit: false,
        },
      }),
      "package.json": json(
        pkg("legacy-tooling", {
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "22" }],
            typescript: true,
          },
          scripts: {
            build: "pob-build",
            "lint:prettier": "prettier --check .",
            precommit: "lint-staged",
            prepublish: "npm run build",
            postbuild: "echo done",
            "typescript-check": "tsc --noEmit",
            version: "pob-version",
          },
          husky: { hooks: { "pre-commit": "lint-staged" } },
          "lint-staged": { "*.js": ["eslint --fix"] },
          commitlint: { extends: ["@commitlint/config-conventional"] },
          prettier: { singleQuote: true },
          jest: { testEnvironment: "node" },
          devDependencies: {
            "@commitlint/cli": "8.0.0",
            "@pob/eslint-config": "40.0.0",
            "babel-eslint": "10.0.0",
            "eslint-config-airbnb-base": "14.0.0",
            "eslint-plugin-prettier": "3.0.0",
            "flow-bin": "0.100.0",
            husky: "4.0.0",
            jest: "26.0.0",
            "pob-babel": "26.0.0",
            "standard-version": "8.0.0",
            tslint: "5.0.0",
          },
        }),
      ),
      "src/index.ts": tsSource,
      ".huskyrc.js": "module.exports = {};\n",
      "husky.config.js": "module.exports = {};\n",
      "lint-staged.config.cjs": "module.exports = {};\n",
      "git-hooks/pre-commit": "#!/bin/sh\n",
      ".git-hooks/pre-commit": "#!/bin/sh\n",
      ".commitrc.js": "module.exports = {};\n",
      Makefile: "all:\n",
      ".prettierignore": "dist\n",
      ".eslintignore": "dist\n",
      ".eslintrc.json": json({ extends: ["pob"] }),
      "src/.eslintrc.json": json({ extends: ["pob/typescript"] }),
      ".eslintrc.yml": "extends: pob\n",
      ".travis.yml": "language: node_js\n",
      ".circleci/config.yml": "version: 2\n",
      "jest.config.js": "module.exports = {};\n",
      ".flowconfig": "[ignore]\n",
      "tsconfig.build.json": json({ extends: "./tsconfig.json" }),
      "rollup.config.js": "export default {};\n",
      "babel.config.cjs": "module.exports = {};\n",
      ".babelrc": json({ presets: ["pob-babel"] }),
      "docs/index.html": "<html></html>\n",
      "docs/.nojekyll": "",
      ".github/workflows/publish.yml": "name: publish\n",
      ".release-please-manifest.json": json({}),
    },
  },
  {
    name: "legacy-lerna-monorepo",
    description: "lerna.json monorepo with lerna dependencies and scripts",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "yarn", ci: true },
        monorepo: {
          ci: true,
          disablePushWorkflow: false,
          testing: false,
          e2eTesting: false,
          documentation: false,
          typescript: false,
          eslint: true,
          storybook: false,
          storybookReactNative: false,
          packageNames: ["stale-name"],
        },
      }),
      "lerna.json": json({
        version: "independent",
        npmClient: "yarn",
        useWorkspaces: true,
      }),
      "lerna-debug.log": "debug\n",
      "package.json": json({
        name: "legacy-lerna-lerna",
        version: "1.0.0",
        private: true,
        license: "MIT",
        author,
        type: "module",
        workspaces: ["packages/*"],
        lerna: { command: {} },
        scripts: {
          version:
            "YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn && git add yarn.lock",
          postbuild: "echo",
          prepublishOnly: "lerna run build",
          "lint:prettier": "prettier --check .",
        },
        devDependencies: { lerna: "3.0.0", "@pob/lerna-light": "3.0.0" },
      }),
      "packages/only/.yo-rc.json": yoRc({
        project: { type: "lib" },
        lib: {
          documentation: false,
          testing: false,
          e2e: false,
          buildInGit: false,
        },
      }),
      "packages/only/package.json": json(
        pkg("legacy-lerna-only", {
          pob: {},
          devDependencies: { lerna: "3.0.0", husky: "4.0.0" },
          scripts: { release: "lerna publish", preversion: "echo" },
        }),
      ),
      "packages/only/lib/index.js": jsSource,
    },
  },
];
