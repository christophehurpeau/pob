/* eslint-disable camelcase */

import Generator from 'yeoman-generator';
import { ciContexts } from '../../../ci/CoreCIGenerator.js';
// const packageUtils = require('../../../../../utils/package');

const GITHUB_TOKEN = process.env.POB_GITHUB_TOKEN;

const postJson = (url, jsonBody) =>
  fetch(`https://api.github.com/${url}`, {
    method: 'POST',
    body: JSON.stringify(jsonBody),
    headers: {
      authorization: `token ${GITHUB_TOKEN}`,
    },
  }).then((res) => (res.ok ? res.json() : null));

const putJson = (url, jsonBody) =>
  fetch(`https://api.github.com/${url}`, {
    method: 'PUT',
    body: JSON.stringify(jsonBody),
    headers: {
      authorization: `token ${GITHUB_TOKEN}`,
    },
  }).then((res) => (res.ok ? res.json() : null));

const configureProtectionRule = async (owner, repo, onlyLatestLTS) => {
  for (const branch of ['main', 'master']) {
    try {
      await putJson(`repos/${owner}/${repo}/branches/${branch}/protection`, {
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
      });
      if (branch === 'master') {
        console.warn('You should rename your "master" branch to "main"');
      }
    } catch (error) {
      if (branch === 'main') {
        console.error(`Failed to configure ${branch} branch protection`);
        console.error(error.stack || error.message || error);
      }
    }
  }
};

const githubRepoConfig = {
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: true,
  allow_auto_merge: true,
  delete_branch_on_merge: true,
  use_squash_pr_title_as_default: true,
  squash_merge_commit_title: 'PR_TITLE',
  squash_merge_commit_message: 'BLANK',
};

export default class CoreGitGithubGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('shouldCreate', {
      type: Boolean,
      required: false,
      default: '',
      desc: 'Should create the repo on github',
    });

    this.option('gitHostAccount', {
      type: String,
      required: true,
      desc: 'host account',
    });

    this.option('repoName', {
      type: String,
      required: true,
      desc: 'repo name',
    });

    this.option('onlyLatestLTS', {
      type: Boolean,
      required: true,
      desc: 'only latest lts',
    });

    this.option('splitCIJobs', {
      type: Boolean,
      required: true,
      desc: 'split CI jobs for faster result',
    });

    if (!GITHUB_TOKEN && process.env.CI !== 'true') {
      throw new Error(
        'Missing POB_GITHUB_TOKEN. Create one with https://github.com/settings/tokens/new?scopes=repo&description=POB%20Generator and add it in your env variables.',
      );
    }
  }

  async end() {
    if (!GITHUB_TOKEN) return;
    const owner = this.options.gitHostAccount;
    const repo = this.options.repoName;

    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    const name = pkg.name.endsWith('-monorepo')
      ? pkg.name.slice(0, -'-monorepo'.length)
      : pkg.name;

    if (this.options.shouldCreate) {
      try {
        if (this.options.shouldCreate) {
          try {
            await postJson('user/repos', {
              name,
              description: pkg.description,
              homepage: null,
              private: false,
              auto_init: false,
              ...githubRepoConfig,
            });
          } catch (error) {
            console.error('Failed to create repository');
            console.error(error.stack || error.message || error);
          }
        }

        const cwd = this.destinationPath();
        try {
          this.spawnCommandSync('git', ['add', '--all', '.'], { cwd });
        } catch (error) {
          this.spawnCommandSync('git', ['init'], { cwd });
          this.spawnCommandSync('git', ['add', '--all', '.'], { cwd });
          this.spawnCommandSync(
            'git',
            [
              'remote',
              'add',
              'origin',
              `git@github.com:christophehurpeau/${name}.git`,
            ],
            { cwd },
          );
          console.error('Failed to create repository');
          console.error(error.stack || error.message || error);
        }
        this.spawnCommandSync(
          'git',
          ['commit', '-m', 'chore: initial commit [skip ci]'],
          { cwd },
        );
        this.spawnCommandSync('git', ['branch', '-M', 'main'], {
          cwd,
        });
        this.spawnCommandSync('git', ['push', '-u', 'origin', 'main'], {
          cwd,
        });

        configureProtectionRule(owner, repo, this.options.onlyLatestLTS);

        // await gh.put(`/repos/${owner}/${repo}/topics`, {
        //   names: pkg.keywords,
        // });
      } catch (error) {
        console.error('Failed to create github repository');
        console.error(error.stack || error.message || error);
      }
    } else {
      console.log('sync github info');

      await postJson(`repos/${owner}/${repo}`, {
        name: repo,
        /* pkg.name
            .replace(/-(lerna|monorepo)$/, '')
            .replace(/^@([^-]*)-/, '$1-') */
        description: pkg.description,
        // homepage: null,
        ...githubRepoConfig,
      });

      configureProtectionRule(owner, repo, this.options.onlyLatestLTS);
    }
  }
}
