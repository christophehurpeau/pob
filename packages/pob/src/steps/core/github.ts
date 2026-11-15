/* oxlint-disable eslint-js/camelcase */
import { spawnSync } from "node:child_process";
import os from "node:os";
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { getGitRepository } from "./gitRepository.ts";

const MISSING_TOKEN_HELP =
  'Create a token with https://github.com/settings/tokens/new?scopes=repo&description=POB%20Generator and set it in the POB_GITHUB_TOKEN env variable, or store it in the macOS keychain with: security add-generic-password -s pob-github-token -a "$USER" -w';

const githubRepoConfig = {
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: true,
  allow_auto_merge: true,
  delete_branch_on_merge: true,
  use_squash_pr_title_as_default: true,
  squash_merge_commit_title: "PR_TITLE",
  squash_merge_commit_message: "BLANK",
};

export class GithubRequestError extends Error {
  readonly status: number;

  constructor(method: string, url: string, status: number, body: string) {
    super(`${method} ${url} failed with status ${status}: ${body}`);
    this.name = "GithubRequestError";
    this.status = status;
  }
}

export type GithubRequest = (
  method: string,
  url: string,
  jsonBody?: unknown,
) => Promise<unknown>;

export interface GitResult {
  status: number | null;
  stdout: string;
}

export type RunGit = (
  args: string[],
  options?: { env?: Record<string, string> },
) => GitResult;

/** What the github effects use from the outside, replaced in tests */
export interface GithubDependencies {
  request: GithubRequest;
  git: RunGit;
  log: (message: string) => void;
  warn: (message: string) => void;
  printError: (message: string, error: unknown) => void;
}

export interface GithubRepositoryInfo {
  owner: string;
  repo: string;
  description: string | undefined;
  license: string | undefined;
  /** branch protection is only configured with ci */
  ciEnabled: boolean;
  /** required status checks, from the ci step */
  ciContexts: readonly string[];
}

const readTokenFromKeychain = (): string | undefined => {
  if (process.platform !== "darwin") return undefined;
  const result = spawnSync(
    "security",
    [
      "find-generic-password",
      "-s",
      "pob-github-token",
      "-a",
      os.userInfo().username,
      "-w",
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) return undefined;
  return result.stdout.trim() || undefined;
};

/** Read when an effect runs only: the keychain prompt is not free. */
const readGithubToken = (): string | undefined =>
  process.env.POB_GITHUB_TOKEN || readTokenFromKeychain();

const createGithubRequest =
  (token: string): GithubRequest =>
  async (method, url, jsonBody) => {
    const res = await fetch(`https://api.github.com/${url}`, {
      method,
      body: jsonBody === undefined ? undefined : JSON.stringify(jsonBody),
      headers: {
        accept: "application/vnd.github+json",
        authorization: `token ${token}`,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new GithubRequestError(method, url, res.status, body);
    }
    return res.json();
  };

const createRunGit =
  (cwd: string): RunGit =>
  (args, options) => {
    const result = spawnSync("git", args, {
      cwd,
      encoding: "utf8",
      env: options?.env ? { ...process.env, ...options.env } : undefined,
    });
    if (result.error) throw result.error;
    return { status: result.status, stdout: result.stdout };
  };

const printError = (message: string, error: unknown): void => {
  console.error(message);
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
};

const createGithubDependencies = (
  token: string,
  cwd: string,
): GithubDependencies => ({
  request: createGithubRequest(token),
  git: createRunGit(cwd),
  log: (message) => {
    console.log(message);
  },
  warn: (message) => {
    console.warn(message);
  },
  printError,
});

const runGitOrThrow = (git: RunGit, args: string[]): void => {
  const result = git(args);
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} exited with ${String(result.status)}`,
    );
  }
};

export const configureProtectionRule = async (
  info: GithubRepositoryInfo,
  deps: GithubDependencies,
): Promise<void> => {
  if (!info.ciEnabled) return;
  if (info.ciContexts.length === 0) {
    deps.warn("No ci contexts: branch protection not configured");
    return;
  }

  for (const branch of ["main", "master"]) {
    try {
      const result = deps.git(["ls-remote", "--heads", "origin", branch]);
      const branchExists = result.status === 0 && result.stdout.trim() !== "";
      if (branchExists) {
        await deps.request(
          "PUT",
          `repos/${info.owner}/${info.repo}/branches/${branch}/protection`,
          {
            required_status_checks: {
              strict: false,
              contexts: info.ciContexts,
            },
            enforce_admins: false,
            required_pull_request_reviews: null,
            restrictions: null,
            required_linear_history: true,
            allow_force_pushes: true,
            allow_deletions: false,
          },
        );
        if (branch === "master") {
          deps.warn('You should rename your "master" branch to "main"');
        }
      } else if (branch === "main") {
        throw new Error(`Branch ${branch} does not exist`);
      }
    } catch (error) {
      if (branch === "main") {
        deps.printError(
          `Failed to configure ${branch} branch protection`,
          error,
        );
      }
    }
  }
};

export const syncRepository = async (
  info: GithubRepositoryInfo,
  deps: GithubDependencies,
): Promise<void> => {
  try {
    await deps.request("PATCH", `repos/${info.owner}/${info.repo}`, {
      name: info.repo,
      description: info.description,
      ...githubRepoConfig,
    });
  } catch (error) {
    deps.printError(
      `Failed to sync github repository ${info.owner}/${info.repo}`,
      error,
    );
  }
};

/**
 * Runs a step of the repository setup, printing which step failed and what to
 * run by hand instead of stopping the run.
 */
const runSetupStep = (
  deps: GithubDependencies,
  description: string,
  manualCommand: string,
  fn: () => void,
): boolean => {
  try {
    fn();
    return true;
  } catch (error) {
    deps.printError(
      `Failed to ${description}. Run by hand: ${manualCommand}`,
      error,
    );
    return false;
  }
};

/** Creates the repository, commits what pob generated, pushes, protects. */
export const createRepository = async (
  info: GithubRepositoryInfo,
  deps: GithubDependencies,
): Promise<void> => {
  const { owner, repo } = info;
  try {
    const user = (await deps.request("GET", "user")) as { login: string };
    const isOrganization = user.login.toLowerCase() !== owner.toLowerCase();
    await deps.request(
      "POST",
      isOrganization ? `orgs/${owner}/repos` : "user/repos",
      {
        name: repo,
        description: info.description,
        homepage: null,
        // only projects with an open source license are public: making a
        // pushed public repository private does not undo its exposure
        private: !info.license || info.license === "UNLICENSED",
        auto_init: false,
        ...githubRepoConfig,
      },
    );
  } catch (error) {
    if (!(error instanceof GithubRequestError) || error.status !== 422) {
      deps.printError(
        `Failed to create github repository ${owner}/${repo}: nothing was committed or pushed`,
        error,
      );
      return;
    }
    deps.warn(
      `github repository ${owner}/${repo} already exists, syncing its settings`,
    );
    await syncRepository(info, deps);
  }

  const hasCommit = deps.git(["rev-parse", "--verify", "HEAD"]).status === 0;
  if (!hasCommit) {
    const committed = runSetupStep(
      deps,
      "create the initial commit",
      'git add --all . && git commit -m "chore: initial commit [skip ci]"',
      () => {
        runGitOrThrow(deps.git, ["add", "--all", "."]);
        // generated files are already formatted by pob, and hooks may need
        // tools not installed yet
        const result = deps.git(
          ["commit", "-m", "chore: initial commit [skip ci]"],
          { env: { POB_GIT_HOOKS: "0" } },
        );
        if (result.status !== 0) throw new Error("git commit failed");
      },
    );
    if (!committed) return;
  }

  const pushed = runSetupStep(
    deps,
    "push to github",
    "git branch -M main && git push -u origin main",
    () => {
      runGitOrThrow(deps.git, ["branch", "-M", "main"]);
      runGitOrThrow(deps.git, ["push", "-u", "origin", "main"]);
    },
  );
  if (!pushed) return;

  await configureProtectionRule(info, deps);
};

const getToken = (info: GithubRepositoryInfo, setup: boolean): string => {
  const token = readGithubToken();
  if (token) return token;
  if (setup) {
    console.warn(
      `Missing POB_GITHUB_TOKEN: the github repository ${info.owner}/${info.repo} was not created, nothing was committed or pushed. ${MISSING_TOKEN_HELP}`,
    );
  } else if (process.env.CI !== "true") {
    console.warn(
      `Missing POB_GITHUB_TOKEN: github repository settings not synced. ${MISSING_TOKEN_HELP}`,
    );
  }
  return "";
};

/** Every effect a monorepo or standalone setup can plan before the commit */
const effectsBeforeInitialCommit = [
  "install",
  "dedupe",
  "build",
  "yarn-sdks",
  "git-untrack-build",
  "git-init",
  "git-remote-add",
  "codemods:oxlint-only",
  "vscode-tsdk-chmod",
];

const planGithubSetup = (
  ctx: PackageContext,
  info: GithubRepositoryInfo,
): void => {
  ctx.effects.add({
    id: "github-setup",
    reason: `no origin remote: create the github repository ${info.owner}/${info.repo}, commit and push`,
    after: effectsBeforeInitialCommit,
    run: async ({ cwd }) => {
      const token = getToken(info, true);
      if (!token) return;
      await createRepository(info, createGithubDependencies(token, cwd));
    },
  });
};

const planGithubSync = (
  ctx: PackageContext,
  info: GithubRepositoryInfo,
): void => {
  ctx.effects.add({
    id: "github-sync",
    reason: `sync the settings and branch protection of ${info.owner}/${info.repo}`,
    run: async ({ cwd }) => {
      const token = getToken(info, false);
      if (!token) return;
      const deps = createGithubDependencies(token, cwd);
      deps.log("sync github info");
      await syncRepository(info, deps);
      await configureProtectionRule(info, deps);
    },
  });
};

/**
 * The github repository: created when there is no origin remote, its settings
 * synced on every update otherwise. The sync is not planned with --check: it
 * changes nothing in the repository and would make every check fail.
 */
export const githubStep = defineStep<PackageContext>({
  name: "github",
  when: (ctx) => ctx.facts.isRoot,
  reads: ["pkg.description", "pkg.license", "ci.contexts"],
  run: (ctx) => {
    const repository = getGitRepository(ctx, { warn: false });
    if (repository.gitHost !== "github") return;
    const info: GithubRepositoryInfo = {
      owner: repository.gitHostAccount,
      repo: repository.repoName,
      description: ctx.pkg.get<string>("description"),
      license: ctx.pkg.get<string>("license"),
      ciEnabled: !!ctx.config.project.ci,
      ciContexts: ctx.model("ci").get<string[]>("contexts") ?? [],
    };
    if (!repository.hasOriginRemote) {
      planGithubSetup(ctx, info);
    } else if (!ctx.options.check) {
      planGithubSync(ctx, info);
    }
  },
});
