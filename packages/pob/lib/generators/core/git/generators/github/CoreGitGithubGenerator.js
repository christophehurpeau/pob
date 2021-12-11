/* eslint-disable camelcase */

import got from 'got';
import Generator from 'yeoman-generator';
// const packageUtils = require('../../../../../utils/package');

const GITHUB_TOKEN = process.env.POB_GITHUB_TOKEN;

const gh = got.extend({
  prefixUrl: 'https://api.github.com/',
  responseType: 'json',
  resolveBodyOnly: true,
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
});

const configureProtectionRule = async (owner, repo) => {
  for (const branch of ['main', 'master']) {
    try {
      await gh.put(`repos/${owner}/${repo}/branches/${branch}/protection`, {
        json: {
          required_status_checks: {
            strict: false,
            contexts: ['build (14.x)', 'build (16.x)', 'reviewflow'],
          },
          enforce_admins: false, // true,
          required_pull_request_reviews: null,
          restrictions: null,
          required_linear_history: true,
          allow_force_pushes: true, // false
          allow_deletions: false,
        },
      });
      if (branch === 'master') {
        console.warn('You should rename your "master" branch to "main"');
      }
    } catch (err) {
      if (branch === 'main') {
        console.error(`Failed to configure ${branch} branch protection`);
        console.error(err.stack || err.message || err);
      }
    }
  }
};

export default class CoreGitGithubGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('shouldCreate', {
      type: Boolean,
      required: false,
      defaults: '',
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

    if (!GITHUB_TOKEN) {
      throw new Error(
        'Missing POB_GITHUB_TOKEN. Create one with https://github.com/settings/tokens/new?scopes=repo&description=POB%20Generator and add it in your env variables.',
      );
    }
  }

  async end() {
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
            await gh.post('user/repos', {
              json: {
                name,
                description: pkg.description,
                homepage: null,
                private: false,
                auto_init: false,
                allow_squash_merge: true,
                allow_merge_commit: false,
                allow_rebase_merge: true,
              },
            });
          } catch (err) {
            console.error('Failed to create repository');
            console.error(err.stack || err.message || err);
          }
        }

        const cwd = this.destinationPath();
        try {
          this.spawnCommandSync('git', ['add', '--all', '.'], { cwd });
        } catch (err) {
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
          console.error(err.stack || err.message || err);
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

        configureProtectionRule(owner, repo);

        // await gh.put(`/repos/${owner}/${repo}/topics`, {
        //   names: pkg.keywords,
        // });
      } catch (err) {
        console.error('Failed to create github repository');
        console.error(err.stack || err.message || err);
      }
    } else {
      console.log('sync github info');
      await gh.post(`repos/${owner}/${repo}`, {
        json: {
          name: repo,
          /* pkg.name
            .replace(/-(lerna|monorepo)$/, '')
            .replace(/^@([^-]*)-/, '$1-') */
          description: pkg.description,
          // homepage: null,
          allow_squash_merge: true,
          allow_merge_commit: false,
          allow_rebase_merge: true,
        },
      });

      configureProtectionRule(owner, repo);
    }
  }
}
