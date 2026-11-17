import { describe, expect, test } from "vitest";
import type { PackageContext } from "../../engine/context.ts";
import { isPlanEmpty } from "../../engine/plan.ts";
import { defineStep } from "../../engine/step.ts";
import { createTestContext, runTestSteps } from "../../engine/testing.ts";
import { steps } from "../index.ts";
import type {
  GitResult,
  GithubDependencies,
  GithubRepositoryInfo,
} from "./github.ts";
import {
  GithubRequestError,
  configureProtectionRule,
  createRepository,
  githubStep,
} from "./github.ts";
import { json, rootProject, yoRc } from "./testUtils.ts";

const ciStep = defineStep<PackageContext>({
  name: "ci",
  writes: ["ci.contexts"],
  run: (ctx) => {
    ctx.model("ci").set("contexts", ["build", "test"]);
  },
});

const createContext = (originUrl: string | undefined): PackageContext =>
  createTestContext({
    files: {
      ".yo-rc.json": yoRc({ project: rootProject, lib: {} }),
      "package.json": json({
        name: "repo",
        description: "desc",
        license: "MIT",
        repository: "https://github.com/account/repo.git",
      }),
    },
    facts: { originUrl },
  });

describe("github step", () => {
  test("plans the setup without origin remote", async () => {
    const plan = await runTestSteps(createContext(undefined), [
      githubStep,
      ciStep,
    ]);
    expect(plan.effects.map((effect) => effect.id)).toEqual(["github-setup"]);
    expect(plan.effects[0]?.after).toContain("install");
  });

  test("plans the sync on update and lists it with --check", async () => {
    const checkPlan = await runTestSteps(
      createContext("https://github.com/account/repo.git"),
      [githubStep],
    );
    expect(checkPlan.effects.map((effect) => effect.id)).toEqual([
      "github-sync",
    ]);
    expect(isPlanEmpty(checkPlan)).toBe(true);

    const ctx = createContext("https://github.com/account/repo.git");
    ctx.options.check = false;
    const plan = await runTestSteps(ctx, [githubStep]);
    expect(plan.effects.map((effect) => effect.id)).toEqual(["github-sync"]);
  });

  test.each([
    "https://gitlab.com/account/repo.git",
    "git@gitlab.mycorp.com:team/repo.git",
  ])("plans nothing for another host: %s", async (originUrl) => {
    const ctx = createContext(originUrl);
    ctx.options.check = false;
    const plan = await runTestSteps(ctx, [githubStep]);
    expect(plan.effects).toEqual([]);
  });

  test("the setup runs after every effect that changes files", async () => {
    const ctx = createTestContext({
      files: {
        "pob.json": json({
          project: { type: "lib", packageManager: "yarn", ci: true },
          lib: { testing: false, documentation: false, e2e: false },
          renovate: { enable: true },
          build: {},
        }),
        "package.json": json({
          name: "repo",
          description: "desc",
          type: "module",
          license: "MIT",
          author: "A <a@a.a>",
          repository: "https://github.com/account/repo.git",
        }),
      },
      facts: { originUrl: undefined },
    });
    ctx.options.check = false;
    const plan = await runTestSteps(ctx, steps);
    const setup = plan.effects.find((effect) => effect.id === "github-setup");
    expect(setup).toBeDefined();
    const others = plan.effects
      .map((effect) => effect.id)
      .filter((id) => id !== "github-setup");
    expect(others).toContain("yarn-format");
    expect(setup?.after).toEqual(expect.arrayContaining(others));
  });
});

interface Recorded {
  calls: string[];
  messages: string[];
}

const createFakeDependencies = ({
  requestError,
  gitResults = {},
}: {
  requestError?: Error;
  gitResults?: Record<string, GitResult>;
}): GithubDependencies & Recorded => {
  const calls: string[] = [];
  const messages: string[] = [];
  return {
    calls,
    messages,
    request: (method, url, body) => {
      calls.push(`${method} ${url}${body ? ` ${JSON.stringify(body)}` : ""}`);
      if (method === "GET") return Promise.resolve({ login: "account" });
      if (method === "POST" && requestError) {
        return Promise.reject(requestError);
      }
      return Promise.resolve({});
    },
    git: (args, options) => {
      const command = args.join(" ");
      calls.push(
        `git ${command}${options?.env ? ` ${JSON.stringify(options.env)}` : ""}`,
      );
      return gitResults[command] ?? { status: 0, stdout: "" };
    },
    log: (message) => messages.push(`log: ${message}`),
    warn: (message) => messages.push(`warn: ${message}`),
    printError: (message) => messages.push(`error: ${message}`),
  };
};

const info: GithubRepositoryInfo = {
  owner: "account",
  repo: "repo",
  description: "desc",
  license: undefined,
  ciEnabled: true,
  ciContexts: ["build"],
};

describe("github effects", () => {
  test("creates a private repository, commits, pushes and protects main", async () => {
    const deps = createFakeDependencies({
      gitResults: {
        "rev-parse --verify HEAD": { status: 128, stdout: "" },
        "ls-remote --heads origin main": { status: 0, stdout: "abc main\n" },
      },
    });
    await createRepository(info, deps);
    expect(deps.calls.map((call) => call.split(" {")[0])).toEqual([
      "GET user",
      "POST user/repos",
      "git rev-parse --verify HEAD",
      "git add --all .",
      "git commit -m chore: initial commit [skip ci]",
      "git branch -M main",
      "git push -u origin main",
      "git ls-remote --heads origin main",
      "PUT repos/account/repo/branches/main/protection",
      "git ls-remote --heads origin master",
    ]);
    expect(deps.calls[1]).toContain('"private":true');
    expect(deps.calls[4]).toContain('{"POB_GIT_HOOKS":"0"}');
    expect(deps.calls[8]).toContain('"contexts":["build"]');
    expect(deps.messages).toEqual([]);
  });

  test("syncs an existing repository and does not commit twice", async () => {
    const deps = createFakeDependencies({
      requestError: new GithubRequestError("POST", "user/repos", 422, ""),
    });
    await createRepository({ ...info, ciEnabled: false }, deps);
    expect(deps.calls.map((call) => call.split(" {")[0])).toEqual([
      "GET user",
      "POST user/repos",
      "PATCH repos/account/repo",
      "git rev-parse --verify HEAD",
      "git branch -M main",
      "git push -u origin main",
    ]);
  });

  test("stops when the repository cannot be created", async () => {
    const deps = createFakeDependencies({ requestError: new Error("network") });
    await createRepository(info, deps);
    expect(deps.calls).toHaveLength(2);
    expect(deps.messages).toEqual([
      "error: Failed to create github repository account/repo: nothing was committed or pushed",
    ]);
  });

  test("stops when the push fails", async () => {
    const deps = createFakeDependencies({
      gitResults: { "push -u origin main": { status: 1, stdout: "" } },
    });
    await createRepository(info, deps);
    expect(deps.calls.at(-1)).toBe("git push -u origin main");
    expect(deps.messages).toEqual([
      "error: Failed to push to github. Run by hand: git branch -M main && git push -u origin main",
    ]);
  });

  test("no branch protection without ci contexts", async () => {
    const deps = createFakeDependencies({});
    await configureProtectionRule({ ...info, ciContexts: [] }, deps);
    expect(deps.calls).toEqual([]);
    expect(deps.messages).toEqual([
      "warn: No ci contexts: branch protection not configured",
    ]);
  });

  test("reports a missing main branch", async () => {
    const deps = createFakeDependencies({});
    await configureProtectionRule(info, deps);
    expect(deps.messages).toEqual([
      "error: Failed to configure main branch protection",
    ]);
  });
});
