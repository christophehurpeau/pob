import { fileURLToPath } from "node:url";
import { loadPreset } from "conventional-changelog-preset-loader";
import { parseCommits } from "conventional-commits-parser";
import type { Commit } from "conventional-commits-parser";
import type { Preset } from "conventional-recommended-bump";
import type { PackageJson } from "type-fest";
// import { beforeAll, describe, expect, it } from "vitest";
import {
  generateChangelog,
  recommendBump,
} from "./conventionalChangelogUtils.ts";
import type { Workspace } from "./packageUtils.ts";

const createMockCommit = (
  type: string,
  subject: string,
  options: {
    scope?: string;
    body?: string;
    breaking?: boolean;
    breakingMessage?: string;
  } = {},
): Commit => {
  const header = `${type}${options.scope ? `(${options.scope})` : ""}${options.breaking ? "!" : ""}: ${subject}`;
  const rawCommit = `${header}\n\n${options.body || ""}`.trim();

  // @ts-expect-error - notes conflict
  const commit: Commit = {
    type,
    scope: options.scope || null,
    subject,
    merge: null,
    header,
    body: options.body || null,
    footer: null,
    notes: [],
    references: [],
    mentions: [],
    revert: null,
    raw: rawCommit,
  };

  if (options.breaking) {
    commit.notes = [
      {
        title: "BREAKING CHANGE",
        text: options.breakingMessage || "This is a breaking change",
      },
    ];
    commit.footer = `BREAKING CHANGE: ${options.breakingMessage || "This is a breaking change"}`;
  }

  return commit;
};

const createMockWorkspace = (cwd: string, pkg: PackageJson): Workspace => ({
  cwd,
  pkg,
});

let config: Preset;
let ccParseCommits: ReturnType<typeof parseCommits>;

beforeAll(async () => {
  config = await loadPreset<Preset>(
    "conventional-changelog-conventionalcommits",
  );
  ccParseCommits = parseCommits(config.parser);
});

const createMockCommits = async (commits: string[]): Promise<Commit[]> => {
  const result: Commit[] = [];
  for await (const commit of ccParseCommits(commits)) {
    result.push(commit);
  }
  return result;
};

describe("recommendBump", () => {
  describe("major bump scenarios", () => {
    it("should recommend major bump when commit has BREAKING CHANGE", async () => {
      const commits = [
        createMockCommit("feat", "add new feature", {
          breaking: true,
          breakingMessage: "API changed completely",
        }),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("major");
      expect(result.reason).toContain("BREAKING CHANGE");
    });

    it("should recommend major bump when multiple breaking changes exist", async () => {
      const commits = [
        createMockCommit("feat", "new API", {
          breaking: true,
          breakingMessage: "Old API removed",
        }),
        createMockCommit("fix", "update handler", {
          breaking: true,
          breakingMessage: "Handler signature changed",
        }),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("major");
    });

    it("should recommend major bump with breaking change over regular feat", async () => {
      const commits = [
        createMockCommit("feat", "add logging"),
        createMockCommit("refactor", "rewrite core", {
          breaking: true,
          breakingMessage: "Core module API changed",
        }),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("major");
    });
  });

  describe("minor bump scenarios", () => {
    it("should recommend minor bump for single feat commit", async () => {
      const commits = [createMockCommit("feat", "add new feature")];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("minor");
    });

    it("should recommend minor bump for multiple feat commits", async () => {
      const commits = [
        createMockCommit("feat", "add feature A"),
        createMockCommit("feat", "add feature B"),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("minor");
    });

    it("should recommend minor bump for feat with scope", async () => {
      const commits = [
        createMockCommit("feat", "add validation", { scope: "api" }),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("minor");
    });

    it("should recommend minor bump when mixed with non-bumping commits", async () => {
      const commits = [
        createMockCommit("chore", "update dependencies"),
        createMockCommit("feat", "add feature"),
        createMockCommit("docs", "update README"),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("minor");
    });

    it("should recommend minor over patch when both feat and fix exist", async () => {
      const commits = [
        createMockCommit("fix", "fix bug"),
        createMockCommit("feat", "add feature"),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("minor");
    });
  });

  describe("patch bump scenarios", () => {
    it("should recommend patch bump for single fix commit", async () => {
      const commits = [createMockCommit("fix", "fix bug")];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch bump for multiple fix commits", async () => {
      const commits = [
        createMockCommit("fix", "fix bug A"),
        createMockCommit("fix", "fix bug B"),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch bump for perf commits", async () => {
      const commits = [createMockCommit("perf", "optimize database queries")];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch bump for fix with scope", async () => {
      const commits = [
        createMockCommit("fix", "correct validation", { scope: "auth" }),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch bump when mixed with non-bumping commits", async () => {
      const commits = [
        createMockCommit("chore", "update config"),
        createMockCommit("fix", "fix crash"),
        createMockCommit("test", "add tests"),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });
  });

  describe("no bump scenarios", () => {
    it("should recommend patch for chore commits", async () => {
      const commits = [
        createMockCommit("chore", "update dependencies"),
        createMockCommit("chore", "update config"),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch for docs commits", async () => {
      const commits = [createMockCommit("docs", "update documentation")];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch for style commits", async () => {
      const commits = [createMockCommit("style", "format code")];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch for test commits", async () => {
      const commits = [createMockCommit("test", "add unit tests")];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch for build commits", async () => {
      const commits = [createMockCommit("build", "update build script")];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch for ci commits", async () => {
      const commits = [createMockCommit("ci", "update CI configuration")];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch for mixed non-feature commits", async () => {
      const commits = [
        createMockCommit("chore", "update deps"),
        createMockCommit("docs", "update docs"),
        createMockCommit("style", "format"),
        createMockCommit("test", "add tests"),
      ];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });

    it("should recommend patch for empty commit list", async () => {
      const commits: Commit[] = [];

      const result = await recommendBump(commits, config);

      expect(result.releaseType).toBe("patch");
    });
  });
});

describe("generateChangelog", () => {
  const mockCwd = fileURLToPath(
    new URL("../__fixtures__/basic", import.meta.url),
  );

  describe("single package scenarios", () => {
    it("should generate changelog for first release with no previousTag", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.0.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = ["feat: initial feature implementation\n"];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## 1.0.0 (2025-01-15)\n\n### Features\n\n* initial feature implementation\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        null,
        "v1.0.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should generate changelog for subsequent release with previousTag", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.1.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = ["feat: add new feature\n\nFeature description\n"];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.1.0](https://github.com/org/repo/compare/v1.0.0...v1.1.0) (2025-01-15)\n\n### Features\n\n* add new feature\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v1.1.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should include breaking changes in changelog", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "2.0.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = [
        "feat!: breaking API change\n\nBREAKING CHANGE: API changed\n",
      ];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [2.0.0](https://github.com/org/repo/compare/v1.0.0...v2.0.0) (2025-01-15)\n\n### ⚠ BREAKING CHANGES\n\n* API changed\n\n### Features\n\n* breaking API change\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v2.0.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });
  });

  describe("monorepo scenarios", () => {
    it("should generate changelog for monorepo package for first release", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "@test/package-a",
        version: "1.0.0",
        repository: {
          type: "git",
          url: "https://github.com/org/repo",
          directory: "@test/package-a",
        },
      });

      const rawCommits = ["fix(package-a): fix issue\n\n"];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## 1.0.0 (2025-01-15)\n\n### Bug Fixes\n\n* **package-a:** fix issue\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        null,
        "@test/package-a@1.0.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should generate changelog for monorepo package for subsequent release", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "@test/package-a",
        version: "1.1.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = ["fix(package-a): fix issue\n\n"];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.1.0](https://github.com/org/repo/compare/@test/package-a@1.0.0...@test/package-a@1.1.0) (2025-01-15)\n\n### Bug Fixes\n\n* **package-a:** fix issue\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "@test/package-a@1.0.0",
        "@test/package-a@1.1.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should handle breaking change", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "@test/package-b",
        version: "2.0.0",
        repository: {
          type: "git",
          url: "https://github.com/org/repo",
          directory: "@test/package-b",
        },
      });

      const rawCommits = [
        "feat(package-b)!: API changed\n\nBREAKING CHANGE: API changed\n",
      ];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [2.0.0](https://github.com/org/repo/compare/@test/package-b@1.0.0...@test/package-b@2.0.0) (2025-01-15)\n\n### ⚠ BREAKING CHANGES\n\n* **package-b:** API changed\n\n### Features\n\n* **package-b:** API changed\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "@test/package-b@1.0.0",
        "@test/package-b@2.0.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });
  });

  describe("commit type scenarios", () => {
    it("should format feat commits in changelog", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.1.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = [
        "feat: add authentication\n\n",
        "feat: add logging\n\n",
      ];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.1.0](https://github.com/org/repo/compare/v1.0.0...v1.1.0) (2025-01-15)\n\n### Features\n\n* add authentication\n* add logging\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v1.1.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should format fix commits in changelog", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.0.1",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = [
        "fix: fix memory leak\n\n",
        "fix: fix validation error\n\n",
      ];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.0.1](https://github.com/org/repo/compare/v1.0.0...v1.0.1) (2025-01-15)\n\n### Bug Fixes\n\n* fix memory leak\n* fix validation error\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v1.0.1",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should include scopes in changelog", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.1.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = [
        "feat(api): add endpoint\n\n",
        "feat(auth): add OAuth support\n\n",
      ];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.1.0](https://github.com/org/repo/compare/v1.0.0...v1.1.0) (2025-01-15)\n\n### Features\n\n* **api:** add endpoint\n* **auth:** add OAuth support\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v1.1.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should handle mixed commit types", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.1.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = [
        "feat: add feature A\n\n",
        "fix: fix bug B\n\n",
        "perf: optimize query\n\n",
      ];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.1.0](https://github.com/org/repo/compare/v1.0.0...v1.1.0) (2025-01-15)\n\n### Features\n\n* add feature A\n\n### Bug Fixes\n\n* fix bug B\n\n### Performance Improvements\n\n* optimize query\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v1.1.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should handle perf commits", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.0.1",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = ["perf: optimize database queries\n\n"];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.0.1](https://github.com/org/repo/compare/v1.0.0...v1.0.1) (2025-01-15)\n\n### Performance Improvements\n\n* optimize database queries\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v1.0.1",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should exclude chore commits from changelog", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.1.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = [
        "feat: add feature\n\n",
        "chore: update dependencies\n\n",
      ];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.1.0](https://github.com/org/repo/compare/v1.0.0...v1.1.0) (2025-01-15)\n\n### Features\n\n* add feature\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v1.1.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });

    it("should exclude non-changelog commit types", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.1.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = [
        "feat: add feature\n\n",
        "docs: update README\n\n",
        "test: add tests\n\n",
        "style: format code\n\n",
        "build: update build\n\n",
        "ci: update CI\n\n",
      ];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.1.0](https://github.com/org/repo/compare/v1.0.0...v1.1.0) (2025-01-15)\n\n### Features\n\n* add feature\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v1.1.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });
  });

  describe("multi-line descriptions", () => {
    it("should handle commits with multi-line body", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.1.0",
        repository: "https://github.com/org/repo",
      });

      const rawCommits = [
        "feat: add authentication\n\nThis adds comprehensive authentication support\nincluding OAuth, JWT, and session management.\n",
      ];
      const commits = await createMockCommits(rawCommits);

      const expectedChangelog =
        "## [1.1.0](https://github.com/org/repo/compare/v1.0.0...v1.1.0) (2025-01-15)\n\n### Features\n\n* add authentication\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        "v1.0.0",
        "v1.1.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });
  });

  describe("edge cases", () => {
    it("should handle empty changelog (no commits)", async () => {
      const workspace = createMockWorkspace(mockCwd, {
        name: "test-package",
        version: "1.0.0",
        repository: "https://github.com/org/repo",
      });

      const commits = await createMockCommits([]);

      const expectedChangelog = "## 1.0.0 (2025-01-15)\n";

      const changelog = await generateChangelog(
        workspace,
        workspace.pkg,
        config,
        null,
        "v1.0.0",
        commits,
        "2025-01-15",
      );

      expect(changelog.length).toBeLessThan(1000);
      expect(changelog).toBe(expectedChangelog);
    });
  });
});
