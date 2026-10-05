import remoteUrl from "git-remote-url";
import githubUsername from "github-username";
import Generator from "yeoman-generator";
import { getRepoName, parseRepositoryUrl } from "../../../utils/git.js";
import * as packageUtils from "../../../utils/package.js";

const gitHostDomains = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
};

export default class CoreGitGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("shouldCreate", {
      type: Boolean,
      required: false,
      default: "",
      description: "Should create the repo on github",
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

  async initializing() {
    // the real remote, kept apart from the package.json fallback: only a real
    // remote means the repository already exists
    this.originUrl = await remoteUrl(this.destinationPath(), "origin").catch(
      () => "",
    );

    let repository = parseRepositoryUrl(this.originUrl);

    if (!this.originUrl) {
      const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
      repository = parseRepositoryUrl(pkg.repository);
      if (pkg.repository && !repository) {
        console.warn(
          `git: ignoring invalid repository in package.json: ${JSON.stringify(pkg.repository)}`,
        );
      }
    }

    this.hasRepositoryUrl = !!(this.originUrl || repository);
    if (!repository) return;
    this.gitHost = repository.gitHost;
    this.gitHostAccount = repository.gitAccount;
    this.repoName = repository.repoName;
  }

  async prompting() {
    if (this.options.gitHost) {
      this.gitHost = this.options.gitHost;
      this.gitHostAccount = this.options.gitHostAccount;
    }

    if (this.gitHost) return;

    const { gitHost } = await this.prompt([
      {
        type: "list",
        name: "gitHost",
        message: "Which git host service would you like ?",
        default: this.gitHost || (this.hasRepositoryUrl ? "none" : "github"),
        choices: [
          {
            value: "none",
            name: !this.hasRepositoryUrl ? "none" : "don't change",
          },
          "github",
          "bitbucket",
          "gitlab",
        ],
      },
    ]);

    this.gitHost = gitHost;

    if (!this.gitHostAccount) {
      if (this.gitHost === "github") {
        const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
        const author = packageUtils.parsePkgAuthor(pkg);
        this.gitHostAccount = await githubUsername(author.email).catch(
          () => "",
        );
      }
    }

    if (this.gitHost !== "none") {
      const { gitHostAccount } = await this.prompt({
        name: "gitHostAccount",
        message: "username or organization",
        default: this.gitHostAccount,
      });

      this.gitHostAccount = gitHostAccount;
    }
  }

  default() {
    if (this.gitHost === "github") {
      this.composeWith("pob:core:git:github", {
        shouldCreate: !this.originUrl,
        gitHostAccount: this.gitHostAccount,
        repoName: this.repoName,
        onlyLatestLTS: this.options.onlyLatestLTS,
        splitCIJobs: this.options.splitCIJobs,
        ciEnabled: this.options.ciEnabled,
      });
    }
  }

  writing() {
    console.log("git: writing");

    if (this.gitHost === "none" || !this.gitHostAccount) {
      return;
    }

    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
    const repoName = this.repoName || getRepoName(pkg.name);
    const repositoryUrl = `https://${this.gitHost}.com/${this.gitHostAccount}/${repoName}`;

    // keep a custom homepage, but fix one pointing to another repository on the
    // same host
    const isHomepageInRepository = (homepage) => {
      const lowerHomepage = homepage.toLowerCase();
      const lowerRepositoryUrl = repositoryUrl.toLowerCase();
      return (
        lowerHomepage === lowerRepositoryUrl ||
        lowerHomepage.startsWith(`${lowerRepositoryUrl}/`) ||
        lowerHomepage.startsWith(`${lowerRepositoryUrl}#`)
      );
    };
    if (
      !pkg.homepage ||
      (pkg.homepage.startsWith(`https://${this.gitHost}.com/`) &&
        !isHomepageInRepository(pkg.homepage))
    ) {
      pkg.homepage = repositoryUrl;
    }
    pkg.bugs = { url: `${repositoryUrl}/issues` };

    const repository = `${repositoryUrl}.git`;

    if (pkg.repository !== repository) {
      pkg.repository = repository;
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);

    const cwd = this.destinationPath();

    const isGitRepository =
      this.spawnSync("git", ["rev-parse", "--git-dir"], {
        cwd,
        stdio: "ignore",
        reject: false,
      }).exitCode === 0;
    if (!isGitRepository) {
      this.spawnSync("git", ["init"], { cwd });
    }

    if (!this.originUrl) {
      const remoteHost = gitHostDomains[this.gitHost];
      if (remoteHost) {
        const originSSH = `git@${remoteHost}:${this.gitHostAccount}/${repoName}.git`;
        const { exitCode } = this.spawnSync(
          "git",
          ["remote", "add", "origin", originSSH],
          { cwd, reject: false },
        );
        if (exitCode !== 0) {
          console.warn(
            `git: failed to add origin, run by hand: git remote add origin ${originSSH}`,
          );
        }
      }
    }
  }
}
