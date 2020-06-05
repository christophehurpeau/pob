/* eslint-disable camelcase */

'use strict';

const gh = require('gh-got');
const got = require('got');
const Generator = require('yeoman-generator');
// const packageUtils = require('../../../../../utils/package');

const GITHUB_TOKEN = process.env.POB_GITHUB_TOKEN;
const CIRCLECI_TOKEN = process.env.POB_CIRCLECI_TOKEN;

const configureProtectionRule = async (owner, repo) => {
  try {
    await gh.put(`repos/${owner}/${repo}/branches/master/protection`, {
      token: GITHUB_TOKEN,
      body: {
        required_status_checks: {
          strict: false,
          contexts: [
            'build (10.x)',
            'build (12.x)',
            'build (14.x)',
            'reviewflow',
          ],
        },
        enforce_admins: false, // true,
        required_pull_request_reviews: null,
        restrictions: null,
        required_linear_history: true,
        allow_force_pushes: true, // false
        allow_deletions: false,
      },
    });
  } catch (err) {
    console.error('Failed to configure master branch protection');
    console.error(err.stack || err.message || err);
  }
};

module.exports = class GitHubGenerator extends Generator {
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
      console.error(
        'Missing POB_GITHUB_TOKEN. Create one with https://github.com/settings/tokens/new?scopes=repo&description=POB%20Generator and add it in your env variables.',
      );
      process.exit(1);
    }

    if (!CIRCLECI_TOKEN) {
      console.error(
        'Missing POB_CIRCLECI_TOKEN. Create one with https://circleci.com/account/api and add it in your env variables.',
      );
      process.exit(1);
    }
  }

  async end() {
    const owner = this.options.gitHostAccount;
    const repo = this.options.repoName;

    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (this.options.shouldCreate) {
      try {
        if (this.options.shouldCreate) {
          try {
            await gh('user/repos', {
              token: GITHUB_TOKEN,
              body: {
                name: pkg.name,
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
        this.spawnCommandSync('git', ['add', '--all', '.'], { cwd });
        this.spawnCommandSync(
          'git',
          ['commit', '-m', 'chore: initial commit [skip ci]'],
          { cwd },
        );
        this.spawnCommandSync('git', ['push', '-u', 'origin', 'master'], {
          cwd,
        });

        configureProtectionRule(owner, repo);

        if (this.fs.exists('.circleci/config.yml')) {
          try {
            await got
              .post(
                `https://circleci.com/api/v1.1/project/github/${owner}/${repo}/follow`,
                { query: { 'circle-token': CIRCLECI_TOKEN } },
              )
              .json();

            try {
              const result = await got
                .get(
                  `https://circleci.com/api/v1.1/project/github/${owner}/${repo}/checkout-key`,
                  {
                    query: { 'circle-token': CIRCLECI_TOKEN },
                    json: { type: 'deploy-key' },
                  },
                )
                .json();
              const deployKey = result && result.body && result.body[0];
              if (!deployKey) throw new Error('Invalid deploy key');
              const publicKey = deployKey.public_key.replace('\\n', '').trim();
              if (!publicKey) throw new Error('Invalid deploy key');

              await gh.post(`repos/${owner}/${repo}/keys`, {
                title: 'CircleCI Writable',
                key: publicKey,
                read_only: false,
              });
            } catch (err) {
              console.error('Failed to create writable circleci key on github');
              console.error(err.stack || err.message || err);
            }
          } catch (err) {
            console.error('Failed to configure circleci');
            console.error(err.stack || err.message || err);
          }
        }

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
        token: GITHUB_TOKEN,
        body: {
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
};
