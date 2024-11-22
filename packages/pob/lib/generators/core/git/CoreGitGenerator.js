import remoteUrl from "git-remote-url";
import githubUsername from "github-username";
import Generator from "yeoman-generator";
import * as packageUtils from "../../../utils/package.js";

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
  }

  async initializing() {
    let originUrl = await remoteUrl(this.destinationPath(), "origin").catch(
      () => "",
    );

    if (!originUrl) {
      const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
      originUrl = pkg.repository;
    }

    this.originUrl = originUrl;
    const match =
      originUrl &&
      typeof originUrl === "string" &&
      originUrl.match(
        /^(?:git@|https?:\/\/)(?:([^./:]+)(?:\.com)?[/:])?([^/:]+)\/([^./:]+)(?:.git)?/,
      );
    if (!match) return;
    const [, gitHost, gitAccount, repoName] = match;
    this.gitHost = gitHost || "github";
    this.gitHostAccount = gitAccount;
    if (repoName !== "undefined") {
      this.repoName = repoName;
    }
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
        default: this.gitHost || (this.originUrl ? "none" : "github"),
        choices: [
          { value: "none", name: !this.originUrl ? "none" : "don't change" },
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
      });
    }
  }

  writing() {
    console.log("git: writing");

    if (this.gitHost === "none") {
      return;
    }

    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {});
    const repoName = this.repoName || this.options.name || pkg.name;

    if (!pkg.homepage && this.gitHostAccount) {
      pkg.homepage = `https://${this.gitHost}.com/${this.gitHostAccount}/${repoName}`;
    }

    const repository = `https://${this.gitHost}.com/${this.gitHostAccount}/${repoName}.git`;

    if (pkg.repository !== repository) {
      pkg.repository = repository;
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);

    const cwd = this.destinationPath();

    this.initGitRepository =
      this.spawnCommandSync("git", ["status"], {
        cwd,
        stdio: "ignore",
        reject: false,
      }).status === 128;
    if (this.initGitRepository) {
      this.spawnCommandSync("git", ["init"], { cwd });

      if (!this.originUrl) {
        let repoSSH = pkg.repository;
        if (pkg.repository && !pkg.repository.includes(".git")) {
          /* this.spawnCommandSync('curl', [
                        '--silent',
                        '--write-out',
                        '"%{http_code}"',
                        '--output',
                        '/dev/null',
                        '-i',
                        '-u',
                        this.options.githubAccount,
                        `-d "{"name": "${this.options.name}", "auto_init": true}`,
                        'https://api.github.com/user/repos',
                    ], { cwd }); */

          repoSSH = pkg.repository;
        }

        this.spawnCommandSync("git", ["remote", "add", "origin", repoSSH], {
          cwd,
        });
      }
    }
  }
}
