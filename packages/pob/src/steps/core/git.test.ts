import { describe, expect, test } from "vitest";
import type { PackageContext } from "../../engine/context.ts";
import { createTestContext, runTestSteps } from "../../engine/testing.ts";
import { gitStep } from "./git.ts";
import { json, rootProject, yoRc } from "./testUtils.ts";

const createContext = (
  pkg: Record<string, unknown>,
  originUrl: string | undefined,
): PackageContext =>
  createTestContext({
    files: {
      ".yo-rc.json": yoRc({ project: rootProject, lib: {} }),
      "package.json": json({ name: "@scope/name", ...pkg }),
    },
    facts: { originUrl },
  });

describe("git", () => {
  test("sets repository, bugs and homepage from the origin remote", async () => {
    const ctx = createContext(
      {
        homepage: "https://github.com/other/repo",
        repository: { type: "git", url: "https://github.com/old/old.git" },
      },
      "git@github.com:account/repo.git",
    );
    const plan = await runTestSteps(ctx, [gitStep]);
    expect(ctx.pkg.snapshot()).toMatchObject({
      homepage: "https://github.com/account/repo",
      bugs: { url: "https://github.com/account/repo/issues" },
      repository: "https://github.com/account/repo.git",
    });
    expect(plan.effects).toEqual([]);
  });

  test.each([
    "https://example.com",
    "https://github.com/account/repo#readme",
    "https://github.com/Account/repo/tree/main/packages/a",
  ])("keeps the homepage %s", async (homepage) => {
    const ctx = createContext(
      { homepage },
      "https://github.com/account/repo.git",
    );
    await runTestSteps(ctx, [gitStep]);
    expect(ctx.pkg.get("homepage")).toBe(homepage);
  });

  test("without origin remote: from package.json, with git effects", async () => {
    const ctx = createContext(
      { repository: "https://gitlab.com/account/repo.git" },
      undefined,
    );
    const plan = await runTestSteps(ctx, [gitStep]);
    expect(ctx.pkg.get("repository")).toBe(
      "https://gitlab.com/account/repo.git",
    );
    expect(
      plan.effects.map(({ id, command, after }) => ({ id, command, after })),
    ).toEqual([
      { id: "git-init", command: "git init", after: [] },
      {
        id: "git-remote-add",
        command: "git remote add origin git@gitlab.com:account/repo.git",
        after: ["git-init"],
      },
    ]);
  });

  test("gitlab nested groups and credentials in the remote", async () => {
    const ctx = createContext(
      {},
      "https://gitlab-ci-token:secret@gitlab.com/group/sub/repo.git",
    );
    await runTestSteps(ctx, [gitStep]);
    expect(ctx.pkg.snapshot()).toMatchObject({
      homepage: "https://gitlab.com/group/sub/repo",
      bugs: { url: "https://gitlab.com/group/sub/repo/issues" },
      repository: "https://gitlab.com/group/sub/repo.git",
    });
  });

  test.each([
    "git@gitlab.mycorp.com:team/repo.git",
    "https://user:secret@git.mycorp.com/team/repo.git",
  ])(
    "unknown host %s: warns and keeps repository, homepage and bugs",
    async (originUrl) => {
      const pkg = {
        homepage: "https://docs.mycorp.com",
        bugs: { url: "https://jira.mycorp.com" },
        repository: "https://gitlab.mycorp.com/team/repo.git",
      };
      const ctx = createContext(pkg, originUrl);
      const plan = await runTestSteps(ctx, [gitStep]);
      expect(ctx.pkg.snapshot()).toMatchObject(pkg);
      expect(plan.effects).toEqual([]);
    },
  );

  test("unknown host: the warning hides credentials", async () => {
    const warnings: string[] = [];
    const ctx = createContext(
      {},
      "https://user:secret@git.mycorp.com/team/repo.git",
    );
    ctx.warn = (message) => warnings.push(message);
    await runTestSteps(ctx, [gitStep]);
    expect(warnings).toEqual([
      "git: unknown git host in https://***@git.mycorp.com/team/repo.git: repository, homepage and bugs are left as they are, the github features are skipped",
    ]);
  });

  test("without origin remote, a repository on an unknown host: git init only", async () => {
    const ctx = createContext(
      { repository: "https://gitlab.mycorp.com/team/repo.git" },
      undefined,
    );
    const plan = await runTestSteps(ctx, [gitStep]);
    expect(ctx.pkg.get("repository")).toBe(
      "https://gitlab.mycorp.com/team/repo.git",
    );
    expect(plan.effects.map(({ id }) => id)).toEqual(["git-init"]);
  });

  test("throws without remote nor repository", async () => {
    await expect(
      runTestSteps(createContext({}, undefined), [gitStep]),
    ).rejects.toThrow("cannot find the git host");
  });
});
