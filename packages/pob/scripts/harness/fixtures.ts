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
  /** directory pob runs in, relative to the fixture, "." by default */
  cwd?: string;
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

const scopedLibPkg = (
  name: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> =>
  pkg(name, {
    pob: {
      bundler: "rollup-esbuild",
      entries: ["index"],
      envs: [{ target: "node", version: "24" }],
      typescript: true,
    },
    ...extra,
  });

const typescriptWorkspacesWithoutPobFiles: Record<string, string> = {
  ".yo-rc.json": rootYoRc({
    project: { type: "lib", packageManager: "pnpm", ci: false },
    monorepo: {
      ci: false,
      testing: false,
      e2eTesting: false,
      documentation: true,
      typescript: true,
      eslint: true,
    },
  }),
  "package.json": json({
    name: "monorepo-typescript-without-pob",
    version: "1.0.0",
    private: true,
    license: "MIT",
    author,
    repository: "https://github.com/pob-harness/without-pob.git",
    type: "module",
    workspaces: ["packages/*"],
  }),
  "packages/lib/.yo-rc.json": yoRc({
    project: { type: "lib" },
    lib: { documentation: false, testing: false, e2e: false },
  }),
  "packages/lib/package.json": json(scopedLibPkg("@harness/lib")),
  "packages/lib/src/index.ts": tsSource,
  "packages/lib/tsconfig.json": json({}),
  "packages/app/.yo-rc.json": yoRc({
    project: { type: "lib" },
    lib: { documentation: false, testing: false, e2e: false },
  }),
  "packages/app/package.json": json(
    scopedLibPkg("@harness/app", {
      dependencies: {
        "@harness/built": "workspace:*",
        "@harness/lib": "workspace:*",
        "@harness/plain": "workspace:*",
      },
    }),
  ),
  "packages/app/src/index.ts": tsSource,
  "packages/plain/package.json": json(pkg("@harness/plain")),
  "packages/plain/tsconfig.json": json({ include: ["src"] }),
  "packages/plain/src/index.ts": tsSource,
  "packages/built/package.json": json(scopedLibPkg("@harness/built")),
  "packages/built/tsconfig.json": json({ include: ["src"] }),
  "packages/built/rollup.config.mjs": "export default [];\n",
  "packages/built/src/index.ts": tsSource,
};

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
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "24" }],
            typescript: true,
          },
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
  {
    name: "monorepo-root-repository",
    description:
      "monorepo whose root repository is a git+ url of another repository, without homepage nor bugs: the packages get the values of the root git step",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "pnpm", ci: false },
        monorepo: {
          ci: false,
          testing: false,
          e2eTesting: false,
          documentation: false,
          typescript: false,
          eslint: true,
        },
      }),
      "package.json": json({
        name: "monorepo-root-repository",
        version: "1.0.0",
        private: true,
        license: "MIT",
        author,
        type: "module",
        repository: {
          type: "git",
          url: "git+https://github.com/old-owner/old-name.git",
        },
        workspaces: ["packages/*"],
      }),
      "packages/lib/.yo-rc.json": yoRc({
        project: { type: "lib" },
        lib: { documentation: false, testing: false, e2e: false },
      }),
      "packages/lib/package.json": json(
        pkg("monorepo-root-repository-lib", {
          pob: {},
          homepage: "https://github.com/old-owner/old-name",
          repository: {
            type: "git",
            url: "git+https://github.com/old-owner/old-name.git",
            directory: "packages/lib",
          },
        }),
      ),
      "packages/lib/lib/index.js": jsSource,
    },
  },
  {
    name: "monorepo-workspaces-without-pob",
    description:
      "monorepo with one pob package and 8 workspaces without pob config: react, vitest browser, a bundler in package.json#pob",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "pnpm", ci: true },
        monorepo: {
          ci: true,
          testing: true,
          testRunner: "vitest",
          e2eTesting: false,
          codecov: false,
          documentation: false,
          typescript: false,
          eslint: true,
        },
      }),
      "package.json": json({
        name: "monorepo-workspaces-without-pob",
        version: "1.0.0",
        private: true,
        license: "MIT",
        author,
        type: "module",
        workspaces: ["packages/*"],
      }),
      "packages/pob-lib/.yo-rc.json": yoRc({
        project: { type: "lib" },
        lib: { documentation: false, testing: {}, e2e: false },
      }),
      "packages/pob-lib/package.json": json(pkg("pob-lib", { pob: {} })),
      "packages/pob-lib/lib/index.js": jsSource,
      "packages/react-ui/package.json": json(
        pkg("react-ui", { dependencies: { react: "19.0.0" } }),
      ),
      "packages/browser-tests/package.json": json(
        pkg("browser-tests", {
          private: true,
          devDependencies: { "@vitest/browser-playwright": "5.0.0" },
        }),
      ),
      "packages/bundled/package.json": json(
        pkg("bundled", { pob: { bundler: "rollup-esbuild" } }),
      ),
      ...Object.fromEntries(
        ["one", "two", "three", "four", "five"].map((name) => [
          `packages/${name}/package.json`,
          json(pkg(name)),
        ]),
      ),
    },
  },
  {
    name: "expo-app-alouette",
    description:
      "expo app depending on alouette and the react-native storybook, app.alouette and app.storybook unset",
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
        pkg("expo-app-alouette", {
          private: true,
          main: "expo-router/entry",
          dependencies: {
            alouette: "1.0.0",
            expo: "55.0.0",
            react: "19.0.0",
            "react-native": "0.83.0",
          },
          devDependencies: { "@storybook/react-native": "9.0.0" },
        }),
      ),
      "src/app/index.tsx": "export default function Index() { return null; }\n",
    },
  },
  {
    name: "node-app-old-envs",
    description:
      "node app built with rollup-esbuild for node 22, without typescript: true",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "app", packageManager: "pnpm", ci: true },
        app: { type: "node", testing: false, codecov: false, e2e: false },
      }),
      "package.json": json(
        pkg("node-app-old-envs", {
          private: true,
          engines: { node: ">=22.0.0" },
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "22" }],
          },
        }),
      ),
      "src/index.ts": tsSource,
    },
  },
  {
    name: "lib-rollup-node-22",
    description:
      "library built with rollup-esbuild for node 22, without typescript: true",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "pnpm", ci: true },
        lib: { documentation: false, testing: false, e2e: false },
      }),
      "package.json": json(
        pkg("lib-rollup-node-22", {
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "22" }],
          },
        }),
      ),
      "src/index.ts": tsSource,
    },
  },
  {
    name: "monorepo-tracked-dist",
    description:
      "monorepo with two packages whose dist is tracked in git, buildInGit false: each one plans git-untrack-build",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "pnpm", ci: false },
        monorepo: {
          ci: false,
          testing: false,
          e2eTesting: false,
          documentation: false,
          typescript: false,
          eslint: true,
        },
      }),
      "package.json": json({
        name: "monorepo-tracked-dist",
        version: "1.0.0",
        private: true,
        license: "MIT",
        author,
        type: "module",
        workspaces: ["packages/*"],
      }),
      ...Object.fromEntries(
        ["a", "b"].flatMap((name) => [
          [
            `packages/${name}/.yo-rc.json`,
            yoRc({
              project: { type: "lib" },
              lib: {
                documentation: false,
                testing: false,
                e2e: false,
                buildInGit: false,
              },
            }),
          ],
          [
            `packages/${name}/package.json`,
            json(
              pkg(`monorepo-tracked-dist-${name}`, {
                pob: {
                  bundler: "rollup-esbuild",
                  entries: ["index"],
                  envs: [{ target: "node", version: "24" }],
                  typescript: true,
                },
              }),
            ),
          ],
          [`packages/${name}/src/index.ts`, tsSource],
          [`packages/${name}/dist/index.mjs`, jsSource],
        ]),
      ),
    },
  },
  {
    name: "monorepo-new-tsconfig",
    description:
      "typescript monorepo with documentation: a package gains its tsconfig.json in this run and another one depends on it; an untranspiled library with lib.documentation",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "pnpm", ci: false },
        monorepo: {
          ci: false,
          testing: false,
          e2eTesting: false,
          documentation: true,
          typescript: true,
          eslint: true,
        },
      }),
      "package.json": json({
        name: "monorepo-new-tsconfig",
        version: "1.0.0",
        private: true,
        license: "MIT",
        author,
        type: "module",
        workspaces: ["packages/*"],
      }),
      "packages/a/.yo-rc.json": yoRc({
        project: { type: "lib" },
        lib: { documentation: false, testing: false, e2e: false },
      }),
      "packages/a/package.json": json(
        pkg("monorepo-new-tsconfig-a", {
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "24" }],
            typescript: true,
          },
        }),
      ),
      "packages/a/src/index.ts": tsSource,
      "packages/b/.yo-rc.json": yoRc({
        project: { type: "lib" },
        lib: { documentation: false, testing: false, e2e: false },
      }),
      "packages/b/package.json": json(
        pkg("monorepo-new-tsconfig-b", {
          dependencies: { "monorepo-new-tsconfig-a": "workspace:*" },
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "24" }],
            typescript: true,
          },
        }),
      ),
      "packages/b/src/index.ts": tsSource,
      "packages/b/tsconfig.json": json({}),
      "packages/js/.yo-rc.json": yoRc({
        project: { type: "lib" },
        lib: { documentation: true, testing: false, e2e: false },
      }),
      "packages/js/package.json": json(
        pkg("monorepo-new-tsconfig-js", { pob: {} }),
      ),
      "packages/js/lib/index.js": jsSource,
    },
  },
  {
    name: "monorepo-typescript-without-pob",
    description:
      "typescript monorepo with documentation: a workspace with a tsconfig and no pob config, one with only package.json#pob and a rollup config, a package depending on them",
    files: typescriptWorkspacesWithoutPobFiles,
  },
  {
    name: "monorepo-typescript-without-pob-package-run",
    description:
      "monorepo-typescript-without-pob, run in the package depending on the other workspaces",
    cwd: "packages/app",
    files: typescriptWorkspacesWithoutPobFiles,
  },
  {
    name: "standalone-under-workspaces",
    description:
      "standalone library in a directory a workspaces root without pob config does not list",
    cwd: "tools/standalone",
    files: {
      "package.json": json({
        name: "outer",
        private: true,
        workspaces: ["packages/*"],
      }),
      "tools/standalone/.yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "npm", ci: false },
        lib: { documentation: false, testing: false, e2e: false },
      }),
      "tools/standalone/package.json": json(
        pkg("standalone-under-workspaces", {
          repository: "https://github.com/pob-harness/standalone.git",
          pob: {},
        }),
      ),
      "tools/standalone/lib/index.js": jsSource,
    },
  },
  {
    name: "standalone-under-pob-monorepo",
    description:
      "standalone library in a directory a pob monorepo does not list in its workspaces",
    cwd: "examples/standalone",
    files: {
      ".yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "pnpm", ci: false },
        monorepo: {
          ci: false,
          testing: false,
          documentation: false,
          typescript: false,
          eslint: true,
        },
      }),
      "package.json": json({
        name: "outer-monorepo",
        version: "1.0.0",
        private: true,
        license: "MIT",
        author,
        type: "module",
        workspaces: ["packages/*"],
      }),
      "examples/standalone/.yo-rc.json": rootYoRc({
        project: { type: "lib", packageManager: "npm", ci: false },
        lib: { documentation: false, testing: false, e2e: false },
      }),
      "examples/standalone/package.json": json(
        pkg("standalone-under-pob-monorepo", {
          repository: "https://github.com/pob-harness/standalone.git",
          pob: {},
        }),
      ),
      "examples/standalone/lib/index.js": jsSource,
    },
  },
];
