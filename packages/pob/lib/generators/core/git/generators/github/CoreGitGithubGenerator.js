/* oxlint-disable eslint-js/camelcase */

import { spawnSync } from "node:child_process";
import * as os from "node:os";
import Generator from "yeoman-generator";
import { getRepoName } from "../../../../../utils/git.js";
import { ciContexts } from "../../../ci/CoreCIGenerator.js";

const readTokenFromKeychain = () => {
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

const GITHUB_TOKEN = process.env.POB_GITHUB_TOKEN || readTokenFromKeychain();

const MISSING_TOKEN_HELP =
  'Create a token with https://github.com/settings/tokens/new?scopes=repo&description=POB%20Generator and set it in the POB_GITHUB_TOKEN env variable, or store it in the macOS keychain with: security add-generic-password -s pob-github-token -a "$USER" -w';

class GithubRequestError extends Error {
  constructor(method, url, status, body) {
    super(`${method} ${url} failed with status ${status}: ${body}`);
    this.name = "GithubRequestError";
    this.status = status;
  }
}

const githubRequest = async (method, url, jsonBody) => {
  const res = await fetch(`https://api.github.com/${url}`, {
    method,
    body: jsonBody === undefined ? undefined : JSON.stringify(jsonBody),
    headers: {
      accept: "application/vnd.github+json",
      authorization: `token ${GITHUB_TOKEN}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GithubRequestError(method, url, res.status, body);
  }
  return res.json();
};

const printError = (message, error) => {
  console.error(message);
  console.error(error.stack || error.message || error);
};

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

export default class CoreGitGithubGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("shouldCreate", {
      type: Boolean,
      required: false,
      default: "",
      description: "Should create the repo on github",
    });

    this.option("gitHostAccount", {
      type: String,
      required: true,
      description: "host account",
    });

    this.option("repoName", {
      type: String,
      required: false,
      description: "repo name, computed from the package name when missing",
    });

    this.option("onlyLatestLTS", {
      type: Boolean,
      required: true,
      description: "only latest lts",
    });

    this.option("splitCIJobs", {
      type: Boolean,
      required: true,
      description: "split CI jobs for faster result",
    });

    this.option("ciEnabled", {
      type: Boolean,
      required: true,
      description: "ci enabled",
    });
  }

  async configureProtectionRule(owner, repo) {
    if (!this.options.ciEnabled) return;
    if (ciContexts.length === 0) {
      console.warn("No ci contexts: branch protection not configured");
      return;
    }

    const cwd = this.destinationPath();

    for (const branch of ["main", "master"]) {
      try {
        const result = this.spawnSync(
          "git",
          ["ls-remote", "--heads", "origin", branch],
          { cwd, stdio: "pipe", reject: false },
        );

        const isBranchExists =
          result.exitCode === 0 && result.stdout.toString().trim() !== "";

        if (isBranchExists) {
          await githubRequest(
            "PUT",
            `repos/${owner}/${repo}/branches/${branch}/protection`,
            {
              required_status_checks: {
                strict: false,
                contexts: ciContexts,
              },
              enforce_admins: false, // true,
              required_pull_request_reviews: null,
              restrictions: null,
              required_linear_history: true,
              allow_force_pushes: true, // false
              allow_deletions: false,
            },
          );
          if (branch === "master") {
            console.warn('You should rename your "master" branch to "main"');
          }
        } else if (branch === "main") {
          throw new Error(`Branch ${branch} does not exist`);
        }
      } catch (error) {
        if (branch === "main") {
          printError(`Failed to configure ${branch} branch protection`, error);
        }
      }
    }
  }

  /**
   * Runs a step of the repository setup, printing which step failed and what
   * to run by hand instead of stopping the run.
   */
  runStep(description, manualCommand, fn) {
    try {
      fn();
      return true;
    } catch (error) {
      printError(
        `Failed to ${description}. Run by hand: ${manualCommand}`,
        error,
      );
      return false;
    }
  }

  async createRepository(owner, repo, pkg) {
    const cwd = this.destinationPath();

    try {
      const user = await githubRequest("GET", "user");
      const isOrganization = user.login.toLowerCase() !== owner.toLowerCase();
      await githubRequest(
        "POST",
        isOrganization ? `orgs/${owner}/repos` : "user/repos",
        {
          name: repo,
          description: pkg.description,
          homepage: null,
          // only projects with an open source license are public: making a
          // pushed public repository private does not undo its exposure
          private: !pkg.license || pkg.license === "UNLICENSED",
          auto_init: false,
          ...githubRepoConfig,
        },
      );
    } catch (error) {
      if (error.status !== 422) {
        printError(
          `Failed to create github repository ${owner}/${repo}: nothing was committed or pushed`,
          error,
        );
        return;
      }
      console.warn(
        `github repository ${owner}/${repo} already exists, syncing its settings`,
      );
      await this.syncRepository(owner, repo, pkg);
    }

    const hasCommit =
      this.spawnSync("git", ["rev-parse", "--verify", "HEAD"], {
        cwd,
        stdio: "ignore",
        reject: false,
      }).exitCode === 0;

    if (!hasCommit) {
      const committed = this.runStep(
        "create the initial commit",
        'git add --all . && git commit -m "chore: initial commit [skip ci]"',
        () => {
          this.spawnSync("git", ["add", "--all", "."], { cwd });
          // generated files are already formatted by pob, and hooks may need
          // tools not installed yet
          this.spawnSync(
            "git",
            ["commit", "-m", "chore: initial commit [skip ci]"],
            { cwd, env: { POB_GIT_HOOKS: "0" } },
          );
        },
      );
      if (!committed) return;
    }

    const pushed = this.runStep(
      "push to github",
      "git branch -M main && git push -u origin main",
      () => {
        this.spawnSync("git", ["branch", "-M", "main"], { cwd });
        this.spawnSync("git", ["push", "-u", "origin", "main"], { cwd });
      },
    );
    if (!pushed) return;

    await this.configureProtectionRule(owner, repo);
  }

  async syncRepository(owner, repo, pkg) {
    try {
      await githubRequest("PATCH", `repos/${owner}/${repo}`, {
        name: repo,
        description: pkg.description,
        ...githubRepoConfig,
      });
    } catch (error) {
      printError(`Failed to sync github repository ${owner}/${repo}`, error);
    }
  }

  async end() {
    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
    const owner = this.options.gitHostAccount;
    const repo = this.options.repoName || getRepoName(pkg.name);

    if (!GITHUB_TOKEN) {
      if (this.options.shouldCreate) {
        console.warn(
          `Missing POB_GITHUB_TOKEN: the github repository ${owner}/${repo} was not created, nothing was committed or pushed. ${MISSING_TOKEN_HELP}`,
        );
      } else if (process.env.CI !== "true") {
        console.warn(
          `Missing POB_GITHUB_TOKEN: github repository settings not synced. ${MISSING_TOKEN_HELP}`,
        );
      }
      return;
    }

    if (this.options.shouldCreate) {
      await this.createRepository(owner, repo, pkg);
    } else {
      console.log("sync github info");
      await this.syncRepository(owner, repo, pkg);
      await this.configureProtectionRule(owner, repo);
    }
  }
}
