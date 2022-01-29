# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [9.15.0](https://github.com/christophehurpeau/pob/compare/pob@9.14.1...pob@9.15.0) (2022-01-29)


### Bug Fixes

* **deps:** update dependency @yarnpkg/parsers to v2.5.0-rc.10 ([#1182](https://github.com/christophehurpeau/pob/issues/1182)) ([4d3c5b4](https://github.com/christophehurpeau/pob/commit/4d3c5b4ef731cb1cb059f81494b4e0eda3778f80))


### Features

* **pob:** update exported cjs extension ([47e7031](https://github.com/christophehurpeau/pob/commit/47e7031af4e83db775f2da607a299c5b896da89b))
* support codecov for apps ([741380b](https://github.com/christophehurpeau/pob/commit/741380b0fd9acfcb0b21e4c98fd4111cff692cbf))
* **deps:** update dependency eslint to v8.8.0 ([#1186](https://github.com/christophehurpeau/pob/issues/1186)) ([14f9e44](https://github.com/christophehurpeau/pob/commit/14f9e4460257392979383b264af4499a4ae24dc5))





## [9.14.1](https://github.com/christophehurpeau/pob/compare/pob@9.14.0...pob@9.14.1) (2022-01-22)


### Bug Fixes

* **pob:** vscode generator monorepo option ([cb589e8](https://github.com/christophehurpeau/pob/commit/cb589e80168eaf114a5b22bc4e454ec59d449097))
* **pob:** vscode generator tsdk path for monorepo ([fc92541](https://github.com/christophehurpeau/pob/commit/fc92541f5926a6892186c086940c966420e4ef83))





# [9.14.0](https://github.com/christophehurpeau/pob/compare/pob@9.13.2...pob@9.14.0) (2022-01-20)


### Bug Fixes

* **deps:** update dependency @yarnpkg/parsers to v2.5.0-rc.9 ([#1165](https://github.com/christophehurpeau/pob/issues/1165)) ([bdb496f](https://github.com/christophehurpeau/pob/commit/bdb496febb6ec534a0ca0ac24cb32fe16b639e79))
* full vscode workspace config ([f3aa63d](https://github.com/christophehurpeau/pob/commit/f3aa63de6cc2b597c3114eb34757e94347cf5f3f))
* remove tasks from workspace config ([cc4b1a7](https://github.com/christophehurpeau/pob/commit/cc4b1a7efe39e2d7f13ac3079a32c58d3cd86c75))


### Features

* **deps:** update dependency eslint to v8.7.0 ([#1164](https://github.com/christophehurpeau/pob/issues/1164)) ([9ec0c31](https://github.com/christophehurpeau/pob/commit/9ec0c3156cf5ed5d1f9e3e4ce4636b77da826850))
* **pob:** generate vscode monorepo workspace ([23ceaae](https://github.com/christophehurpeau/pob/commit/23ceaae63bc1abc58061366d90f8cd5c397bf232))





## [9.13.2](https://github.com/christophehurpeau/pob/compare/pob@9.13.1...pob@9.13.2) (2022-01-15)


### Bug Fixes

* **@pob/root:** fix use default github token for gh-pages workflow ([784ce66](https://github.com/christophehurpeau/pob/commit/784ce6633d5d5d14cdcf63aeb5a83ed036434673))





## [9.13.1](https://github.com/christophehurpeau/pob/compare/pob@9.13.0...pob@9.13.1) (2022-01-15)


### Bug Fixes

* **pob:** multiple newlines in gitignore template ([f00c5be](https://github.com/christophehurpeau/pob/commit/f00c5bed9a6200d3ded4737ffcdab175eb56b2c5))





# [9.13.0](https://github.com/christophehurpeau/pob/compare/pob@9.12.3...pob@9.13.0) (2022-01-15)


### Bug Fixes

* disable gh-pages for apps ([0f935ff](https://github.com/christophehurpeau/pob/commit/0f935ff24207ebe782bb7f0a2f75372ab87ac240))
* **deps:** update dependency @pob/eslint-config-typescript-react to v48.0.7 ([#1153](https://github.com/christophehurpeau/pob/issues/1153)) ([b96b1c4](https://github.com/christophehurpeau/pob/commit/b96b1c4497529772b58e18c04b6b19020bb4931f))
* **deps:** update dependency @yarnpkg/parsers to v2.5.0-rc.8 ([#1155](https://github.com/christophehurpeau/pob/issues/1155)) ([4a01d49](https://github.com/christophehurpeau/pob/commit/4a01d4929b0b6ae0d19494e478357a6d7bf4acb6))
* **pob:** add @babel/core when pkg has peer dependency ([acd04cb](https://github.com/christophehurpeau/pob/commit/acd04cbc77c914af56db8b83734d187cc926f4e4))
* **pob:** extraEntries for pkg.type === "module" ([2fae75c](https://github.com/christophehurpeau/pob/commit/2fae75cdf6ee5678f436d11a15f02bd22f1a9c66))
* **pob:** remove /private_key in gitignore ([368d819](https://github.com/christophehurpeau/pob/commit/368d8193d638ec41a7caa7a46e9cbcd6607dcaf2))


### Features

* generate documentation and coverage on gh-pages ([32e4801](https://github.com/christophehurpeau/pob/commit/32e4801e8a4d1ff221a7fe63d42c6fe52d46f796))





## [9.12.3](https://github.com/christophehurpeau/pob/compare/pob@9.12.2...pob@9.12.3) (2022-01-02)


### Bug Fixes

* remove legacy .yarn/build-state.yml ([b625bab](https://github.com/christophehurpeau/pob/commit/b625bab16caa53342fdcbf1961b73446cdfd2541))





## [9.12.2](https://github.com/christophehurpeau/pob/compare/pob@9.12.1...pob@9.12.2) (2022-01-02)


### Bug Fixes

* **pob:** stop ci testing on node 14 on app projects ([c775697](https://github.com/christophehurpeau/pob/commit/c77569741136dc3feefcdc61f666092751be944c))





## [9.12.1](https://github.com/christophehurpeau/pob/compare/pob@9.12.0...pob@9.12.1) (2022-01-02)


### Bug Fixes

* set globalEslint default to true ([8d7d3d5](https://github.com/christophehurpeau/pob/commit/8d7d3d5917b340b901b565a23356b21939059cb8))
* use cjs for default main for jest which doesnt supports exports yet ([f97c897](https://github.com/christophehurpeau/pob/commit/f97c8972b35032078f4603d788b4a3e637d61637))





# [9.12.0](https://github.com/christophehurpeau/pob/compare/pob@9.11.0...pob@9.12.0) (2022-01-01)


### Features

* **pob:** update release-please version ([8091222](https://github.com/christophehurpeau/pob/commit/80912226fedb9eb5e25936f2c9f4a719bf9605e9))





# [9.11.0](https://github.com/christophehurpeau/pob/compare/pob@9.10.0...pob@9.11.0) (2022-01-01)


### Bug Fixes

* **pob:** legacy pkg.main cjs ([04dc5e2](https://github.com/christophehurpeau/pob/commit/04dc5e22e77b7383660b3bc62516d884670cf25a))
* force package type module when lerna and root is module ([c8e89a8](https://github.com/christophehurpeau/pob/commit/c8e89a8d04936ea7035d86a646437ba74e54146b))
* **deps:** update dependency @yarnpkg/parsers to v2.5.0-rc.7 ([#1148](https://github.com/christophehurpeau/pob/issues/1148)) ([8da56d4](https://github.com/christophehurpeau/pob/commit/8da56d4c1576908570c16da89caebad87a50c473))
* **pob:** monorepo react testing detection ([3f95cbf](https://github.com/christophehurpeau/pob/commit/3f95cbf667f624301aab82a88080c526507fe662))
* **pob:** test babel config with react ([726b954](https://github.com/christophehurpeau/pob/commit/726b95400eeef042bb22cafd1f4cdec23e0008df))
* package main when only esm is used ([b02684f](https://github.com/christophehurpeau/pob/commit/b02684f03a7bdf5875ac4919aa69df6b4993532f))


### Features

* **deps:** update dependency eslint to v8.6.0 ([#1152](https://github.com/christophehurpeau/pob/issues/1152)) ([004bf4f](https://github.com/christophehurpeau/pob/commit/004bf4f78e200606813498ee4f211ed06fec659f))





# [9.10.0](https://github.com/christophehurpeau/pob/compare/pob@9.9.1...pob@9.10.0) (2021-12-26)


### Features

* **deps:** update dependency mem-fs-editor to v9.4.0 ([#992](https://github.com/christophehurpeau/pob/issues/992)) ([692888b](https://github.com/christophehurpeau/pob/commit/692888bfb3546028f6cf86c58bd8cf2efecfbf71))





## [9.9.1](https://github.com/christophehurpeau/pob/compare/pob@9.9.0...pob@9.9.1) (2021-12-19)


### Bug Fixes

* **pob:** add missing workspaces plugin when needed ([f3759c3](https://github.com/christophehurpeau/pob/commit/f3759c3f9bc34f30a7f72580df85b352fb67fbad))
* **pob:** exports for browser only ([0ede342](https://github.com/christophehurpeau/pob/commit/0ede342c71aefbcad6b037c3bd6ea1ac4eec2a61))
* **pob:** watch command ([e026f52](https://github.com/christophehurpeau/pob/commit/e026f5209d5bc0eb81ce766bbc8b7e5f62abe4b7))





# [9.9.0](https://github.com/christophehurpeau/pob/compare/pob@9.8.0...pob@9.9.0) (2021-12-18)


### Bug Fixes

* update mem-fs ([8fdf8f7](https://github.com/christophehurpeau/pob/commit/8fdf8f79768ac0ca6e0326e629834657e2992c71))
* **pob:** ci testing check fix ([c8eb2cd](https://github.com/christophehurpeau/pob/commit/c8eb2cdf000766699e5590aebcc55e1c23d15700))
* coverage is a documentation ([cfde873](https://github.com/christophehurpeau/pob/commit/cfde8733ef340dd097143acb66e9acd87e69fbbe))
* defaults for readJSON5 method ([2a213b5](https://github.com/christophehurpeau/pob/commit/2a213b545be5e653b4f0a279983ea4cfeaacaa11))
* update legacy yarn2 to node-modules ([d543e5e](https://github.com/christophehurpeau/pob/commit/d543e5ede8273f16fb0416424671c2d1d7c60c73))


### Features

* always use yarn workspaces commands ([83945e0](https://github.com/christophehurpeau/pob/commit/83945e0a2ee07c52ecd1a105e1e7b9749f91b712))
* **deps:** update dependency eslint to v8.5.0 ([#1069](https://github.com/christophehurpeau/pob/issues/1069)) ([46d8538](https://github.com/christophehurpeau/pob/commit/46d85381f97fbd55e424ca8b6f1fc0138900ff7f))





# [9.8.0](https://github.com/christophehurpeau/pob/compare/pob@9.7.4...pob@9.8.0) (2021-12-12)


### Bug Fixes

* **pob:** dont try release-please if release is disabled ([86d6edf](https://github.com/christophehurpeau/pob/commit/86d6edf3e84cf98c0605044e09fb994fb036a3cc))
* sort package after running yarn version update ([b9773f0](https://github.com/christophehurpeau/pob/commit/b9773f0ac08c857b87836cbb2a665557f652bffd))
* **deps:** update @pob/eslint-config to v48.0.6 ([#1137](https://github.com/christophehurpeau/pob/issues/1137)) ([999b411](https://github.com/christophehurpeau/pob/commit/999b411e0e4a1c0a47e3c8f23ca20694ca8f2451))


### Features

* **pob:** add env in app gitignore ([148a02a](https://github.com/christophehurpeau/pob/commit/148a02a9437b638051b384c7bd61ce1195cae8aa))
* allow to configure resolveJsonModule and fix baseUrl in tsconfig for apps ([d68393f](https://github.com/christophehurpeau/pob/commit/d68393f9bf02598aa3638e21d2dc407b9b282d1b))
* **pob:** allow release-please in apps ([6d567c6](https://github.com/christophehurpeau/pob/commit/6d567c6ee49f4faa26d7ab23f042615134681158))
* **pob:** suggest to enable release-please ([f62e46c](https://github.com/christophehurpeau/pob/commit/f62e46c8fd9e5936b10790288b14f516e9d8e6d6))
* conditional publish in release workflow ([162c83e](https://github.com/christophehurpeau/pob/commit/162c83ed7875d7caeaef43169742eef8742825f5))





## [9.7.4](https://github.com/christophehurpeau/pob/compare/pob@9.7.3...pob@9.7.4) (2021-12-12)


### Bug Fixes

* no process.env.POB_GITHUB_TOKEN in ci ([8248c48](https://github.com/christophehurpeau/pob/commit/8248c48441d4c6cfea86367166159444f4711bb8))





## [9.7.3](https://github.com/christophehurpeau/pob/compare/pob@9.7.2...pob@9.7.3) (2021-12-12)

**Note:** Version bump only for package pob





## [9.7.2](https://github.com/christophehurpeau/pob/compare/pob@9.7.1...pob@9.7.2) (2021-12-12)


### Bug Fixes

* **pob:** testing babel condition ([a468640](https://github.com/christophehurpeau/pob/commit/a4686400a2844d8930a77a201dea3d7f5f302384))





## [9.7.1](https://github.com/christophehurpeau/pob/compare/pob@9.7.0...pob@9.7.1) (2021-12-12)


### Bug Fixes

* **pob:** add @ornikar/eslint-configs in dependencies ([0163505](https://github.com/christophehurpeau/pob/commit/0163505eecd7ca39c07dfe6a969184806e3d2630))





# [9.7.0](https://github.com/christophehurpeau/pob/compare/pob@9.6.1...pob@9.7.0) (2021-12-12)


### Bug Fixes

* remove dependency generator-license ([f087175](https://github.com/christophehurpeau/pob/commit/f0871751cbd883b4a7e64f56853da73d1c2daef0))
* remove resolutions in pob ([04940d3](https://github.com/christophehurpeau/pob/commit/04940d36da39cc3771b241ff695b2ad54f28c5d3))
* update generator-license ([ef71b4d](https://github.com/christophehurpeau/pob/commit/ef71b4d2e0cb47736436945e4865df4e8eccd890))
* use lerna version with exact param ([9dd6a5c](https://github.com/christophehurpeau/pob/commit/9dd6a5c8d965cd4af40db3d93e022e6824baf97a))


### Features

* support workspace:* in dependencies ([258a5e8](https://github.com/christophehurpeau/pob/commit/258a5e88ad890f0e2f429d63f8011e8d01c3ebe3))
* update @yarnpkg/parsers ([f778458](https://github.com/christophehurpeau/pob/commit/f778458f8e49f610f52e1111846d9465f54576a6))





## [9.6.1](https://github.com/christophehurpeau/pob/compare/pob@9.6.0...pob@9.6.1) (2021-12-12)


### Bug Fixes

* vscode settings for eslint 8 ([841b0ff](https://github.com/christophehurpeau/pob/commit/841b0ff3cf18b1aed9a070445508128806572680))





# [9.6.0](https://github.com/christophehurpeau/pob/compare/pob@9.5.0...pob@9.6.0) (2021-12-12)


### Bug Fixes

* **pob:** move babel config generator to testing generator and configure for monorepo ([1d2a4e6](https://github.com/christophehurpeau/pob/commit/1d2a4e6f97adae84b8e4e045e36aa10c47913e5f))
* package locations in mongorepo generator ([63e7f62](https://github.com/christophehurpeau/pob/commit/63e7f62e934e6703066ac16ddb4fff7975811295))
* **pob:** dont remove preversion script for pob-dependencies ([f62355d](https://github.com/christophehurpeau/pob/commit/f62355d35ab186a9c680fee4836e4aaa5293d77b))
* **pob:** only add test-setup in ignored build tsconfig when package is not in a monorepo ([dba09fd](https://github.com/christophehurpeau/pob/commit/dba09fdec9a15617274ffe7acdb39c627ba84ab6))
* add missing clean script in apps ([a871c2c](https://github.com/christophehurpeau/pob/commit/a871c2c74386d9af0febf62ae09962ba092f6a29))
* add src/test-setup.ts in build exclude ([118efc9](https://github.com/christophehurpeau/pob/commit/118efc90130d07c1689db1f58ccab7762eefe0dd))
* allow extendable renovate config ([5d9a053](https://github.com/christophehurpeau/pob/commit/5d9a053f0485fa66586fb237b7770f450799c045))
* allow to extends renovate config ([e61b0b7](https://github.com/christophehurpeau/pob/commit/e61b0b792f63e9e938a9172a102089ff9eb3aa2f))
* doesJsCheckPackagesExists should be let ([6aac69f](https://github.com/christophehurpeau/pob/commit/6aac69f1a2eb6df4e98d4289da2e4b245a278e94))
* dont create and delete check-package script in workspace packages ([3398ef5](https://github.com/christophehurpeau/pob/commit/3398ef56a97933149eaea02cea58949cadfc61b2))
* dont delete plugin dependencies in eslint-config-pob ([31fe081](https://github.com/christophehurpeau/pob/commit/31fe08106647624317f277d2e31f820911445532))
* get eslint dependency versions from @pob/eslint-config ([4100cc5](https://github.com/christophehurpeau/pob/commit/4100cc5a342b1cc970f614de99692600f9ec89f9))
* order pob-babel/plugin-run.cjs ([57d6c8b](https://github.com/christophehurpeau/pob/commit/57d6c8bfbcfd756a23f96b436614db8991cf1ed2))
* read vscode tasks file ([436c480](https://github.com/christophehurpeau/pob/commit/436c480d4538b68893b3521573ab50199d63a23e))
* **pob:** esm condition for babel.config.cjs ([6aeb96f](https://github.com/christophehurpeau/pob/commit/6aeb96fd7648484755c595310008b0dff20fa6a4))
* **pob:** global testing config ([fc56a6d](https://github.com/christophehurpeau/pob/commit/fc56a6d28413a8ae2c7a45235f853b5123005c84))


### Features

* configure pob-lcov-reporter for pob monorepo ([e7f40c4](https://github.com/christophehurpeau/pob/commit/e7f40c4dc9a2400e48a1497ac4ea0bdc5f842a15))
* **pob:** add default check-package-dependencies script if it doesnt exists and package type is module ([7e54041](https://github.com/christophehurpeau/pob/commit/7e540417e34d908f06f6263d668f9cbb4d9c7990))
* update eslint 8 and eslint-config-pob ([f881f05](https://github.com/christophehurpeau/pob/commit/f881f05852e00c22a35178979e1425445413ce70))





# [9.5.0](https://github.com/christophehurpeau/pob/compare/pob@9.4.0...pob@9.5.0) (2021-12-11)


### Features

* **pob-babel:** include plugin-run as export ([9a4515d](https://github.com/christophehurpeau/pob/commit/9a4515d26d816df6f257a90647046c7da5d83a16))
* enable global testing in monorepo ([178775b](https://github.com/christophehurpeau/pob/commit/178775bb7fc971bc6a9712b105623508f739ba7b))





# [9.4.0](https://github.com/christophehurpeau/pob/compare/pob@9.3.1...pob@9.4.0) (2021-12-11)


### Features

* monorepo testing generator ([b444042](https://github.com/christophehurpeau/pob/commit/b444042aa5203e4ac7a56a3d93f5a3b98c0fce11))





## [9.3.1](https://github.com/christophehurpeau/pob/compare/pob@9.3.0...pob@9.3.1) (2021-12-11)

**Note:** Version bump only for package pob





# [9.3.0](https://github.com/christophehurpeau/pob/compare/pob@9.2.1...pob@9.3.0) (2021-12-11)


### Bug Fixes

* **pob:** newline in ci workflow ([78652a1](https://github.com/christophehurpeau/pob/commit/78652a1a412e04ab63fdb5ca7139e86f6e6a3dad))


### Features

* **pob:** ci build ([1d1e76b](https://github.com/christophehurpeau/pob/commit/1d1e76b64e81fb08f3c1ea4de26363d162c9a15f))
* **pob:** typescript dom condition ([eecb027](https://github.com/christophehurpeau/pob/commit/eecb027d4415a20dfcc5612082d9b6ee3ad6a205))





## [9.2.1](https://github.com/christophehurpeau/pob/compare/pob@9.2.0...pob@9.2.1) (2021-12-11)


### Bug Fixes

* bring back @babel/core as dev dependency ([9aa52ec](https://github.com/christophehurpeau/pob/commit/9aa52ecf895ac28d216e4957028bb8366c278f00))





# [9.2.0](https://github.com/christophehurpeau/pob/compare/pob@9.1.0...pob@9.2.0) (2021-12-11)


### Features

* **pob:** force global eslint and fix remove plugins on non monorepo ([9c04867](https://github.com/christophehurpeau/pob/commit/9c0486700355e27981f0e1a73d05663a6c1bb16b))





# [9.1.0](https://github.com/christophehurpeau/pob/compare/pob@9.0.0...pob@9.1.0) (2021-12-11)


### Bug Fixes

* **pob:** replace devPlugins by plugins ([ddd0681](https://github.com/christophehurpeau/pob/commit/ddd0681284b5f5e9f851737beb2ec76bd69f01be))


### Features

* move @babel/core to pob-babel dependencies ([3d42287](https://github.com/christophehurpeau/pob/commit/3d422877476b443a2ea6789e0656ce676963451d))
* set rollup as dependencies ([8a3a87b](https://github.com/christophehurpeau/pob/commit/8a3a87bd7c541d92ce63bcf33043fedb2df98d01))





# [9.0.0](https://github.com/christophehurpeau/pob/compare/pob@8.10.1...pob@9.0.0) (2021-12-11)


### Bug Fixes

* **pob:** add try/catch arround build and generate:docs commands ([561f87f](https://github.com/christophehurpeau/pob/commit/561f87f75f2ec90480403432ea4a70090d9962ce))
* **pob:** dont add postinstallDev scripts in monorepo packages ([f993c13](https://github.com/christophehurpeau/pob/commit/f993c13670b6c1a537b2e5731987b407a25c4eb6))
* **pob:** missing clean script when using monorepo ([4a4ac95](https://github.com/christophehurpeau/pob/commit/4a4ac9527af1681606d80e2bf963364ecccb4e81))
* **pob:** use fs.exists before fs.delete ([b2640d1](https://github.com/christophehurpeau/pob/commit/b2640d1545411ffecb90bacd2ad400e19ea815f0))


### Features

* drop node 12 ([2f32308](https://github.com/christophehurpeau/pob/commit/2f32308b06ca74d0deb3355707e3082fa73e25dc))
* **pob:** configure jest to enable esm by default and remove direct dependency to babel-jest ([a789916](https://github.com/christophehurpeau/pob/commit/a78991696c6f7716cb1198ff8a6c36cc1acfa1a9))
* **pob-babel:** stop build dev specific and drop node 12 ([9cb8975](https://github.com/christophehurpeau/pob/commit/9cb897538df6b9c0e3ad3750abacb6ab96113862))


### BREAKING CHANGES

* requires node 14
* **pob-babel:** requires to delete dev exports and requires node 14





## [8.10.1](https://github.com/christophehurpeau/pob/compare/pob@8.10.0...pob@8.10.1) (2021-12-05)


### Bug Fixes

* **pob:** only install release workflow if ci is enabled ([8e2fc45](https://github.com/christophehurpeau/pob/commit/8e2fc45ec5435a149b4580b09ae4636e3dbc0fdf))
* **pob:** start script for apps ([623cfb5](https://github.com/christophehurpeau/pob/commit/623cfb5e5a9af9978b5533962ec7fb3b85035a3b))
* init new monorepo ([7a212de](https://github.com/christophehurpeau/pob/commit/7a212deb2feb480c19b5243a201f31a7b2ce45c3))
* monorepo add ([3ae8bfb](https://github.com/christophehurpeau/pob/commit/3ae8bfb487b8a88b62ad8692789ecdddf01ec376))
* **deps:** update dependency prettier to v2.5.1 ([#1122](https://github.com/christophehurpeau/pob/issues/1122)) ([ba903e3](https://github.com/christophehurpeau/pob/commit/ba903e3c63ff90eab7938d5aecbd9d37fac68293))





# [8.10.0](https://github.com/christophehurpeau/pob/compare/pob@8.9.0...pob@8.10.0) (2021-11-28)


### Bug Fixes

* **pob:** also remove react eslint plugins ([77dc9c5](https://github.com/christophehurpeau/pob/commit/77dc9c564bf8d2622956f23973b5258fa97aed2d))
* **pob:** monorepo typedoc enable tsc skipLibCheck ([87b8e88](https://github.com/christophehurpeau/pob/commit/87b8e88656308cea49994335f1aafcb3eb49121a))
* **pob:** node options when lots of packages ([4829f93](https://github.com/christophehurpeau/pob/commit/4829f9386504c5de4ccc488544c10cf194b0f0f0))
* **pob:** remove deprecated dependency xunit-file ([62d4602](https://github.com/christophehurpeau/pob/commit/62d460276709d6a5630ba3759984910d36a506cc))
* postinstall script for non lerna private packages ([8a3f3a4](https://github.com/christophehurpeau/pob/commit/8a3f3a4143f2595391503d51c31dd9b8157ccc97))


### Features

* **deps:** update dependency prettier to v2.5.0 ([#1114](https://github.com/christophehurpeau/pob/issues/1114)) ([50d4b98](https://github.com/christophehurpeau/pob/commit/50d4b98f8ec76ee8a44e3f01eea882089b1a89e5))





# [8.9.0](https://github.com/christophehurpeau/pob/compare/pob@8.8.2...pob@8.9.0) (2021-11-16)


### Bug Fixes

* **pob:** fixes for @pob/eslint-config ([e84152c](https://github.com/christophehurpeau/pob/commit/e84152c8e2b2c8421d51c9883426646afad49134))
* **pob:** startsWith of undefined ([b0ebc73](https://github.com/christophehurpeau/pob/commit/b0ebc73bb74f4a2c98221b917ec8e159fd5a7c22))


### Features

* **deps:** update @pob/eslint-config to v47 (major) ([#1101](https://github.com/christophehurpeau/pob/issues/1101)) ([e726bf5](https://github.com/christophehurpeau/pob/commit/e726bf5a5baa8631933a5f69dbd3c48f9bf25ca5))





## [8.8.2](https://github.com/christophehurpeau/pob/compare/pob@8.8.1...pob@8.8.2) (2021-11-14)

**Note:** Version bump only for package pob





## [8.8.1](https://github.com/christophehurpeau/pob/compare/pob@8.8.0...pob@8.8.1) (2021-11-14)

**Note:** Version bump only for package pob





# [8.8.0](https://github.com/christophehurpeau/pob/compare/pob@8.7.1...pob@8.8.0) (2021-11-14)


### Features

* release libs using github ([3c09271](https://github.com/christophehurpeau/pob/commit/3c0927168a7bd755311470212a8699a560a52174))





## [8.7.1](https://github.com/christophehurpeau/pob/compare/pob@8.7.0...pob@8.7.1) (2021-11-11)

**Note:** Version bump only for package pob





# [8.7.0](https://github.com/christophehurpeau/pob/compare/pob@8.6.0...pob@8.7.0) (2021-11-11)


### Bug Fixes

* **pob:** add dist and test ignore in lib package ([b38fa8f](https://github.com/christophehurpeau/pob/commit/b38fa8fef42761c765b4af439dc1f7eaebab0fcb))
* **pob:** dont add postinstallscripts in monorepo subpackages ([26fea8a](https://github.com/christophehurpeau/pob/commit/26fea8a7ad464c1a17b2147900a006b5e2cf5ce2))
* **pob:** fix issue when circleci directory doesnt exists ([f75e991](https://github.com/christophehurpeau/pob/commit/f75e991980e474f8b4513cebb0e12eed880ee8e7))
* **pob:** fix update yarn before changing yarnrc config file ([31365e0](https://github.com/christophehurpeau/pob/commit/31365e046e6cc320b76e792d0b7e3ed5c6bdefe4))
* **pob:** sort package also after on end, because yarn changes package file ([d18f904](https://github.com/christophehurpeau/pob/commit/d18f90426b7336a068ac3c979a9cf9666c65235d))
* **pob:** yarnrc.yml diffs due to yarn install modifiying after first load by fs ([aecd272](https://github.com/christophehurpeau/pob/commit/aecd272eb0dbb7caac1465578ae2e628f9e164f1))
* install postinstallDev plugin if necessary ([588a142](https://github.com/christophehurpeau/pob/commit/588a1422bb5effce1bf51e0459df8dee13f21075))
* remove eslint root dependencies when node linker is node-modules ([4e081da](https://github.com/christophehurpeau/pob/commit/4e081da3fdf0e7acf0d23def66ddb85002932666))


### Features

* **deps:** update dependency findup-sync to v5 ([#1086](https://github.com/christophehurpeau/pob/issues/1086)) ([b04a452](https://github.com/christophehurpeau/pob/commit/b04a4524a3ccf3ed750d5c9e23999d8ee56ddc75))
* improve npmignore ([b47706a](https://github.com/christophehurpeau/pob/commit/b47706af4f9be4f8103ec1306879bbd0a6989e6b))
* **pob:** use --parallel --topological-dev with build command and yarn workspaces ([6bc6f33](https://github.com/christophehurpeau/pob/commit/6bc6f33dbd981801eb0eb4f2cfd6963074f7ed9c))





# [8.6.0](https://github.com/christophehurpeau/pob/compare/pob@8.5.0...pob@8.6.0) (2021-10-25)


### Bug Fixes

* **pob:** delete yarn2 in config even if value is false ([f6393fe](https://github.com/christophehurpeau/pob/commit/f6393fee76538d20dd7ac418416fa965bba4cbc0))
* **pob:** dont add any script as main, only "." ([93293e0](https://github.com/christophehurpeau/pob/commit/93293e0916cfbd5a6cf868716a8ff3f74297ef37))
* **pob:** fixes when creating ([9fb72f1](https://github.com/christophehurpeau/pob/commit/9fb72f1e781dffd56dd8d2cc7994c64b44601620))


### Features

* **pob:** set enableMessageName to false in yarn config ([f5d76af](https://github.com/christophehurpeau/pob/commit/f5d76af0ddad1d1831e56c1489d3a3825af5c0c3))





# [8.5.0](https://github.com/christophehurpeau/pob/compare/pob@8.4.3...pob@8.5.0) (2021-09-25)


### Bug Fixes

* **deps:** update dependency prettier to v2.4.1 ([#1044](https://github.com/christophehurpeau/pob/issues/1044)) ([3f827ab](https://github.com/christophehurpeau/pob/commit/3f827abf1972baaaf08a654761fd3e9a9334fef6))


### Features

* **deps:** update @pob/eslint-config to v45.1.0 ([#1031](https://github.com/christophehurpeau/pob/issues/1031)) ([6f00a19](https://github.com/christophehurpeau/pob/commit/6f00a1973943c0c4676726ceae4bbf10da901df0))
* **deps:** update dependency prettier to v2.4.0 ([#1033](https://github.com/christophehurpeau/pob/issues/1033)) ([962a5bb](https://github.com/christophehurpeau/pob/commit/962a5bbd5fc1b6b5b36cf39b8e3265a113e79d92))





## [8.4.3](https://github.com/christophehurpeau/pob/compare/pob@8.4.2...pob@8.4.3) (2021-09-05)


### Bug Fixes

* remove @pob/root in non root packages ([2d1e3c1](https://github.com/christophehurpeau/pob/commit/2d1e3c12aff9ab95aea08bc3860530055d891b58))
* **pob:** add try/catch when running preversion script ([28b5f11](https://github.com/christophehurpeau/pob/commit/28b5f11b6d94d1dfb9056f155902fc5539bd6797))
* **pob:** remove console.log in git generator ([89eb0ef](https://github.com/christophehurpeau/pob/commit/89eb0efd4169c6f49070741913840357f58e4ef8))





## [8.4.2](https://github.com/christophehurpeau/pob/compare/pob@8.4.1...pob@8.4.2) (2021-09-05)

**Note:** Version bump only for package pob





## [8.4.1](https://github.com/christophehurpeau/pob/compare/pob@8.4.0...pob@8.4.1) (2021-09-05)

**Note:** Version bump only for package pob





# [8.4.0](https://github.com/christophehurpeau/pob/compare/pob@8.3.1...pob@8.4.0) (2021-09-05)


### Bug Fixes

* **pob:** also lint cjs and mjs files with eslint ([d9db76c](https://github.com/christophehurpeau/pob/commit/d9db76c29bf1f5aed477c8d0003b8b721afb851d))
* **pob:** define typescript.tsdk even on non pnp yarn ([bebf2d9](https://github.com/christophehurpeau/pob/commit/bebf2d9fb8c24b1a6361c3f82cc7cd26b3c29978))
* **pob:** delete .yarn/sdks when pnp is disabled ([e81a5f6](https://github.com/christophehurpeau/pob/commit/e81a5f630b1fa3b869673d093edf8ead1e090b0b))
* **pob:** only recommend zipfs extension if pnp is enabled ([08ddf19](https://github.com/christophehurpeau/pob/commit/08ddf191169d8c12155ef424330301f9b568cd02))
* **pob:** remove pnp sdks when pnp is disabled ([19a1ffd](https://github.com/christophehurpeau/pob/commit/19a1ffdd957e54e63d9217eafc6507a47455a621))
* **pob:** run prettier after yarn install ([a8a1204](https://github.com/christophehurpeau/pob/commit/a8a1204bae1a083341512962f58037ebf4934ea8))


### Features

* **pob:** update codecov-action to v2 ([f184b51](https://github.com/christophehurpeau/pob/commit/f184b51fd4265164bc9ecf47f97fe4b7da181c7d))





## [8.3.1](https://github.com/christophehurpeau/pob/compare/pob@8.3.0...pob@8.3.1) (2021-09-05)


### Bug Fixes

* **pob:** handle install task manually ([31a350b](https://github.com/christophehurpeau/pob/commit/31a350bbf8310404c32035ccc25565021e45ff86))
* **pob:** rootPackageManager ([5ab38f5](https://github.com/christophehurpeau/pob/commit/5ab38f568de914459d1b277e82a76d7d13b59b3e))
* **pob:** use cd instead of yarn cwd legacy argument ([de7833f](https://github.com/christophehurpeau/pob/commit/de7833f1bbaf7e6de9c37676a1194b1588420c9d))
* **pob:** yarn install and pnp sdk in CoreYarn generator ([8959cea](https://github.com/christophehurpeau/pob/commit/8959cea42f71dfed9b32485c28224cec117e7eb1))
* dont need to install eslint plugins on each package when node linker is node-modules ([af2cdc8](https://github.com/christophehurpeau/pob/commit/af2cdc8cf275bff7f1d5c6c002fbee591a0e0aa4))





# [8.3.0](https://github.com/christophehurpeau/pob/compare/pob@8.2.4...pob@8.3.0) (2021-09-05)


### Bug Fixes

* missing space before args ([4919594](https://github.com/christophehurpeau/pob/commit/4919594b69e79352b32eeb0e651b2bf84b875d55))


### Features

* also enable yarn workspaces command in nightingale-monorepo ([4d7df91](https://github.com/christophehurpeau/pob/commit/4d7df916c75f2e7924c0b0fe21b433dbc98207c2))





## [8.2.4](https://github.com/christophehurpeau/pob/compare/pob@8.2.3...pob@8.2.4) (2021-09-05)


### Bug Fixes

* **pob:** dont delete pob root postinstall script ([ab88179](https://github.com/christophehurpeau/pob/commit/ab88179c88225dbbf5f0ef0ac6461e1ae0577958))
* **pob:** eslint config path in pob eslint monorepo ([240d427](https://github.com/christophehurpeau/pob/commit/240d4277e7d2b55aa03248233fa31fadc6d06788))
* **pob:** eslint install for yarn ([c09afb5](https://github.com/christophehurpeau/pob/commit/c09afb5aac4c121aa6ddde2a6b67584695690b22))
* **pob:** ignore .pnp.* to cover js and cjs ([595a986](https://github.com/christophehurpeau/pob/commit/595a986b47091a810b3767d699f72d3f390395c0))
* **pob:** missing pkg.main when esm is enabled ([af36f58](https://github.com/christophehurpeau/pob/commit/af36f583b315c43cdac3d1214a8d93a1cdf0e892))
* **pob:** monorepo postinstall script ([b714003](https://github.com/christophehurpeau/pob/commit/b714003d18f86091c291b6ebfb4d0504971cb9a3))
* add --immutable-cache when running yarn install on ci or hooks and add fallback to prevent hooks from failing ([1f3f296](https://github.com/christophehurpeau/pob/commit/1f3f2969bb7f551996200c8f04371ded0b779d1e))
* **pob:** type of packageManager option ([d91a23b](https://github.com/christophehurpeau/pob/commit/d91a23ba5beb1f501e2e5eca0644b8d54280fb81))





## [8.2.3](https://github.com/christophehurpeau/pob/compare/pob@8.2.2...pob@8.2.3) (2021-08-10)

**Note:** Version bump only for package pob





## [8.2.2](https://github.com/christophehurpeau/pob/compare/pob@8.2.1...pob@8.2.2) (2021-08-10)

**Note:** Version bump only for package pob





## [8.2.1](https://github.com/christophehurpeau/pob/compare/pob@8.2.0...pob@8.2.1) (2021-08-10)

**Note:** Version bump only for package pob





# [8.2.0](https://github.com/christophehurpeau/pob/compare/pob@8.1.1...pob@8.2.0) (2021-08-10)


### Features

* **deps:** update dependency prettier to v2.3.2 ([#924](https://github.com/christophehurpeau/pob/issues/924)) ([498cdc2](https://github.com/christophehurpeau/pob/commit/498cdc2dac582b3d6582990627cb92f7f1fb24ac))





## [8.1.1](https://github.com/christophehurpeau/pob/compare/pob@8.1.0...pob@8.1.1) (2021-07-11)

**Note:** Version bump only for package pob





# [8.1.0](https://github.com/christophehurpeau/pob/compare/pob@8.0.3...pob@8.1.0) (2021-07-11)


### Bug Fixes

* **pob:** keep setting main field for eslint ([d359bb1](https://github.com/christophehurpeau/pob/commit/d359bb15c68bc7dba9ad4bd9a07d0516d01384b5))


### Features

* use yarn berry by default, add nodeLinker option ([dd69f07](https://github.com/christophehurpeau/pob/commit/dd69f07bea029aff1c3a5f1d22f5981cbbee3539))





## [8.0.3](https://github.com/christophehurpeau/pob/compare/pob@8.0.2...pob@8.0.3) (2021-07-11)


### Bug Fixes

* config for @pob/eslint-config-typescript/node ([8f57ac1](https://github.com/christophehurpeau/pob/commit/8f57ac1099d7b1f1fc25c3f582fb2b7f3926e1ca))





## [8.0.2](https://github.com/christophehurpeau/pob/compare/pob@8.0.1...pob@8.0.2) (2021-07-11)

**Note:** Version bump only for package pob





## [8.0.1](https://github.com/christophehurpeau/pob/compare/pob@8.0.0...pob@8.0.1) (2021-07-11)


### Bug Fixes

* update github required status checks ([be1312e](https://github.com/christophehurpeau/pob/commit/be1312e5e708af0ea6b5f9fd17fd5cfd3704f402))





# [8.0.0](https://github.com/christophehurpeau/pob/compare/pob@7.14.2...pob@8.0.0) (2021-07-11)


### Bug Fixes

* **pob:** better babel config ([4f8a65c](https://github.com/christophehurpeau/pob/commit/4f8a65c41521f7631d2a4ab610fb487dbb14f58a))
* **pob:** move babel.config.js to babel.config.cjs ([e092f74](https://github.com/christophehurpeau/pob/commit/e092f74a39d27c359a53436895bc4009737ba515))
* **pob:** move lint-staged.config.js to lint-staged.config.cjs ([4d6a410](https://github.com/christophehurpeau/pob/commit/4d6a410a525ca15ece8e46a483f1c29b02358506))
* mem-fs dependency ([d9b0862](https://github.com/christophehurpeau/pob/commit/d9b086257a8ecde6fd5bcbc0101d2daa810b240d))
* pob-babel createRollupConfig export ([d3c3ee7](https://github.com/christophehurpeau/pob/commit/d3c3ee797f7ec333e1074b690e2e380c51c78606))
* support no es export ([acbeaa8](https://github.com/christophehurpeau/pob/commit/acbeaa8358125f29a5d334400aa00401e5d0931d))
* **pob:** clean non root package for root stuff ([d8f3f10](https://github.com/christophehurpeau/pob/commit/d8f3f1049d4d84f3ad32724ca75c83196ae151e1))
* **pob:** import lerna-light in pob-monorepo ([24f821c](https://github.com/christophehurpeau/pob/commit/24f821ca415f40bb0d2b57ba8a7d471579d2ac22))


### Features

* adapt for esm modules ([1a61dca](https://github.com/christophehurpeau/pob/commit/1a61dcafefd4f00e4ea98b75fce0404bf2fa6460))
* **pob:** ci matrix use node 16 instead of 15 ([2f44999](https://github.com/christophehurpeau/pob/commit/2f44999bc258e9678e52c7bc95bf00fa89797a43))
* **pob:** support explicit commonjs config for eslint ([cb3d693](https://github.com/christophehurpeau/pob/commit/cb3d69356e5773e42e66cba53d677e42073a7be4))
* change min node supported to ESM supported versions ([9db0319](https://github.com/christophehurpeau/pob/commit/9db031908e73eb08863685f428043dc17b3f08c2))
* **pob:** update min node version to supported ESM ([df73d6b](https://github.com/christophehurpeau/pob/commit/df73d6b38b8533153aa09ddfedbf7c8ffcebe79c))
* **pob:** with eslint 7 no need to specify ext ([68a3d6c](https://github.com/christophehurpeau/pob/commit/68a3d6c619d6ebd36b985888b368923e36fc8d77))
* exports package.json by default ([3549e29](https://github.com/christophehurpeau/pob/commit/3549e29c381ba8381ad1009c01bd363c689d7cf2))


### BREAKING CHANGES

* esm support changes
* modified node engines: ^12.20.0 || ^14.13.1 || >=16.0.0

see https://github.com/sindresorhus/meta/discussions/15





## [7.14.2](https://github.com/christophehurpeau/pob/compare/pob@7.14.1...pob@7.14.2) (2021-07-05)

**Note:** Version bump only for package pob





## [7.14.1](https://github.com/christophehurpeau/pob/compare/pob@7.14.0...pob@7.14.1) (2021-06-29)

**Note:** Version bump only for package pob





# [7.14.0](https://github.com/christophehurpeau/pob/compare/pob@7.13.0...pob@7.14.0) (2021-06-27)


### Bug Fixes

* inLerna ([4bc7be4](https://github.com/christophehurpeau/pob/commit/4bc7be44a90490ce0e10355703ab6a858e2178fc))
* remove husky.config.js template ([1b1ebeb](https://github.com/christophehurpeau/pob/commit/1b1ebeb544c5d4cc25e9e9b54b95a82d435d86b0))


### Features

* simplify browserlist ([74bfe82](https://github.com/christophehurpeau/pob/commit/74bfe82034dafb9044a370cce81b7f854a075eb9))





# [7.13.0](https://github.com/christophehurpeau/pob/compare/pob@7.12.0...pob@7.13.0) (2021-06-27)


### Bug Fixes

* remove husky dev dependency ([e29e189](https://github.com/christophehurpeau/pob/commit/e29e189bc186a5727f0d473657a0763e3dccf1e7))


### Features

* update browserslist config to drop safari 8 ([0c0ca02](https://github.com/christophehurpeau/pob/commit/0c0ca0201ad0ea1e5336b3d2fba549f124b2f6a1))





# [7.12.0](https://github.com/christophehurpeau/pob/compare/pob@7.11.0...pob@7.12.0) (2021-06-24)


### Bug Fixes

* check pkg.scripts exists before deleting scripts ([5b9d377](https://github.com/christophehurpeau/pob/commit/5b9d377e58e14cff4ee2e861f7ffc27d93ac1769))
* **pob:** monorepo without typescript ([d48a4df](https://github.com/christophehurpeau/pob/commit/d48a4df11de2faa25f872a1fd274576b5fba497a))
* run build and docs if preversion script doesnt exists ([a93150c](https://github.com/christophehurpeau/pob/commit/a93150cb9a161e37c592c1f624ed620f401fe23c))


### Features

* add eslint-plugin-typescript in legacy dependencies ([2b289f6](https://github.com/christophehurpeau/pob/commit/2b289f65f41db385d89b0d05398a81f440f880c7))
* change browserlist query ([75a531c](https://github.com/christophehurpeau/pob/commit/75a531cd8caa8cda2a680cedce693b7f04de5bb7))
* update pob eslint-config ([464f35a](https://github.com/christophehurpeau/pob/commit/464f35adef8c6afdde70dd95f41f64332ec836e9))
* **pob:** add scripts/check-package.js for non monorepo ([a9093a1](https://github.com/christophehurpeau/pob/commit/a9093a1678e8b6535659f8b18ca64d585e2ab1ee))
* **pob:** when release-please used, remove manual release scripts ([67aeac7](https://github.com/christophehurpeau/pob/commit/67aeac77ac9b70337fd29fa78c9c192f65207cab))





# [7.11.0](https://github.com/christophehurpeau/pob/compare/pob@7.10.1...pob@7.11.0) (2021-03-14)


### Bug Fixes

* delete engines.yarn ([defaa37](https://github.com/christophehurpeau/pob/commit/defaa3724480c056ea8ae690c6169932a55682ae))
* **pob:** only fixAll eslint in vscode settings ([ba6abe9](https://github.com/christophehurpeau/pob/commit/ba6abe938c09a8d05eca57ba0ad618de661cae50))


### Features

* **deps:** update dependency inquirer-npm-name to v4 ([#851](https://github.com/christophehurpeau/pob/issues/851)) ([aa3ab20](https://github.com/christophehurpeau/pob/commit/aa3ab208f59f1539f4aef582318eb83952858029))





## [7.10.1](https://github.com/christophehurpeau/pob/compare/pob@7.10.0...pob@7.10.1) (2021-03-13)


### Bug Fixes

* **pob:** lerna 4 ([e26946c](https://github.com/christophehurpeau/pob/commit/e26946cdcf01058674afcaeb33e38764cb60e8cb))





# [7.10.0](https://github.com/christophehurpeau/pob/compare/pob@7.9.0...pob@7.10.0) (2021-03-13)


### Bug Fixes

* **check-package-dependencies:** better duplicate message error and fix reportError pkgPath ([fede23a](https://github.com/christophehurpeau/pob/commit/fede23a9e417b4e5cadc5dc81baae85569a6c6ae))


### Features

* check-package-dependencies ([#849](https://github.com/christophehurpeau/pob/issues/849)) ([213969e](https://github.com/christophehurpeau/pob/commit/213969ed1ee4bc99ce431186a9d590a42d507d5e))





# [7.9.0](https://github.com/christophehurpeau/pob/compare/pob@7.8.1...pob@7.9.0) (2021-02-14)


### Features

* **deps:** update lerna monorepo to v4 (major) ([#819](https://github.com/christophehurpeau/pob/issues/819)) ([40e6fc4](https://github.com/christophehurpeau/pob/commit/40e6fc440aabfec3fc9102a44924e8f8c176cfb7))





## [7.8.1](https://github.com/christophehurpeau/pob/compare/pob@7.8.0...pob@7.8.1) (2021-02-08)

**Note:** Version bump only for package pob





# [7.8.0](https://github.com/christophehurpeau/pob/compare/pob@7.7.0...pob@7.8.0) (2021-02-08)


### Bug Fixes

* bring back browser entry point for react-native ([ad239a3](https://github.com/christophehurpeau/pob/commit/ad239a399a70756213efbb24d766b23a761cded4))
* lint script with yarn 2 ([51698f9](https://github.com/christophehurpeau/pob/commit/51698f91bfaf259e17b13b54fb75060582213709))
* reignore .d.ts ([c132612](https://github.com/christophehurpeau/pob/commit/c132612a7844cab55b6a5aaf3b67149317df967e))


### Features

* add @pob/sort-eslint-config and @pob/pretty-eslint-config ([c2984a7](https://github.com/christophehurpeau/pob/commit/c2984a7da51aaf13b4667053337fc8c9e65da060))
* improve docs with ts references ([2267a25](https://github.com/christophehurpeau/pob/commit/2267a2515fcb57a53ae5cda5c5067574f629e3a4))
* improve typedoc config with lerna ([e6eedcc](https://github.com/christophehurpeau/pob/commit/e6eedccbd1e82bbfc7ae27a8a85f1a7e983406e4))
* support custom readme in lerna configs ([7ba21ec](https://github.com/christophehurpeau/pob/commit/7ba21ec9983db0c6d2f528acc22704a3521e0acc))





# [7.7.0](https://github.com/christophehurpeau/pob/compare/pob@7.6.0...pob@7.7.0) (2021-01-18)


### Bug Fixes

* config for typedoc 0.20 ([65ef9ef](https://github.com/christophehurpeau/pob/commit/65ef9efaef95d1158956d421fe7df27e14f9f151))
* fixes ([d74ba8f](https://github.com/christophehurpeau/pob/commit/d74ba8f453d717834979b36f9e1e8372c1bf60fe))
* ignorePaths ([5e7afe6](https://github.com/christophehurpeau/pob/commit/5e7afe6623279866e5c1939f3a10e7585ad4b548))
* missing dist prettierignore monorepo with lib ([408ef69](https://github.com/christophehurpeau/pob/commit/408ef69c6c65141b8d11d8513c34c9d2795fd67b))
* use since when possible ([9bea5c1](https://github.com/christophehurpeau/pob/commit/9bea5c149aa64c8c75ba298b06bdfcef968e61ca))


### Features

* dedupe also for non yarn 2 projects ([3d70a29](https://github.com/christophehurpeau/pob/commit/3d70a29ca1ac844035bc28b9255163e15f8c384d))
* extraEntries and update eslint to support mjs ([b662d8b](https://github.com/christophehurpeau/pob/commit/b662d8b5fd1840499c17f6a7b30d1b44269a2185))
* improve tsconfig ([11cea8d](https://github.com/christophehurpeau/pob/commit/11cea8d6fed56ad4405044e10f906d08e8ca3c02))
* improve tsdoc config ([02cae60](https://github.com/christophehurpeau/pob/commit/02cae6058ea68ab742a81a1eafc64631f9ef1ae5))
* run yarn dedupe ([c4b8711](https://github.com/christophehurpeau/pob/commit/c4b8711c3839e3e022657d6f0865da2be3b28d3d))
* **deps:** update dependency github-username to v6 ([#753](https://github.com/christophehurpeau/pob/issues/753)) ([16d9bf1](https://github.com/christophehurpeau/pob/commit/16d9bf1cf6ca6112e17bec6c472ab759f97f7425))
* **deps:** update pob eslint config ([#756](https://github.com/christophehurpeau/pob/issues/756)) ([d93e29b](https://github.com/christophehurpeau/pob/commit/d93e29b4d77cd77c1567e90c130fa2467a5c57bf))





# [7.6.0](https://github.com/christophehurpeau/pob/compare/pob@7.5.1...pob@7.6.0) (2020-12-19)


### Bug Fixes

* lerna detect children testing ([fec42e8](https://github.com/christophehurpeau/pob/commit/fec42e8538f6214d2afe935f12dc2ab1302e52d3))
* missing new line ([13e99f5](https://github.com/christophehurpeau/pob/commit/13e99f5b5921170cfbda3a65857cf1b4473b202c))
* missing write pkg ([fb0eabd](https://github.com/christophehurpeau/pob/commit/fb0eabdb5adac08f641fa43c6b2f815d35fc8539))
* remove console.log ([76c3fc5](https://github.com/christophehurpeau/pob/commit/76c3fc569337093507b18d2a56deeca051800f03))
* style rollup config app ([fd3d4ee](https://github.com/christophehurpeau/pob/commit/fd3d4ee4b9ac4455aae45355a019b7827f8ec3d9))


### Features

* imrpove ignore paths ([8572c8c](https://github.com/christophehurpeau/pob/commit/8572c8c66bdf23bb403541e3e0c5a8fd05ab0297))
* simplify pob-lib-config pob-app-config ([b3325d4](https://github.com/christophehurpeau/pob/commit/b3325d45e4a22c018caa07b4810ae8e4b102f021))





## [7.5.1](https://github.com/christophehurpeau/pob/compare/pob@7.5.0...pob@7.5.1) (2020-12-19)


### Bug Fixes

* **pob:** only run in watch mode ([8b60c46](https://github.com/christophehurpeau/pob/commit/8b60c46abfb90265007f164aa5467dff84b7edf0))
* remove pob-version ([b076e5d](https://github.com/christophehurpeau/pob/commit/b076e5dc478fd75523596890f99d467970b70687))





# [7.5.0](https://github.com/christophehurpeau/pob/compare/pob@7.4.0...pob@7.5.0) (2020-12-19)


### Features

* rollup config for node app ([ee088c7](https://github.com/christophehurpeau/pob/commit/ee088c7726b4c6f4f250950ee8824c25fbdadaf3))





# [7.4.0](https://github.com/christophehurpeau/pob/compare/pob@7.3.1...pob@7.4.0) (2020-12-19)


### Bug Fixes

* add  --skipLibCheck to check .d.ts ([e2b31be](https://github.com/christophehurpeau/pob/commit/e2b31be542a1fc70846b888865328bc73483cc3d))
* call preversion before standard-version ([d6ad259](https://github.com/christophehurpeau/pob/commit/d6ad259130ce684bc9f917216b0ddbc6cb3a0790))


### Features

* add removeDevAndNotDevDependencies ([707f840](https://github.com/christophehurpeau/pob/commit/707f84061c92a8a86e79104ffecb2d8870305565))
* add typescript.tsdk in vscode settings for yarn 1 ([60c2c3f](https://github.com/christophehurpeau/pob/commit/60c2c3f2179e2b67c6356bb6e7803270682c05f4))
* improve app and enable testing for apps ([5302b21](https://github.com/christophehurpeau/pob/commit/5302b2144ef37f108a274c6938acf1030bdb949c))
* use @pob/eslint-config-typescript/test in tests ([d19f360](https://github.com/christophehurpeau/pob/commit/d19f360a781c5671d071818ca2ccab3cdd196ab9))
* use actions/setup-node@v2 ([0269a70](https://github.com/christophehurpeau/pob/commit/0269a704531b8d9a573266815446b27398c67259))





## [7.3.1](https://github.com/christophehurpeau/pob/compare/pob@7.3.0...pob@7.3.1) (2020-12-12)

**Note:** Version bump only for package pob





# [7.3.0](https://github.com/christophehurpeau/pob/compare/pob@7.2.0...pob@7.3.0) (2020-12-05)


### Bug Fixes

* allow packages to be empty in initial repo creation ([4563a37](https://github.com/christophehurpeau/pob/commit/4563a3768fb19e48bb32530f3cd79b1da438d004))
* legacy lerna config in pkg ([13f1350](https://github.com/christophehurpeau/pob/commit/13f135062292415eb3a54a6ab70aaeff321ecd57))
* **deps:** update dependency prettier to v2.2.1 ([#712](https://github.com/christophehurpeau/pob/issues/712)) ([42821c1](https://github.com/christophehurpeau/pob/commit/42821c12bd9691096a081045d7288977e9715f18))


### Features

* default monorepo eslint ([b133b29](https://github.com/christophehurpeau/pob/commit/b133b2969ff27100531bec1b70a1aa013a0bfb7d))


### Reverts

* Revert "chore: configure lerna in package instead of lerna.json" ([4b397eb](https://github.com/christophehurpeau/pob/commit/4b397eb9b883e023c220f42c6bdbb9802ee948ea))





# [7.2.0](https://github.com/christophehurpeau/pob/compare/pob@7.1.1...pob@7.2.0) (2020-11-19)


### Bug Fixes

* lint for non lerna projects ([61548e5](https://github.com/christophehurpeau/pob/commit/61548e51a29651ffb6fab55a9ee30bc56e87fa42))
* root prettier ignore ([9e1187f](https://github.com/christophehurpeau/pob/commit/9e1187ffa0227993d3f80ef0899208e6dd1bb96d))


### Features

* force vscode config to not be ignored ([284f65a](https://github.com/christophehurpeau/pob/commit/284f65a12f790ace9bc8a781b8cb8defa1e5c55b))
* improve ignore paths ([ac90c3c](https://github.com/christophehurpeau/pob/commit/ac90c3c90c2250ba69ccfc5384ba568166e72ef8))





## [7.1.1](https://github.com/christophehurpeau/pob/compare/pob@7.1.0...pob@7.1.1) (2020-11-16)

**Note:** Version bump only for package pob





# [7.1.0](https://github.com/christophehurpeau/pob/compare/pob@7.0.0...pob@7.1.0) (2020-11-15)


### Bug Fixes

* add eslint in devdep to prevent having peer dep warnings ([b95390c](https://github.com/christophehurpeau/pob/commit/b95390c7080abdd59dc65ee710abc6e037459b11))
* babelEnvs should be fixed in babel generator ([78cff70](https://github.com/christophehurpeau/pob/commit/78cff70a23ab264b0a0e3b03bcae94e84b6a6d78))
* format lerna.json ([086789b](https://github.com/christophehurpeau/pob/commit/086789bc6c776076adea37f45a6b4f712a4e08d1))
* format push workflow ([449a8db](https://github.com/christophehurpeau/pob/commit/449a8dba897455783a1d563e1c330be4e4e0e1fc))
* go back to using lerna for running commands ([364900a](https://github.com/christophehurpeau/pob/commit/364900abd7400e51da1b986dc108f8c8fe0d2a74))
* missing first arg in ci generator ([94a9748](https://github.com/christophehurpeau/pob/commit/94a97489636d09aa76b7641f56379d0e8acf0798))
* remove postbuild script and use only build ([2f9b660](https://github.com/christophehurpeau/pob/commit/2f9b660565e35f928a475213787f7b88c3f60c44))
* rollup config template ([3ff67c4](https://github.com/christophehurpeau/pob/commit/3ff67c479c4242c230a78f899c8090cfa24cf82a))


### Features

* improve docs and support with yarn 2 ([e0b80b4](https://github.com/christophehurpeau/pob/commit/e0b80b45ff6981b5ca308c032fd3a73236146340))





# [7.0.0](https://github.com/christophehurpeau/pob/compare/pob@6.4.0...pob@7.0.0) (2020-11-13)


### Bug Fixes

* babel select empty ([38de46c](https://github.com/christophehurpeau/pob/commit/38de46c3a8b6540b64feb0ff405e3eeb178e89c1))
* dont add prettierignore inside lerna ([3d44669](https://github.com/christophehurpeau/pob/commit/3d446695abde0fae2c722edd869ad64254afd33c))
* ensure most of files are prettiered before writing ([c61aecc](https://github.com/christophehurpeau/pob/commit/c61aeccb6eaeac6c921523e40716a3b38408edaa))
* ignore .d.ts ([80b5d75](https://github.com/christophehurpeau/pob/commit/80b5d7548dab283f0775dcff19578fe292afabef))
* missing dependencies for yarn berry ([78bf6f2](https://github.com/christophehurpeau/pob/commit/78bf6f2eefdf4c34d78c866698042fb75df3802d))
* package repository url ([e84a7ad](https://github.com/christophehurpeau/pob/commit/e84a7ada3108f4377edf55760e77f76d545f35fa))
* update update-notifier and generator-license ([c6af91a](https://github.com/christophehurpeau/pob/commit/c6af91a44b500f63cee0a646f0784d4dd8ed054e))
* use babel.config.json for jest ([e72494b](https://github.com/christophehurpeau/pob/commit/e72494b0aab862cad4343183ecf7487de641b013))
* util copyAndFormatTpl fixes prettier issues ([83ef4b6](https://github.com/christophehurpeau/pob/commit/83ef4b6718df75716ee8b04bf2e05553f2740913))


### Features

* drop node 10 ([84cdd60](https://github.com/christophehurpeau/pob/commit/84cdd609edf105ca89692d913d5f363deb747ae1))
* run prettier and eslint independently ([9abe7ae](https://github.com/christophehurpeau/pob/commit/9abe7ae6f8a2a019a80b8a3e74f6be3ddb7e9075))
* run prettier outside of eslint ([445e2cc](https://github.com/christophehurpeau/pob/commit/445e2cc4def17c3eef1da69c9112dcc1d9e005ce))
* update actions/cache to v2 ([58a269f](https://github.com/christophehurpeau/pob/commit/58a269f42be580ff32ae08120cce6b3930902c24))
* update pob, use prettier outside of eslint ([5ef824d](https://github.com/christophehurpeau/pob/commit/5ef824d42a60bef88255134288a17d8c910af19f))
* use yarn workspace plugin instead of lerna ([55abbe2](https://github.com/christophehurpeau/pob/commit/55abbe2ba23b6e1cd18b4b24987c4a0d76a69a5f))


### BREAKING CHANGES

* requires node 12.10





# [6.4.0](https://github.com/christophehurpeau/pob/compare/pob@6.3.0...pob@6.4.0) (2020-11-01)


### Bug Fixes

* temp support main and master ([79a7d5c](https://github.com/christophehurpeau/pob/commit/79a7d5c72bc7e033f287b3d8563e3a2ca98e580f))


### Features

* eslint vscode config reportUnusedDisableDirectives and enable lint task ([37444c3](https://github.com/christophehurpeau/pob/commit/37444c3b821493a338f46a0d09373ef97ba023c1))





# [6.3.0](https://github.com/christophehurpeau/pob/compare/pob@6.2.0...pob@6.3.0) (2020-10-18)


### Bug Fixes

* ensure npm is used not lerna when package-lock.json exists ([796cd2f](https://github.com/christophehurpeau/pob/commit/796cd2fd3db20c05d7f999ab8122bff6c563b083))
* ignorePatterns in lerna ([14e854a](https://github.com/christophehurpeau/pob/commit/14e854a06f4f94b1aaf51e512eb81eb2726c68eb))


### Features

* add initail tasks for vscode with lint ([701b8e3](https://github.com/christophehurpeau/pob/commit/701b8e3c71e6685a1a5349c80826e11a0ca225b9))
* **deps:** update @pob/eslint-config to v40.1.0 [skip ci] ([#668](https://github.com/christophehurpeau/pob/issues/668)) ([b1fd4f4](https://github.com/christophehurpeau/pob/commit/b1fd4f418ab87438bbfb915ffcb2ed741a2dca3f))





# [6.2.0](https://github.com/christophehurpeau/pob/compare/pob@6.1.2...pob@6.2.0) (2020-10-18)


### Bug Fixes

* use yarn or npm for running scripts depending on config ([b7a2003](https://github.com/christophehurpeau/pob/commit/b7a2003282cbace4e8df2b837b0032ab56577b4f))


### Features

* remove deprecated option eslint.enable ([ea8c7ef](https://github.com/christophehurpeau/pob/commit/ea8c7ef18e34b4e6a9b3772384869ad57fc379e8))





## [6.1.2](https://github.com/christophehurpeau/pob/compare/pob@6.1.1...pob@6.1.2) (2020-10-18)


### Bug Fixes

* husky and lint-staged with npm 7 ([c51e1ad](https://github.com/christophehurpeau/pob/commit/c51e1ad68edcb61c988f263b93dd0fa5f58dd2a2))





## [6.1.1](https://github.com/christophehurpeau/pob/compare/pob@6.1.0...pob@6.1.1) (2020-10-18)

**Note:** Version bump only for package pob





# [6.1.0](https://github.com/christophehurpeau/pob/compare/pob@6.0.1...pob@6.1.0) (2020-10-18)


### Bug Fixes

* **deps:** update dependency update-notifier to v5 ([#645](https://github.com/christophehurpeau/pob/issues/645)) ([68ad4b5](https://github.com/christophehurpeau/pob/commit/68ad4b5129571fd14482c5fd7bd14d3df80bb109))
* missing rollup dep required with pob-babel ([75d1717](https://github.com/christophehurpeau/pob/commit/75d1717653d845d12931d9d3164fa1810e8e77e6))
* yarn2 option in vscode generator is boolean ([2996abf](https://github.com/christophehurpeau/pob/commit/2996abff5a6d6dcc0ee7f9eb21e3460e473c9dd0))


### Features

* add sideEffects in package by default to true ([3aba4af](https://github.com/christophehurpeau/pob/commit/3aba4afb61312021dc80550dbc3e57433101038f))
* initial npm 7 support ([c7eecdc](https://github.com/christophehurpeau/pob/commit/c7eecdca0bcc49c06d9dade0f0d2f0a71abbb60d))
* remove eslintignore for ignorePatterns in eslint config ([166969d](https://github.com/christophehurpeau/pob/commit/166969d2390c042891b8b89fa4d5f0d1fa1eccc7))
* remove unsued eslint-disable in husky config template ([ad60f45](https://github.com/christophehurpeau/pob/commit/ad60f450491b929006d3607a95f21e884a8f18e7))
* update browserslist and drop ie, opera mini ([63b4ce0](https://github.com/christophehurpeau/pob/commit/63b4ce085f02ac840c5f2ae2f11be67396294ce6))
* use exports for node and webpack ([1358f10](https://github.com/christophehurpeau/pob/commit/1358f10775abfb671a85c2665681c8ee21048b13))
* use report-unused-disable-directives with eslint ([9fc607f](https://github.com/christophehurpeau/pob/commit/9fc607f058a4838c13ba7959c3d93073e07d1d4e))





## [6.0.1](https://github.com/christophehurpeau/pob/compare/pob@6.0.0...pob@6.0.1) (2020-09-20)


### Bug Fixes

* add @typescript-eslint/parser in devdeps for yarn 2 ([a8bb3bc](https://github.com/christophehurpeau/pob/commit/a8bb3bc16f9716b9d32af8de9ff7b1557d07649b))
* support yarn 2, use cjs to prevent breakings ([a600853](https://github.com/christophehurpeau/pob/commit/a600853354201025dde61a5e9fc61d901e8e23b2))
* support yarn2 typescript in vscode config ([a6699d0](https://github.com/christophehurpeau/pob/commit/a6699d048f607dd588aea8a0940a4f07b892b5d0))





# [6.0.0](https://github.com/christophehurpeau/pob/compare/pob@5.19.0...pob@6.0.0) (2020-09-19)


### Bug Fixes

* ensure yarn-deduplicate is not in devdeps ([e6934b5](https://github.com/christophehurpeau/pob/commit/e6934b52faf20c559474cf8d620955d234cd5db1))


### Features

* remove pob-release, use standard-version instead ([45e9c72](https://github.com/christophehurpeau/pob/commit/45e9c726d17b213638320c8fe85bcf971f884919))
* rollup 2, typescript 4, jest 26 ([1f830ec](https://github.com/christophehurpeau/pob/commit/1f830ec879b5e145455178554f8cb7358019949c))
* support node ESM with mjs and exports config ([d3bba88](https://github.com/christophehurpeau/pob/commit/d3bba8867bfd7a1fceb2d56d6d483bbcddb56373))


### BREAKING CHANGES

* babel presets updated, rollup 2, jest 26





# [5.19.0](https://github.com/christophehurpeau/pob/compare/pob@5.18.0...pob@5.19.0) (2020-09-19)


### Bug Fixes

* add missing new sdk argument for pnpify ([39068b1](https://github.com/christophehurpeau/pob/commit/39068b19b35b239d06b5f07d1cb1d8dd62eec950))
* dont add tsbuildinfo in app gitignore ([71685af](https://github.com/christophehurpeau/pob/commit/71685af0eb777e4eea69e5664032a61350df9e32))
* eslint resolve-plugins-relative-to with lerna for eslint 7 ([60ecece](https://github.com/christophehurpeau/pob/commit/60ececed3028d118bb899ea723cf735a0eb27b95))
* remove renovate.json in lerna config ([ccb2b8c](https://github.com/christophehurpeau/pob/commit/ccb2b8cc2588e9b86451115b0353a53ac3d00200))
* remove space in postbuild script ([fb7a27a](https://github.com/christophehurpeau/pob/commit/fb7a27ae249ab84b5c12ea9822e0bcc7b16c80a7))


### Features

* add initial vscode generator ([8e9de7c](https://github.com/christophehurpeau/pob/commit/8e9de7c45ecaa9e77453f6048c7e5e2281b09ae6))
* ignore config.js in npmignore ([f39101e](https://github.com/christophehurpeau/pob/commit/f39101e9264791da13035a6efc458ad464dfdfc2))
* update eslint, pob-eslint, prettier, husky and lint-staged ([a62814e](https://github.com/christophehurpeau/pob/commit/a62814e294426ff0b75334d57c0861fb1de171e4))





# [5.18.0](https://github.com/christophehurpeau/pob/compare/pob@5.17.0...pob@5.18.0) (2020-07-20)


### Features

* drop circleci ([5ca1dda](https://github.com/christophehurpeau/pob/commit/5ca1dda4da3e45469e100bc35b36899a6faa9216))
* support monorepo without scope ([90a159e](https://github.com/christophehurpeau/pob/commit/90a159eacebeefbf5a0b598a83a7f3680b6e6ab9))





# [5.17.0](https://github.com/christophehurpeau/pob/compare/pob@5.16.0...pob@5.17.0) (2020-06-28)


### Bug Fixes

* ensure right filename passed to prettier ([c0941f0](https://github.com/christophehurpeau/pob/commit/c0941f0669b54f29e1e230288123247bf96b4a06))
* eslint config for pob eslint monorepo ([bfbfbe4](https://github.com/christophehurpeau/pob/commit/bfbfbe48a19aa0a6d8e91cade821ee606bc9f7ed))
* formatJson ([00102fd](https://github.com/christophehurpeau/pob/commit/00102fd1ae63470082baa3e0738e6b251ceb2492))
* formatJson ([2a79a31](https://github.com/christophehurpeau/pob/commit/2a79a3192849f2d0edb6d7b9e01e970a8bd6238a))
* settings false value ([4596444](https://github.com/christophehurpeau/pob/commit/459644492a82511b0f9fe46d51ba9a4594743837))
* when settings not defined in eslint config ([a7be844](https://github.com/christophehurpeau/pob/commit/a7be844ada17437a119f2cd8d972559d89d4037a))


### Features

* add option enableSrcResolver for apps ([c3f1ff7](https://github.com/christophehurpeau/pob/commit/c3f1ff7d9404a7f5dd8b9fc023445e4683347239))
* drop circleci and travisci ([53beb5c](https://github.com/christophehurpeau/pob/commit/53beb5c65ba681c9f8f0d56dea80b1f93e2217e3))
* monorepo doc ([bac17fc](https://github.com/christophehurpeau/pob/commit/bac17fcc01b32e6abfc5364a80f7776a7efabf57))
* remove david-dm ([5e432d6](https://github.com/christophehurpeau/pob/commit/5e432d65d1067e5196a6ecb75a02a17c830431ca))





# [5.16.0](https://github.com/christophehurpeau/pob/compare/pob@5.15.0...pob@5.16.0) (2020-06-04)


### Features

* add build 14.x in required status checks ([fca76e0](https://github.com/christophehurpeau/pob/commit/fca76e009ebde991ef00062de3bd99219a333321))
* improve eslint global ([abef47a](https://github.com/christophehurpeau/pob/commit/abef47a0a3506d74bdb3381f39c417811a65676c))





# [5.15.0](https://github.com/christophehurpeau/pob/compare/pob@5.14.0...pob@5.15.0) (2020-05-23)


### Features

* github action reenable repository-check-dirty ([e691a49](https://github.com/christophehurpeau/pob/commit/e691a4949c539b58a2c79f746f7dd45440ef6ca4))
* postbuild generate doc ([157221d](https://github.com/christophehurpeau/pob/commit/157221da642c1af6b9d767483dc8586fe113a540))
* update minor and patch dependencies ([00cbca6](https://github.com/christophehurpeau/pob/commit/00cbca614bafde4e2d4211b0a180b1a1f6adf40e))





# [5.14.0](https://github.com/christophehurpeau/pob/compare/pob@5.13.0...pob@5.14.0) (2020-05-23)


### Bug Fixes

* no js files present in root when package support no node ([a367a60](https://github.com/christophehurpeau/pob/commit/a367a600e8ed2ff53eaedf568a4837e51b2e4ed2))
* tsconfig.build.json not present for some reason ([94c9b56](https://github.com/christophehurpeau/pob/commit/94c9b5690e33b9feba06f74a649fc0ddf18b1333))


### Features

* add checks script ([7cca036](https://github.com/christophehurpeau/pob/commit/7cca036e2a08fdb96ffb935590d9ae9e404945c9))





# [5.13.0](https://github.com/christophehurpeau/pob/compare/pob@5.12.0...pob@5.13.0) (2020-05-22)


### Bug Fixes

* better typescript app monorepo support ([a71a093](https://github.com/christophehurpeau/pob/commit/a71a093275d0ecef3d6a4cdc9018ede27ac20c2d))


### Features

* set prettier config trailingComma to all ([55631ca](https://github.com/christophehurpeau/pob/commit/55631ca2dfd63c5086af1ac84198bc46e389b301))
* use dlx version of pnpify ([3f48cfb](https://github.com/christophehurpeau/pob/commit/3f48cfb925b577374377c9d348e9c1b384430eaa))





# [5.12.0](https://github.com/christophehurpeau/pob/compare/pob@5.11.0...pob@5.12.0) (2020-05-08)


### Bug Fixes

* global eslint ([fcceb80](https://github.com/christophehurpeau/pob/commit/fcceb80834aff09817ec07c38deb668a76adc5a7))


### Features

* jsx is not the same as with react ([c211a94](https://github.com/christophehurpeau/pob/commit/c211a9406046b615d7dd7444ff7edd4a2257b9a2))





# [5.11.0](https://github.com/christophehurpeau/pob/compare/pob@5.10.1...pob@5.11.0) (2020-05-02)


### Bug Fixes

* always add @pob/commitlint-config in devdeps ([543a689](https://github.com/christophehurpeau/pob/commit/543a689c468396b569d8c8f4ee86c89575c0cc18))
* delete build:definitions script in apps ([3c86ef0](https://github.com/christophehurpeau/pob/commit/3c86ef010df66af11e03b5a612a49448dc6137d9))
* for when pobConfig doesnt exists yet ([7926e6e](https://github.com/christophehurpeau/pob/commit/7926e6ed405c0c5db77017440700e8ef1e0a692e))
* jest override ([c084d45](https://github.com/christophehurpeau/pob/commit/c084d4505ab90f7ed2da3f142849091e12db2b0a))
* lint *.js only in root or babel projets ([d0e8dc8](https://github.com/christophehurpeau/pob/commit/d0e8dc886a8beae793cf0be7a7acf2476ebd7a7c))
* only run pnpify on yarn 2 ([bdb8ced](https://github.com/christophehurpeau/pob/commit/bdb8ced5b29e515470fd2837b58b1dfdd977584f))
* use yarn to publish with yarn 2 ([4ab2343](https://github.com/christophehurpeau/pob/commit/4ab2343e1530c23d8e967e41f3559dddc5008cf0))
* write root eslintrc config ([a7625cb](https://github.com/christophehurpeau/pob/commit/a7625cb44aaaf7bd2c492912b96d412b66cb7115))
* yarn dependencies ([2848995](https://github.com/christophehurpeau/pob/commit/28489957398a5d91913b513e3619adf77066d162))
* **deps:** update dependency prettier to v2.0.3 ([#509](https://github.com/christophehurpeau/pob/issues/509)) ([740be36](https://github.com/christophehurpeau/pob/commit/740be36db0f5907e0134d3a6c8264882648dfd97))
* **deps:** update dependency prettier to v2.0.4 ([#511](https://github.com/christophehurpeau/pob/issues/511)) ([2ba8888](https://github.com/christophehurpeau/pob/commit/2ba888816e299a75977a2d3c26de145b159abc05))
* **deps:** update dependency prettier to v2.0.5 ([#538](https://github.com/christophehurpeau/pob/issues/538)) ([f43fc5f](https://github.com/christophehurpeau/pob/commit/f43fc5f129171739f6c556a59be646e35bbb739f))
* yarn 2 eslint devdeps ([7618b7d](https://github.com/christophehurpeau/pob/commit/7618b7dbf08926e8c58e4d6446f3ada3849beff9))


### Features

* add ignoreChanges in lerna config ([07e3e64](https://github.com/christophehurpeau/pob/commit/07e3e6479d85f8e3fa0c8a4ce9d920056ecf53c6))
* dont add eslint config in lib if same as root ([3163101](https://github.com/christophehurpeau/pob/commit/3163101cfed63f0e49fe6af9ee2a779177fce28d))
* root vs src eslint ([eeb6b29](https://github.com/christophehurpeau/pob/commit/eeb6b29b6b87ca6bad08ccdaf935a093a57fcdbe))
* run command to update yarn ([004a6be](https://github.com/christophehurpeau/pob/commit/004a6bec6e2e42ab6407c81c6fcb3c174c71a188))
* update node 10 image for circleci ([a77a850](https://github.com/christophehurpeau/pob/commit/a77a85094860a92a30701102d77b1eafff57df54))
* update protection branch ([bbd44c8](https://github.com/christophehurpeau/pob/commit/bbd44c8314c672812cec6d15725cbf9cd69c3747))
* use node 14 instead of 13 ([b597253](https://github.com/christophehurpeau/pob/commit/b597253d7ee91731a91338d89361fd00b3ec7464))





## [5.10.1](https://github.com/christophehurpeau/pob/compare/pob@5.10.0...pob@5.10.1) (2020-04-05)

**Note:** Version bump only for package pob





# [5.10.0](https://github.com/christophehurpeau/pob/compare/pob@5.9.1...pob@5.10.0) (2020-04-05)


### Bug Fixes

* add install-state.gz in yarn 2 gitignore ([fb7fd11](https://github.com/christophehurpeau/pob/commit/fb7fd1179a808733590a496bf61ec41a4393abc6))
* add yarn2 files in npmignore ([d277ba3](https://github.com/christophehurpeau/pob/commit/d277ba3816194e5c1e0f2edf23b23448e37055c5))
* author error when package.json does not exists ([8fe4a3c](https://github.com/christophehurpeau/pob/commit/8fe4a3ce8e1ad2317f74d0e6c43ab748be6a6c12))
* missing devdep eslint-import-resolver-node for yarn 2 ([0f36bb2](https://github.com/christophehurpeau/pob/commit/0f36bb28643ce87e83128b6dd86537766699c729))
* package error when package.json does not exists ([cb4f3d9](https://github.com/christophehurpeau/pob/commit/cb4f3d9b9175909e5a424fb5f57509b6c0fc0163))


### Features

* add bin as potential lint directory ([29ff56b](https://github.com/christophehurpeau/pob/commit/29ff56b7c06d2b1cb488de6c2553c24be47dd382))





## [5.9.1](https://github.com/christophehurpeau/pob/compare/pob@5.9.0...pob@5.9.1) (2020-04-05)

**Note:** Version bump only for package pob





# [5.9.0](https://github.com/christophehurpeau/pob/compare/pob@5.8.3...pob@5.9.0) (2020-04-05)


### Bug Fixes

* add @pob/commitlint-config in devdep for yarn2 packages ([52531c5](https://github.com/christophehurpeau/pob/commit/52531c56e1b98821391a950724019c18447193de))
* create husky template ([fcfd946](https://github.com/christophehurpeau/pob/commit/fcfd946aa818cf0decc3adbbb3a753ea2027d892))
* **deps:** update dependency gh-got to v9 ([#444](https://github.com/christophehurpeau/pob/issues/444)) ([c5a5a53](https://github.com/christophehurpeau/pob/commit/c5a5a534feba0b07359711a483b50bd8b88827c3))
* **deps:** update dependency prettier to v2 ([#480](https://github.com/christophehurpeau/pob/issues/480)) ([9a55c81](https://github.com/christophehurpeau/pob/commit/9a55c81a795255674bbe42cfb82845511d724d9e))
* add typescript as devdep in lerna packages for yarn 2 ([9887f41](https://github.com/christophehurpeau/pob/commit/9887f413f5c183a853425b7f2b72d6ea861f77ac))
* dont use mem fs to check if yarnrc.yml exists ([56f6dde](https://github.com/christophehurpeau/pob/commit/56f6ddea1600950b5320ca07cb756ccb88ffc8ab))
* fix command pnpify ([763ee3e](https://github.com/christophehurpeau/pob/commit/763ee3e17886984d0362d92b233660a31c2c8623))
* github action template newline ([#451](https://github.com/christophehurpeau/pob/issues/451)) ([e01d90c](https://github.com/christophehurpeau/pob/commit/e01d90cc1860757e00b9443fa8d457f76bc41392))
* only add .yarn/.gitignore for yarn 2 ([c414da4](https://github.com/christophehurpeau/pob/commit/c414da4509c4de9ac2dfa49fcfc67c621c8015f2))
* pkg.scripts not always defined ([ed43bb2](https://github.com/christophehurpeau/pob/commit/ed43bb20d1e374d4b5679eb3df6ef9fe244e2953))
* run yarn install when config fails to load ([0f07f31](https://github.com/christophehurpeau/pob/commit/0f07f3155f54b80902d4d172970959ce2e9b8d7a))
* yarn install to work on both yarn 1 and yarn 2 ([fef2d2a](https://github.com/christophehurpeau/pob/commit/fef2d2a8bbe9557f2708cb9ee6f1867e6ccba7f4))


### Features

* add checks scripts support ([#450](https://github.com/christophehurpeau/pob/issues/450)) ([32254e8](https://github.com/christophehurpeau/pob/commit/32254e839a3de96518abcdc635843aa455577e08))
* add nextjs generator ([241f9fb](https://github.com/christophehurpeau/pob/commit/241f9fbc1cb4a7cc66cd8dc7b652913b30c32ebb))
* move npmignore to its own generator ([c3bb4cd](https://github.com/christophehurpeau/pob/commit/c3bb4cd457744e15d5c17c17f87ddc9dfe0ecd52))
* print version ([84b4108](https://github.com/christophehurpeau/pob/commit/84b41082285e0da97bc184835787760e28311ccb))
* rename confising type to project ([787b7e6](https://github.com/christophehurpeau/pob/commit/787b7e6429e0a2681b585e7b8f0fbc7fbe62d0e7))
* update actions/checkout to v2 ([81dfba4](https://github.com/christophehurpeau/pob/commit/81dfba469fbe8a8435788d2279baffad99819e36))
* update next gitignore config ([33c0760](https://github.com/christophehurpeau/pob/commit/33c0760824c586f6ca12fa43b0bc29cdb7c08a15))
* update node versions in circleci ([cf5d76d](https://github.com/christophehurpeau/pob/commit/cf5d76de5990b82cfff32a7a31e183c260b1453f))
* update pob eslint config ([#466](https://github.com/christophehurpeau/pob/issues/466)) ([fefb4a7](https://github.com/christophehurpeau/pob/commit/fefb4a71a77029c20bf833a5a23668a3174a7c79))
* yarn generator for yarn 2 and fixes for yarn 2 ([1ff23bb](https://github.com/christophehurpeau/pob/commit/1ff23bbf03e9d068448ef220992bb6271368797a))





## [5.8.3](https://github.com/christophehurpeau/pob/compare/pob@5.8.2...pob@5.8.3) (2020-02-13)

**Note:** Version bump only for package pob





## [5.8.2](https://github.com/christophehurpeau/pob/compare/pob@5.8.1...pob@5.8.2) (2020-02-12)


### Bug Fixes

* repo name based on pkg name ([b26974c](https://github.com/christophehurpeau/pob/commit/b26974c5ad9262afc5d7d46756ee6749b62490e7))





## [5.8.1](https://github.com/christophehurpeau/pob/compare/pob@5.8.0...pob@5.8.1) (2020-02-07)


### Bug Fixes

* dont use cross-env in yarn 2 ([5c434e6](https://github.com/christophehurpeau/pob/commit/5c434e6a1b62f4f6f4aa69b71048e072f8120af1))





# [5.8.0](https://github.com/christophehurpeau/pob/compare/pob@5.7.0...pob@5.8.0) (2020-02-07)


### Features

* run prettier on README.md ([2b43ba0](https://github.com/christophehurpeau/pob/commit/2b43ba0c07dfea9f991d88af9daf7b852853a4fa))





# [5.7.0](https://github.com/christophehurpeau/pob/compare/pob@5.6.0...pob@5.7.0) (2020-02-07)


### Features

* @pob/commitlint-config ([9f25dc0](https://github.com/christophehurpeau/pob/commit/9f25dc055bb811103c2b38d25dd7361991116710))





# [5.6.0](https://github.com/christophehurpeau/pob/compare/pob@5.5.1...pob@5.6.0) (2020-02-07)


### Features

* drop @pob/version ([9434645](https://github.com/christophehurpeau/pob/commit/943464578db5ad52c2d446e55bd1d8e49ee0e768))





## [5.5.1](https://github.com/christophehurpeau/pob/compare/pob@5.5.0...pob@5.5.1) (2020-02-07)

**Note:** Version bump only for package pob





# [5.5.0](https://github.com/christophehurpeau/pob/compare/pob@5.4.3...pob@5.5.0) (2020-02-07)


### Bug Fixes

* format json without parser option ([765bfcf](https://github.com/christophehurpeau/pob/commit/765bfcfd70e90c208d8c6e95d5f27c477ace2328))


### Features

* add eslint peerdeps for yarn 2 ([3f062fd](https://github.com/christophehurpeau/pob/commit/3f062fdf32611a4536f2ae75006094c509212c34))
* eslint monorepo config ([d962a0e](https://github.com/christophehurpeau/pob/commit/d962a0e158001d039d72a7f1bababd699c782d58))
* improve ci config ([ae962d2](https://github.com/christophehurpeau/pob/commit/ae962d28f981924d968d7841dc7ea5b599ec2601))
* monorepo eslint ([7fcf874](https://github.com/christophehurpeau/pob/commit/7fcf87491cf92231fed13b65fc8e1a19b5ec79aa))
* remame monorepo package name ([566e842](https://github.com/christophehurpeau/pob/commit/566e842f1cf4ac8a15a8fc304ef2ed42f8ceb055))
* update eslint pob config packages ([a8a808b](https://github.com/christophehurpeau/pob/commit/a8a808bedd34983165f981d069af59bdbf5487e2))
* update node in ci template ([b4f4b8b](https://github.com/christophehurpeau/pob/commit/b4f4b8bb70b85954453788bd268eead26d179f1a))
* when yarn 2, remove circleci config and use yarn install immutable ([a680608](https://github.com/christophehurpeau/pob/commit/a6806083542d0567ca5e532f710b44e44c73d00f))





## [5.4.3](https://github.com/christophehurpeau/pob/compare/pob@5.4.2...pob@5.4.3) (2020-02-04)

**Note:** Version bump only for package pob





## [5.4.2](https://github.com/christophehurpeau/pob/compare/pob@5.4.1...pob@5.4.2) (2020-02-02)

**Note:** Version bump only for package pob





## [5.4.1](https://github.com/christophehurpeau/pob/compare/pob@5.4.0...pob@5.4.1) (2020-02-02)

**Note:** Version bump only for package pob





# [5.4.0](https://github.com/christophehurpeau/pob/compare/pob@5.3.0...pob@5.4.0) (2020-02-02)


### Bug Fixes

* **pob:** use sortPkg in package utils ([2dc4a7d](https://github.com/christophehurpeau/pob/commit/2dc4a7d475e79247965e8e5020595f1cdf36a3c5))
* comma in tsconfig.build.json ([a4ed181](https://github.com/christophehurpeau/pob/commit/a4ed1814e07a2b4cf59deed1109d77fd7a80db86))


### Features

* add sort-object and sort-pkg ([6bf2cc9](https://github.com/christophehurpeau/pob/commit/6bf2cc9f1b9996d1c3016efcf9c605d4f3e22712))
* husky 4 ([94b6a3c](https://github.com/christophehurpeau/pob/commit/94b6a3c65429625deadaef5d24f871c56fd4bbd8))
* update dependencies ([6b50d85](https://github.com/christophehurpeau/pob/commit/6b50d85e261efae67c33997ba79c9b9004327f15))
* update eslint configs ([2add77e](https://github.com/christophehurpeau/pob/commit/2add77e6fa5d81065cec87007ae54b22921de3c5))
* use tsconfig.doc.json to pass arguments to typedoc ([2adfee9](https://github.com/christophehurpeau/pob/commit/2adfee9ad4a5aab85ad73da41b870225a0150ac6))





# [5.3.0](https://github.com/christophehurpeau/pob/compare/pob@5.2.0...pob@5.3.0) (2019-12-29)


### Bug Fixes

* remove duplicated yarn-error.log delete ([e357d9e](https://github.com/christophehurpeau/pob/commit/e357d9e6e8f44d1a8c71f001b8d55658431cec5b))


### Features

* update minor dependencies ([6c02a4d](https://github.com/christophehurpeau/pob/commit/6c02a4d9129c9913895d058665733edd9471306b))
* update semver dependencies ([d345b7f](https://github.com/christophehurpeau/pob/commit/d345b7fdd002a67e289953be3e9217f1aa82d55d))





# [5.2.0](https://github.com/christophehurpeau/pob/compare/pob@5.1.1...pob@5.2.0) (2019-12-16)


### Features

* update minor dependencies ([2177d37](https://github.com/christophehurpeau/pob/commit/2177d37e9040a35f09dfcfd974692cd60e78e086))





## [5.1.1](https://github.com/christophehurpeau/pob/compare/pob@5.1.0...pob@5.1.1) (2019-12-15)

**Note:** Version bump only for package pob





# [5.1.0](https://github.com/christophehurpeau/pob/compare/pob@5.0.3...pob@5.1.0) (2019-12-15)


### Bug Fixes

* apps with typescript ([088f862](https://github.com/christophehurpeau/pob/commit/088f862c979aa12c78348724472b11ce7a12d89d))
* entry template ([338e749](https://github.com/christophehurpeau/pob/commit/338e74948443807f3717e5cf06b581db0dd6d955))
* monorepoPackageNames.forEach on non ts repo ([1b24c62](https://github.com/christophehurpeau/pob/commit/1b24c623b262de86ff3a140dc44d5ee42a641323))
* tsconfig build config ([b9a1aac](https://github.com/christophehurpeau/pob/commit/b9a1aac8ee742c0975bacb0a6acd64f643b74181))


### Features

* use const in entry point ([3cb3a25](https://github.com/christophehurpeau/pob/commit/3cb3a253f3594aa99d6650b2bb451933f0d84c01))





## [5.0.3](https://github.com/christophehurpeau/pob/compare/pob@5.0.2...pob@5.0.3) (2019-12-14)

**Note:** Version bump only for package pob





## [5.0.2](https://github.com/christophehurpeau/pob/compare/pob@5.0.1...pob@5.0.2) (2019-12-14)


### Bug Fixes

* gitignore withBabel option ([2a73afb](https://github.com/christophehurpeau/pob/commit/2a73afb058e9b50c0e82947a03f37a21758bb824))
* remove lerna suffix in github ([3e17992](https://github.com/christophehurpeau/pob/commit/3e1799221a60a48745fb869291bdaa2e5fe6a9a6))





## [5.0.1](https://github.com/christophehurpeau/pob/compare/pob@5.0.0...pob@5.0.1) (2019-12-14)


### Bug Fixes

* add use strict in lint-staged config template ([7cce912](https://github.com/christophehurpeau/pob/commit/7cce912b5fa96428112111ce9721cb4c97f4495f))





# [5.0.0](https://github.com/christophehurpeau/pob/compare/pob@4.37.5...pob@5.0.0) (2019-12-13)


### Bug Fixes

* when pkg.pob doesnt exists ([0e640ef](https://github.com/christophehurpeau/pob/commit/0e640ef2b7397d0df646191208a94332ae65dc00))
* **deps:** update dependency update-notifier to v4 ([#363](https://github.com/christophehurpeau/pob/issues/363)) ([0c12671](https://github.com/christophehurpeau/pob/commit/0c1267166078a99f2cf0a83b90806a45bee53b7f))
* package path ([aa6dcbb](https://github.com/christophehurpeau/pob/commit/aa6dcbb6944517791022b7321cd7c6cd8f9364fe))
* require min node 8 version to 8.9 ([ba50c8f](https://github.com/christophehurpeau/pob/commit/ba50c8f663dea3a3307167b63d6ccafb1240229e))


### Features

* add nullish-coalescing-operator and optional-chaining ([fca6e0b](https://github.com/christophehurpeau/pob/commit/fca6e0b6ddfd5b5851134fa0cdbb1eb56930c8d4))
* fix tsconfig.json and improve scripts ([1699a01](https://github.com/christophehurpeau/pob/commit/1699a015fe072f72cf29709c5283e90f4db2d8cb))
* github workflow and improve npmignore/githubignore ([4141004](https://github.com/christophehurpeau/pob/commit/4141004e09f6e8f50b06ca01a13af684e68cd807))
* support scripts and migrations directories ([7e44dec](https://github.com/christophehurpeau/pob/commit/7e44decf62f5f664a06a9cbb87db51bea86dbac6))
* ts config use paths ([9833937](https://github.com/christophehurpeau/pob/commit/9833937af285b9e6e899db08d9df31516bb2fbc6))
* update node 12 in circleci template ([129b51f](https://github.com/christophehurpeau/pob/commit/129b51f2b9d0c9ec092cb2e2dc222a137115b2e1))
* update to got 10 ([7953f8f](https://github.com/christophehurpeau/pob/commit/7953f8ffb77822775ae1244c0c32b4fd3fe187f0))


### BREAKING CHANGES

* drop node 8





## [4.37.5](https://github.com/christophehurpeau/pob/compare/pob@4.37.4...pob@4.37.5) (2019-09-14)


### Bug Fixes

* remove error logs and yarn.lock inside monorepos ([ab94511](https://github.com/christophehurpeau/pob/commit/ab94511))





## [4.37.4](https://github.com/christophehurpeau/pob/compare/pob@4.37.3...pob@4.37.4) (2019-09-13)

**Note:** Version bump only for package pob





## [4.37.3](https://github.com/christophehurpeau/pob/compare/pob@4.37.2...pob@4.37.3) (2019-09-13)

**Note:** Version bump only for package pob





## [4.37.2](https://github.com/christophehurpeau/pob/compare/pob@4.37.1...pob@4.37.2) (2019-09-13)


### Bug Fixes

* update to node 12.10 in circleci template ([f7a0d44](https://github.com/christophehurpeau/pob/commit/f7a0d44))





## [4.37.1](https://github.com/christophehurpeau/pob/compare/pob@4.37.0...pob@4.37.1) (2019-09-13)

**Note:** Version bump only for package pob





# [4.37.0](https://github.com/christophehurpeau/pob/compare/pob@4.35.0...pob@4.37.0) (2019-09-13)


### Bug Fixes

* author url in package ([b838c43](https://github.com/christophehurpeau/pob/commit/b838c43))
* config from pob in package ([1ab4697](https://github.com/christophehurpeau/pob/commit/1ab4697))
* pob fixes ([7cf9b35](https://github.com/christophehurpeau/pob/commit/7cf9b35))
* prefix, typescript, eslintignore ([f6ea134](https://github.com/christophehurpeau/pob/commit/f6ea134))
* self update ([02173ba](https://github.com/christophehurpeau/pob/commit/02173ba))
* update node 12 ([d806ea4](https://github.com/christophehurpeau/pob/commit/d806ea4))
* **deps:** update dependency findup-sync to v4 ([#244](https://github.com/christophehurpeau/pob/issues/244)) ([493fee9](https://github.com/christophehurpeau/pob/commit/493fee9))


### Features

* update pob eslint config ([6e00b7a](https://github.com/christophehurpeau/pob/commit/6e00b7a))





# [4.36.0](https://github.com/christophehurpeau/pob/compare/pob@4.35.0...pob@4.36.0) (2019-08-30)


### Bug Fixes

* author url in package ([b838c43](https://github.com/christophehurpeau/pob/commit/b838c43))
* config from pob in package ([1ab4697](https://github.com/christophehurpeau/pob/commit/1ab4697))
* pob fixes ([7cf9b35](https://github.com/christophehurpeau/pob/commit/7cf9b35))
* self update ([02173ba](https://github.com/christophehurpeau/pob/commit/02173ba))
* update node 12 ([d806ea4](https://github.com/christophehurpeau/pob/commit/d806ea4))
* **deps:** update dependency findup-sync to v4 ([#244](https://github.com/christophehurpeau/pob/issues/244)) ([493fee9](https://github.com/christophehurpeau/pob/commit/493fee9))


### Features

* update pob eslint config ([6e00b7a](https://github.com/christophehurpeau/pob/commit/6e00b7a))





# [4.35.0](https://github.com/christophehurpeau/pob/compare/pob@4.34.0...pob@4.35.0) (2019-08-29)


### Bug Fixes

* remove build definitions for apps ([8642fe6](https://github.com/christophehurpeau/pob/commit/8642fe6))


### Features

* @pob/repo-config ([95f61c4](https://github.com/christophehurpeau/pob/commit/95f61c4))
* workspaces for scoped packages ([c85fd52](https://github.com/christophehurpeau/pob/commit/c85fd52))





# [4.34.0](https://github.com/christophehurpeau/pob/compare/pob@4.33.2...pob@4.34.0) (2019-07-28)


### Features

* add node app with babel generator ([7992b82](https://github.com/christophehurpeau/pob/commit/7992b82))





## [4.33.2](https://github.com/christophehurpeau/pob/compare/pob@4.33.1...pob@4.33.2) (2019-07-27)

**Note:** Version bump only for package pob





## [4.33.1](https://github.com/christophehurpeau/pob/compare/pob@4.33.0...pob@4.33.1) (2019-07-27)


### Bug Fixes

* babel generator babelEnvs can be undefined ([c6ab93b](https://github.com/christophehurpeau/pob/commit/c6ab93b))
* babel generator when pob not fully in package.json ([4b75887](https://github.com/christophehurpeau/pob/commit/4b75887))





# [4.33.0](https://github.com/christophehurpeau/pob/compare/pob@4.32.1...pob@4.33.0) (2019-07-27)


### Bug Fixes

* babel option in format-lint ([ec1d6ab](https://github.com/christophehurpeau/pob/commit/ec1d6ab))
* remove debug console.log in git generator ([bf82209](https://github.com/christophehurpeau/pob/commit/bf82209))


### Features

* move babelEnvs and entries to package.json ([9aa1966](https://github.com/christophehurpeau/pob/commit/9aa1966))





## [4.32.1](https://github.com/christophehurpeau/pob/compare/pob@4.32.0...pob@4.32.1) (2019-07-12)

**Note:** Version bump only for package pob





# [4.32.0](https://github.com/christophehurpeau/pob/compare/pob@4.31.0...pob@4.32.0) (2019-07-12)


### Bug Fixes

* typescript config build when not composite ([2ad691e](https://github.com/christophehurpeau/pob/commit/2ad691e))


### Features

* add @pob/version for future use ([3b74e5b](https://github.com/christophehurpeau/pob/commit/3b74e5b))





# [4.31.0](https://github.com/christophehurpeau/pob/compare/pob@4.30.0...pob@4.31.0) (2019-07-12)


### Bug Fixes

* eslint issues ([651d057](https://github.com/christophehurpeau/pob/commit/651d057))
* **deps:** update dependency update-notifier to v3 ([#209](https://github.com/christophehurpeau/pob/issues/209)) ([88cf2f8](https://github.com/christophehurpeau/pob/commit/88cf2f8))
* **deps:** update dependency yeoman-generator to v4 ([#206](https://github.com/christophehurpeau/pob/issues/206)) ([f563841](https://github.com/christophehurpeau/pob/commit/f563841))
* lerna package sort ([5632342](https://github.com/christophehurpeau/pob/commit/5632342))
* missing husky + old-deps in monorepo ([a349c52](https://github.com/christophehurpeau/pob/commit/a349c52))
* on doesnt exists ([52eaf76](https://github.com/christophehurpeau/pob/commit/52eaf76))
* **deps:** update dependency yeoman-generator to v3 ([#9](https://github.com/christophehurpeau/pob/issues/9)) ([44d34a1](https://github.com/christophehurpeau/pob/commit/44d34a1))
* some issues in generators ([23372c9](https://github.com/christophehurpeau/pob/commit/23372c9))


### Features

* faster jest tests when node only ([7dcd56f](https://github.com/christophehurpeau/pob/commit/7dcd56f))
* update node versions in circleci template ([ceb6ddf](https://github.com/christophehurpeau/pob/commit/ceb6ddf))
* update to node 12.6 ([4336e8a](https://github.com/christophehurpeau/pob/commit/4336e8a))
* use new lerna option create-release=github ([e61e9b7](https://github.com/christophehurpeau/pob/commit/e61e9b7))





# [4.30.0](https://github.com/christophehurpeau/pob/compare/pob@4.29.4...pob@4.30.0) (2019-05-01)


### Features

* add parserOptions for typescript eslint plugin ([ac959e4](https://github.com/christophehurpeau/pob/commit/ac959e4))
* update node 11 in circleci template ([2baf095](https://github.com/christophehurpeau/pob/commit/2baf095))
* update node 8 in circleci template ([ea8acaa](https://github.com/christophehurpeau/pob/commit/ea8acaa))





## [4.29.4](https://github.com/christophehurpeau/pob/compare/pob@4.29.3...pob@4.29.4) (2019-04-29)

**Note:** Version bump only for package pob





## [4.29.3](https://github.com/christophehurpeau/pob/compare/pob@4.29.2...pob@4.29.3) (2019-04-26)


### Bug Fixes

* format-lint not in lerna ([8822e07](https://github.com/christophehurpeau/pob/commit/8822e07))





## [4.29.2](https://github.com/christophehurpeau/pob/compare/pob@4.29.1...pob@4.29.2) (2019-04-20)


### Bug Fixes

* ignore tsbuildinfo ([9b26f6b](https://github.com/christophehurpeau/pob/commit/9b26f6b))





## [4.29.1](https://github.com/christophehurpeau/pob/compare/pob@4.29.0...pob@4.29.1) (2019-04-20)


### Bug Fixes

* yarn needs two -- ([14fcf20](https://github.com/christophehurpeau/pob/commit/14fcf20))





# [4.29.0](https://github.com/christophehurpeau/pob/compare/pob@4.28.0...pob@4.29.0) (2019-04-20)


### Features

* add --no-clean ([ed52c11](https://github.com/christophehurpeau/pob/commit/ed52c11))





# [4.28.0](https://github.com/christophehurpeau/pob/compare/pob@4.27.0...pob@4.28.0) (2019-04-19)


### Bug Fixes

* path tsbuildinfo ([18251de](https://github.com/christophehurpeau/pob/commit/18251de))
* **deps:** update dependency github-username to v5 ([#172](https://github.com/christophehurpeau/pob/issues/172)) ([00eeb2f](https://github.com/christophehurpeau/pob/commit/00eeb2f))


### Features

* **deps:** update dependency prettier to v1.17.0 ([#170](https://github.com/christophehurpeau/pob/issues/170)) ([2c36033](https://github.com/christophehurpeau/pob/commit/2c36033))
* update typescript project ([346ae08](https://github.com/christophehurpeau/pob/commit/346ae08))





# [4.27.0](https://github.com/christophehurpeau/pob/compare/pob@4.26.0...pob@4.27.0) (2019-04-05)


### Features

* update eslint config pob ([9d6980d](https://github.com/christophehurpeau/pob/commit/9d6980d))





# [4.26.0](https://github.com/christophehurpeau/pob/compare/pob@4.25.2...pob@4.26.0) (2019-04-05)


### Features

* self pob ([79da71e](https://github.com/christophehurpeau/pob/commit/79da71e))
* update eslint pob config ([14e5df1](https://github.com/christophehurpeau/pob/commit/14e5df1))





## [4.25.2](https://github.com/christophehurpeau/pob/compare/pob@4.25.1...pob@4.25.2) (2019-04-05)

**Note:** Version bump only for package pob





## [4.25.1](https://github.com/christophehurpeau/pob/compare/pob@4.25.0...pob@4.25.1) (2019-04-05)

**Note:** Version bump only for package pob





# [4.25.0](https://github.com/christophehurpeau/pob/compare/pob@4.24.0...pob@4.25.0) (2019-04-05)


### Bug Fixes

* tsconfig comma ([7e8e4b5](https://github.com/christophehurpeau/pob/commit/7e8e4b5))


### Features

* add app pobpack and other ([b2ab40c](https://github.com/christophehurpeau/pob/commit/b2ab40c))
* lerna dont lint or build everything on release ([1ab5b78](https://github.com/christophehurpeau/pob/commit/1ab5b78))
* update ci node to 11.13 ([bc27295](https://github.com/christophehurpeau/pob/commit/bc27295))
* update deps ([aa5d8aa](https://github.com/christophehurpeau/pob/commit/aa5d8aa))





# [4.24.0](https://github.com/christophehurpeau/pob/compare/pob@4.23.1...pob@4.24.0) (2019-03-21)


### Features

* remove ts-jest and standard ([41b98c4](https://github.com/christophehurpeau/pob/commit/41b98c4))
* update circleci config node 11.11 ([80a7072](https://github.com/christophehurpeau/pob/commit/80a7072))
* update update node 11 to 11.12 ([cd32b80](https://github.com/christophehurpeau/pob/commit/cd32b80))





## [4.23.1](https://github.com/christophehurpeau/pob/compare/pob@4.23.0...pob@4.23.1) (2019-03-09)


### Bug Fixes

* enableRenovateConfig ([6d6c349](https://github.com/christophehurpeau/pob/commit/6d6c349))
* pkg.description lerna ([79199d8](https://github.com/christophehurpeau/pob/commit/79199d8))





# [4.23.0](https://github.com/christophehurpeau/pob/compare/pob@4.22.1...pob@4.23.0) (2019-03-09)


### Bug Fixes

* fallback when config is old or doesnt exits ([3dce85f](https://github.com/christophehurpeau/pob/commit/3dce85f))
* fallback when package.repository.directory doesnt exists ([f5d7807](https://github.com/christophehurpeau/pob/commit/f5d7807))
* paths gitignore false ([d956a9a](https://github.com/christophehurpeau/pob/commit/d956a9a))
* remove prepublishOnly and pob-release dep in lerna ([c950ae8](https://github.com/christophehurpeau/pob/commit/c950ae8))
* use HUSKY_GIT_PARAMS ([f73e350](https://github.com/christophehurpeau/pob/commit/f73e350))


### Features

* add @pob/renovate-config ([548a6a4](https://github.com/christophehurpeau/pob/commit/548a6a4))
* add plugin babel-plugin-transform-builtins ([c43ec93](https://github.com/christophehurpeau/pob/commit/c43ec93))
* enable no sideEffects by default ([2c2d146](https://github.com/christophehurpeau/pob/commit/2c2d146))
* improve app generator and tsconfig ([c3f7058](https://github.com/christophehurpeau/pob/commit/c3f7058))
* support orniganisations ([d6284f5](https://github.com/christophehurpeau/pob/commit/d6284f5))
* use @pob/eslint-config* ([f130afb](https://github.com/christophehurpeau/pob/commit/f130afb))





## [4.22.1](https://github.com/christophehurpeau/pob/compare/pob@4.22.0...pob@4.22.1) (2019-02-23)


### Bug Fixes

* avoid issues with yarn-update-lock running twice when both package.json and yarn.lock are modified ([53d10b7](https://github.com/christophehurpeau/pob/commit/53d10b7))
* run preversion at the end instead of just build ([70fdfbe](https://github.com/christophehurpeau/pob/commit/70fdfbe))
* try/catch parse error eslint config ([09c7432](https://github.com/christophehurpeau/pob/commit/09c7432))
* typedoc gitRevision ([401dcb8](https://github.com/christophehurpeau/pob/commit/401dcb8))





# [4.22.0](https://github.com/christophehurpeau/pob/compare/pob@4.21.2...pob@4.22.0) (2019-02-17)


### Bug Fixes

* nojekyll for github pages ([b00cad8](https://github.com/christophehurpeau/pob/commit/b00cad8))
* run preversion at the end instead of just build ([9203d50](https://github.com/christophehurpeau/pob/commit/9203d50))


### Features

* reenable repository-check-dirty in ci ([42867d5](https://github.com/christophehurpeau/pob/commit/42867d5))





## [4.21.2](https://github.com/christophehurpeau/pob/compare/pob@4.21.1...pob@4.21.2) (2019-02-17)

**Note:** Version bump only for package pob





## [4.21.1](https://github.com/christophehurpeau/pob/compare/pob@4.21.0...pob@4.21.1) (2019-02-17)

**Note:** Version bump only for package pob





# [4.21.0](https://github.com/christophehurpeau/pob/compare/pob@4.20.1...pob@4.21.0) (2019-02-17)


### Bug Fixes

* david-dm svg url in lerna ([2e6b7dd](https://github.com/christophehurpeau/pob/commit/2e6b7dd))
* remove dependencyci ([c70acd8](https://github.com/christophehurpeau/pob/commit/c70acd8))
* special cases for eslint-config-pob ([97fb5e5](https://github.com/christophehurpeau/pob/commit/97fb5e5))


### Features

* remove clean script for non babel projets ([26b8754](https://github.com/christophehurpeau/pob/commit/26b8754))
* repository-check-dirty and custom coverage reporter ([f1f061d](https://github.com/christophehurpeau/pob/commit/f1f061d))





## [4.20.1](https://github.com/christophehurpeau/pob/compare/pob@4.20.0...pob@4.20.1) (2019-02-15)

**Note:** Version bump only for package pob





# [4.20.0](https://github.com/christophehurpeau/pob/compare/pob@4.19.1...pob@4.20.0) (2019-02-15)


### Bug Fixes

* issue when adding dependencies without existing ([81fa34a](https://github.com/christophehurpeau/pob/commit/81fa34a))


### Features

* support package.json repository.directory ([1a08b0c](https://github.com/christophehurpeau/pob/commit/1a08b0c))





## [4.19.1](https://github.com/christophehurpeau/pob/compare/pob@4.19.0...pob@4.19.1) (2019-02-11)


### Bug Fixes

* add yarn-update-lock in pob-dependencies ([f74096a](https://github.com/christophehurpeau/pob/commit/f74096a))





# [4.19.0](https://github.com/christophehurpeau/pob/compare/pob@4.18.0...pob@4.19.0) (2019-02-11)


### Features

* add yarn-update-lock in lint-staged ([baef244](https://github.com/christophehurpeau/pob/commit/baef244))





# [4.18.0](https://github.com/christophehurpeau/pob/compare/pob@4.17.1...pob@4.18.0) (2019-02-11)


### Bug Fixes

* add lib esnext for typing libs ([e15e444](https://github.com/christophehurpeau/pob/commit/e15e444))
* dont remove devDependency if has peerDependency ([169def7](https://github.com/christophehurpeau/pob/commit/169def7))
* generator issues with simple libs ([9ea7398](https://github.com/christophehurpeau/pob/commit/9ea7398))
* inLerna root ([318de25](https://github.com/christophehurpeau/pob/commit/318de25))
* pob-dependencies move eslint-plugin-react-hooks to devDeps ([6465300](https://github.com/christophehurpeau/pob/commit/6465300))
* preversion build has postbuild ([93e4dbe](https://github.com/christophehurpeau/pob/commit/93e4dbe))


### Features

* clean tsconfig.json ([47969cb](https://github.com/christophehurpeau/pob/commit/47969cb))
* tsconfig.json lib esnext ([be89e66](https://github.com/christophehurpeau/pob/commit/be89e66))
* update circleci node v11 to 11.9 ([7803e3c](https://github.com/christophehurpeau/pob/commit/7803e3c))





## [4.17.1](https://github.com/christophehurpeau/pob/compare/pob@4.17.0...pob@4.17.1) (2019-02-08)


### Bug Fixes

* enable github-release when publishing with lerna ([ede3f9b](https://github.com/christophehurpeau/pob/commit/ede3f9b))





# [4.17.0](https://github.com/christophehurpeau/pob/compare/pob@4.16.2...pob@4.17.0) (2019-02-08)


### Bug Fixes

* **deps:** update dependency prettier to v1.16.4 ([#88](https://github.com/christophehurpeau/pob/issues/88)) ([d33897a](https://github.com/christophehurpeau/pob/commit/d33897a))
* no need for babel-core since jest 24 ([92c6e6d](https://github.com/christophehurpeau/pob/commit/92c6e6d))


### Features

* enable github release ([39b3277](https://github.com/christophehurpeau/pob/commit/39b3277))





## [4.16.2](https://github.com/christophehurpeau/pob/compare/pob@4.16.1...pob@4.16.2) (2019-02-02)


### Bug Fixes

* add build:definitions script to check /lib/index.d.ts ([a8ebea0](https://github.com/christophehurpeau/pob/commit/a8ebea0))





## [4.16.1](https://github.com/christophehurpeau/pob/compare/pob@4.16.0...pob@4.16.1) (2019-02-02)


### Bug Fixes

* monorepo updateonly ([cd41bd3](https://github.com/christophehurpeau/pob/commit/cd41bd3))





# [4.16.0](https://github.com/christophehurpeau/pob/compare/pob@4.15.1...pob@4.16.0) (2019-02-02)


### Bug Fixes

* ignore dependencies for special packages ([da31e74](https://github.com/christophehurpeau/pob/commit/da31e74))
* **deps:** update dependency findup-sync to v3 ([#47](https://github.com/christophehurpeau/pob/issues/47)) ([225f264](https://github.com/christophehurpeau/pob/commit/225f264))
* **deps:** update dependency prettier to v1.16.0 ([#69](https://github.com/christophehurpeau/pob/issues/69)) ([ee9f224](https://github.com/christophehurpeau/pob/commit/ee9f224))
* **deps:** update dependency prettier to v1.16.3 ([#74](https://github.com/christophehurpeau/pob/issues/74)) ([3cd2969](https://github.com/christophehurpeau/pob/commit/3cd2969))


### Features

* add sideEffects in package sort ([6a42045](https://github.com/christophehurpeau/pob/commit/6a42045))
* monorepo generator ([3d7c353](https://github.com/christophehurpeau/pob/commit/3d7c353))
* typescript-eslint ([5650b3b](https://github.com/christophehurpeau/pob/commit/5650b3b))





## [4.15.1](https://github.com/christophehurpeau/pob/compare/pob@4.15.0...pob@4.15.1) (2018-12-23)

**Note:** Version bump only for package pob





# [4.15.0](https://github.com/christophehurpeau/pob/compare/pob@4.14.2...pob@4.15.0) (2018-12-21)


### Bug Fixes

* always use npm to publish with lerna ([2936a13](https://github.com/christophehurpeau/pob/commit/2936a13))


### Features

* add devPeerDependencies and move peerDep before deps ([685df3c](https://github.com/christophehurpeau/pob/commit/685df3c))
* support /browser import ([375ba5a](https://github.com/christophehurpeau/pob/commit/375ba5a))





## [4.14.2](https://github.com/christophehurpeau/pob/compare/pob@4.14.1...pob@4.14.2) (2018-12-16)

**Note:** Version bump only for package pob





## [4.14.1](https://github.com/christophehurpeau/pob/compare/pob@4.14.0...pob@4.14.1) (2018-12-16)

**Note:** Version bump only for package pob





# [4.14.0](https://github.com/christophehurpeau/pob/compare/pob@4.13.0...pob@4.14.0) (2018-12-15)


### Bug Fixes

* devDep always cleaned ([72e351a](https://github.com/christophehurpeau/pob/commit/72e351a))
* dont create src folder when no babel envs ([4a76c9c](https://github.com/christophehurpeau/pob/commit/4a76c9c))
* eslint babel-node when every env is for node ([081ec3b](https://github.com/christophehurpeau/pob/commit/081ec3b))
* main entry when no cjs format ([bf67291](https://github.com/christophehurpeau/pob/commit/bf67291))
* main es for non cjs formats ([cf3f046](https://github.com/christophehurpeau/pob/commit/cf3f046))
* pkg module:node-dev path ([3850905](https://github.com/christophehurpeau/pob/commit/3850905))
* remove no tests script ([5940d86](https://github.com/christophehurpeau/pob/commit/5940d86))


### Features

* add --force option ([46bf4a5](https://github.com/christophehurpeau/pob/commit/46bf4a5))
* clean json prettier format and sort eslint config ([7b4141b](https://github.com/christophehurpeau/pob/commit/7b4141b))
* enable strictBindCallApply in ts config ([bfa0668](https://github.com/christophehurpeau/pob/commit/bfa0668))
* update docker node image to 10.14 ([9618d22](https://github.com/christophehurpeau/pob/commit/9618d22))





# [4.13.0](https://github.com/christophehurpeau/pob/compare/pob@4.12.0...pob@4.13.0) (2018-11-24)


### Bug Fixes

* always use fixed version in devDependencies ([0332e8b](https://github.com/christophehurpeau/pob/commit/0332e8b))


### Features

* drop node 6 ([7530034](https://github.com/christophehurpeau/pob/commit/7530034))





# [4.12.0](https://github.com/christophehurpeau/pob/compare/pob@4.11.2...pob@4.12.0) (2018-11-16)


### Bug Fixes

* delete postrewrite ([1f18648](https://github.com/christophehurpeau/pob/commit/1f18648))
* lerna prevent parallel builds ([67e57d5](https://github.com/christophehurpeau/pob/commit/67e57d5))
* remove No x script for build and watch ([6cc6eee](https://github.com/christophehurpeau/pob/commit/6cc6eee))


### Features

* add yarn.lock in npmignore ([dfe8612](https://github.com/christophehurpeau/pob/commit/dfe8612))
* clean gitignore ([ca51cab](https://github.com/christophehurpeau/pob/commit/ca51cab))
* deps, circleci and app ([9bcab60](https://github.com/christophehurpeau/pob/commit/9bcab60))
* update dependencies ([40fdb05](https://github.com/christophehurpeau/pob/commit/40fdb05))
* update eslint ([b6d1bd2](https://github.com/christophehurpeau/pob/commit/b6d1bd2))





## [4.11.2](https://github.com/christophehurpeau/pob/compare/pob@4.11.1...pob@4.11.2) (2018-10-09)


### Bug Fixes

* husky install command changed ([1391bf6](https://github.com/christophehurpeau/pob/commit/1391bf6))
* typedoc dependency ([64b38c4](https://github.com/christophehurpeau/pob/commit/64b38c4))





## [4.11.1](https://github.com/christophehurpeau/pob/compare/pob@4.11.0...pob@4.11.1) (2018-10-09)


### Bug Fixes

* add husky in package order ([b55ad60](https://github.com/christophehurpeau/pob/commit/b55ad60))





# [4.11.0](https://github.com/christophehurpeau/pob/compare/pob@4.10.0...pob@4.11.0) (2018-10-09)


### Features

* import babel-core only for babel-jest ([7850139](https://github.com/christophehurpeau/pob/commit/7850139))
* pob-dependencies package ([ec085ce](https://github.com/christophehurpeau/pob/commit/ec085ce))
* update dependencies ([f52b87b](https://github.com/christophehurpeau/pob/commit/f52b87b))
* update deps and husky ([f3cb82d](https://github.com/christophehurpeau/pob/commit/f3cb82d))
* update pob-babel 23.2.3 ([2f6c88d](https://github.com/christophehurpeau/pob/commit/2f6c88d))





<a name="4.10.0"></a>
# [4.10.0](https://github.com/christophehurpeau/pob/compare/pob@4.9.1...pob@4.10.0) (2018-08-31)


### Features

* update [@commitlint](https://github.com/commitlint) ([f5fc744](https://github.com/christophehurpeau/pob/commit/f5fc744))
* update [@types](https://github.com/types)/jest ([c79ff1b](https://github.com/christophehurpeau/pob/commit/c79ff1b))
* update babel-eslint ([056e26c](https://github.com/christophehurpeau/pob/commit/056e26c))
* update babel-jest ([e83e3ab](https://github.com/christophehurpeau/pob/commit/e83e3ab))
* update lerna ([807dfb2](https://github.com/christophehurpeau/pob/commit/807dfb2))
* update typescript ([4adfcb0](https://github.com/christophehurpeau/pob/commit/4adfcb0))





<a name="4.9.1"></a>
## [4.9.1](https://github.com/christophehurpeau/pob/compare/pob@4.9.0...pob@4.9.1) (2018-08-31)

**Note:** Version bump only for package pob





<a name="4.9.0"></a>
# [4.9.0](https://github.com/christophehurpeau/pob/compare/pob@4.8.0...pob@4.9.0) (2018-08-31)


### Features

* babel 7.0.0 ([a65728b](https://github.com/christophehurpeau/pob/commit/a65728b))
* hint npm >= 6.4 when using lerna with npm ([62f9d21](https://github.com/christophehurpeau/pob/commit/62f9d21))





<a name="4.8.0"></a>
# [4.8.0](https://github.com/christophehurpeau/pob/compare/pob@4.7.0...pob@4.8.0) (2018-08-27)


### Features

* hudge update ([afec425](https://github.com/christophehurpeau/pob/commit/afec425))
* remove docs from clean script ([a72f9ce](https://github.com/christophehurpeau/pob/commit/a72f9ce))
* **pob:** update deps ([7b8ea8d](https://github.com/christophehurpeau/pob/commit/7b8ea8d))
* **pob:** update pob-babel to 23 ([faba647](https://github.com/christophehurpeau/pob/commit/faba647))





<a name="4.7.0"></a>
# [4.7.0](https://github.com/christophehurpeau/pob/compare/pob@4.6.4...pob@4.7.0) (2018-07-24)


### Bug Fixes

* **pob:** eslint-config-pob@^21.1.1 ([ea5e433](https://github.com/christophehurpeau/pob/commit/ea5e433))


### Features

* **pob:** add typescript-check script and remove ignore examples in build ([01bc8f8](https://github.com/christophehurpeau/pob/commit/01bc8f8))
* **pob:** prettier 80 width and always arrow parens ([a592745](https://github.com/christophehurpeau/pob/commit/a592745))
* update babel 7 ([77518d7](https://github.com/christophehurpeau/pob/commit/77518d7))
* **pob:** update dependencies ([c3ba0ee](https://github.com/christophehurpeau/pob/commit/c3ba0ee))





<a name="4.6.4"></a>
## [4.6.4](https://github.com/christophehurpeau/pob/compare/pob@4.6.3...pob@4.6.4) (2018-07-06)


### Bug Fixes

* **pob-babel:** typings path ([7653d8b](https://github.com/christophehurpeau/pob/commit/7653d8b))





<a name="4.6.3"></a>
## [4.6.3](https://github.com/christophehurpeau/pob/compare/pob@4.6.2...pob@4.6.3) (2018-07-06)


### Bug Fixes

* **pob:** isolatedModules and compile ([d1da7cb](https://github.com/christophehurpeau/pob/commit/d1da7cb))





<a name="4.6.2"></a>
## [4.6.2](https://github.com/christophehurpeau/pob/compare/pob@4.6.1...pob@4.6.2) (2018-07-06)


### Bug Fixes

* **pob:** enable "isolatedModules": true to ensure babel compatibility ([9d909d6](https://github.com/christophehurpeau/pob/commit/9d909d6))





<a name="4.6.1"></a>
## [4.6.1](https://github.com/christophehurpeau/pob/compare/pob@4.6.0...pob@4.6.1) (2018-07-06)

**Note:** Version bump only for package pob





<a name="4.6.0"></a>
# [4.6.0](https://github.com/christophehurpeau/pob/compare/pob@4.5.0...pob@4.6.0) (2018-07-06)


### Features

* update dependencies ([98ccd60](https://github.com/christophehurpeau/pob/commit/98ccd60))





<a name="4.5.0"></a>
# [4.5.0](https://github.com/christophehurpeau/pob/compare/pob@4.4.0...pob@4.5.0) (2018-06-17)


### Bug Fixes

* package.json missing ([7ccf6ff](https://github.com/christophehurpeau/pob/commit/7ccf6ff))


### Features

* **pob:** update [@commitlint](https://github.com/commitlint)/cli 6.2 ([e633a86](https://github.com/christophehurpeau/pob/commit/e633a86))





<a name="4.4.0"></a>
# [4.4.0](https://github.com/christophehurpeau/pob/compare/pob@4.3.2...pob@4.4.0) (2018-04-27)


### Bug Fixes

* **pob:** use [@types](https://github.com/types)/node >= to avoid duplicates ([35269a7](https://github.com/christophehurpeau/pob/commit/35269a7))


### Features

* **pob:** lerna 3.0.0-beta.18 ([3900bf8](https://github.com/christophehurpeau/pob/commit/3900bf8))





<a name="4.3.2"></a>
## [4.3.2](https://github.com/christophehurpeau/pob/compare/pob@4.3.1...pob@4.3.2) (2018-04-27)


### Bug Fixes

* **pob-babel:** typings as a declaration file ([03cf5dc](https://github.com/christophehurpeau/pob/commit/03cf5dc))





<a name="4.3.1"></a>
## [4.3.1](https://github.com/christophehurpeau/pob/compare/pob@4.3.0...pob@4.3.1) (2018-04-27)


### Bug Fixes

* babel-plugin-pob-babel and [@types](https://github.com/types)/node version same than engines ([ce0417b](https://github.com/christophehurpeau/pob/commit/ce0417b))





<a name="4.3.0"></a>
# [4.3.0](https://github.com/christophehurpeau/pob/compare/pob@4.2.1...pob@4.3.0) (2018-04-27)


### Features

* **pob:** update pob-babel and pob-release ([8a820f1](https://github.com/christophehurpeau/pob/commit/8a820f1))





<a name="4.2.1"></a>
## [4.2.1](https://github.com/christophehurpeau/pob/compare/pob@4.2.0...pob@4.2.1) (2018-04-27)

**Note:** Version bump only for package pob





<a name="4.2.0"></a>
# [4.2.0](https://github.com/christophehurpeau/pob/compare/pob@4.1.3...pob@4.2.0) (2018-04-27)


### Bug Fixes

* lint-staged 7.0.5 ([548831b](https://github.com/christophehurpeau/pob/commit/548831b))


### Features

* babel 7 beta 46 ([4fd4a56](https://github.com/christophehurpeau/pob/commit/4fd4a56))
* **pob:** move peerDependencies before devDependencies ([d825738](https://github.com/christophehurpeau/pob/commit/d825738))
* update babel-preset-latest-node and babel-preset-modern-browsers ([e2976ea](https://github.com/christophehurpeau/pob/commit/e2976ea))





<a name="4.1.3"></a>
## [4.1.3](https://github.com/christophehurpeau/pob/compare/pob@4.1.2...pob@4.1.3) (2018-04-27)


### Bug Fixes

* **pob:** scripts can be undefined in package.json ([1a6b9bf](https://github.com/christophehurpeau/pob/commit/1a6b9bf))





<a name="4.1.2"></a>
## [4.1.2](https://github.com/christophehurpeau/pob/compare/pob@4.1.1...pob@4.1.2) (2018-04-22)


### Bug Fixes

* **pob-babel:** recursive remove inside dist before build/watch ([e67ea3b](https://github.com/christophehurpeau/pob/commit/e67ea3b))





<a name="4.1.1"></a>
## [4.1.1](https://github.com/christophehurpeau/pob/compare/pob@4.1.0...pob@4.1.1) (2018-04-21)


### Bug Fixes

* **pob-babel:** typings path ([39f506c](https://github.com/christophehurpeau/pob/commit/39f506c))





<a name="4.1.0"></a>
# [4.1.0](https://github.com/christophehurpeau/pob/compare/pob@4.0.0...pob@4.1.0) (2018-04-21)


### Bug Fixes

* typescript redeclare global fixed ([5bbe268](https://github.com/christophehurpeau/pob/commit/5bbe268))


### Features

* update lerna version to beta 3 ([daee49c](https://github.com/christophehurpeau/pob/commit/daee49c))





<a name="4.0.0"></a>
# [4.0.0](https://github.com/christophehurpeau/pob/compare/pob@3.1.1...pob@4.0.0) (2018-04-21)


### Features

* **pob:** add [@types](https://github.com/types)/jest, remove postpublish script, update pob-babel ([47a4645](https://github.com/christophehurpeau/pob/commit/47a4645))
* remove node 4, fix replacements ([4a6d3f5](https://github.com/christophehurpeau/pob/commit/4a6d3f5))


### BREAKING CHANGES

* - node 4 is no longer supported
- process.env.POB_{TARGET,TARGET_VERSION} is replaced by a global




<a name="3.1.1"></a>
## [3.1.1](https://github.com/christophehurpeau/pob/compare/pob@3.1.0...pob@3.1.1) (2018-04-21)


### Bug Fixes

* proposal-object-rest-spread is in es2018 ([5c9d896](https://github.com/christophehurpeau/pob/commit/5c9d896))




<a name="3.1.0"></a>
# [3.1.0](https://github.com/christophehurpeau/pob/compare/pob@3.0.4...pob@3.1.0) (2018-04-20)


### Features

* **pob-babel:** add typescript option and flow preset for compat ([be1249c](https://github.com/christophehurpeau/pob/commit/be1249c))




<a name="3.0.4"></a>
## [3.0.4](https://github.com/christophehurpeau/pob/compare/pob@3.0.3...pob@3.0.4) (2018-04-20)


### Bug Fixes

* update eslint-config-pob ([6174eca](https://github.com/christophehurpeau/pob/commit/6174eca))




<a name="3.0.3"></a>
## [3.0.3](https://github.com/christophehurpeau/pob/compare/pob@3.0.2...pob@3.0.3) (2018-04-20)


### Bug Fixes

* avoid running yarn in lerna packages when updating parent ([7e05933](https://github.com/christophehurpeau/pob/commit/7e05933))




<a name="3.0.2"></a>
## [3.0.2](https://github.com/christophehurpeau/pob/compare/pob@3.0.1...pob@3.0.2) (2018-04-20)


### Bug Fixes

* update pob-babel dependency in pob ([9785f09](https://github.com/christophehurpeau/pob/commit/9785f09))




<a name="3.0.1"></a>
## [3.0.1](https://github.com/christophehurpeau/pob/compare/pob@3.0.0...pob@3.0.1) (2018-04-20)


### Bug Fixes

* update dependencies and better react support ([253d8ba](https://github.com/christophehurpeau/pob/commit/253d8ba))




<a name="3.0.0"></a>
# 3.0.0 (2018-04-06)


### Bug Fixes

* shipped proposals, update babel-preset-latest-node and babel-preset-modern-browsers ([466f834](https://github.com/christophehurpeau/pob/commit/466f834))


### Features

* typescript ([48a358c](https://github.com/christophehurpeau/pob/commit/48a358c))


### BREAKING CHANGES

* js files are no longer supported (except for pob generator)




<a name="2.0.0"></a>
# [2.0.0](https://github.com/christophehurpeau/pob/compare/v1.3.0...v2.0.0) (2017-04-03)


### Features

* module aliases, node version and fixes ([9d7ff8e](https://github.com/christophehurpeau/pob/commit/9d7ff8e))
* module and babel-preset ([412b26b](https://github.com/christophehurpeau/pob/commit/412b26b))


<a name="1.3.0"></a>
# [1.3.0](https://github.com/christophehurpeau/pob/compare/v1.2.0...v1.3.0) (2017-03-01)


### Features

* node7, flow-runtime ([91929a8](https://github.com/christophehurpeau/pob/commit/91929a8))
* use pob-babel/generator for tests ([cff149b](https://github.com/christophehurpeau/pob/commit/cff149b))


<a name="1.2.0"></a>
# [1.2.0](https://github.com/christophehurpeau/pob/compare/v1.1.0...v1.2.0) (2017-02-04)


### Features

* pob-babel@14.1.0 webpack node 6 and preset pob-react ([a535687](https://github.com/christophehurpeau/pob/commit/a535687))


<a name="1.1.0"></a>
# [1.1.0](https://github.com/christophehurpeau/pob/compare/v1.0.0...v1.1.0) (2017-02-04)


### Bug Fixes

* readme without npm link ([0d5d515](https://github.com/christophehurpeau/pob/commit/0d5d515))
* **readme:** don't escape description ([a72876a](https://github.com/christophehurpeau/pob/commit/a72876a))
* **readme:** Install set bash instead of sh ([08cb6bb](https://github.com/christophehurpeau/pob/commit/08cb6bb))
* testing without babel ([159a9da](https://github.com/christophehurpeau/pob/commit/159a9da))

### Features

* **eslint:** update eslint-config-pob@11 ([a5e0e2d](https://github.com/christophehurpeau/pob/commit/a5e0e2d))
* **readme:** Allow to have lists before the first heading ([0bdbc4b](https://github.com/christophehurpeau/pob/commit/0bdbc4b))
* circleci use yarn ([d71d9da](https://github.com/christophehurpeau/pob/commit/d71d9da))
* komet-karma@ 0.2.5 ([ad759a2](https://github.com/christophehurpeau/pob/commit/ad759a2))
* pob-release@3.0.0 with standard changelog ([0b5fbd8](https://github.com/christophehurpeau/pob/commit/0b5fbd8))
* pob-release@3.1 ([881aa6d](https://github.com/christophehurpeau/pob/commit/881aa6d))
* travis yarn cache ([5d28977](https://github.com/christophehurpeau/pob/commit/5d28977))


### v1.0.0

- [`606d10b`](https://github.com/christophehurpeau/pob/commit/606d10bc758c29feeb54bce357b165713ec1fcdd) babel: update dependencies, add flow option (Christophe Hurpeau)
- [`5dba3cc`](https://github.com/christophehurpeau/pob/commit/5dba3cc8f60032ce55879ccd684493bddcb8bfa0) eslint: lint no longer fix by default, you can do it with `npm run lint -- --fix` (Christophe Hurpeau)
- [`95c9f89`](https://github.com/christophehurpeau/pob/commit/95c9f89cc26c958f0af18c0953ac916ccaeec1e0) pob-babel@12.1.1 (Christophe Hurpeau)
- [`1614856`](https://github.com/christophehurpeau/pob/commit/16148567f368f621d4f3ca1f459d4aec6ade37eb) komet-karma@0.2.3 and prepare hook npm@4 (Christophe Hurpeau)
- [`fdfac17`](https://github.com/christophehurpeau/pob/commit/fdfac1788e2beba75f09b8aa2c06d4a9ea9443ae) always remove node_modules for a clean fresh install (Christophe Hurpeau)
- [`869ba6b`](https://github.com/christophehurpeau/pob/commit/869ba6b1ceb0d855f2d2c07636420dd355628c63) circleci: update node version to 6 LTS (Christophe Hurpeau)
- [`794db11`](https://github.com/christophehurpeau/pob/commit/794db113285b1242b44e0ff3187369c54505b1df) update dependencies and some readme links (Christophe Hurpeau)
- [`7218efb`](https://github.com/christophehurpeau/pob/commit/7218efbdb42eee831c129d92b0a874bf1cef862f) update dependencies, use yarn and webpack:node (Christophe Hurpeau)
- [`10417f6`](https://github.com/christophehurpeau/pob/commit/10417f674172cd09383e34681b400acf0e94bb14) parse readme, update dependencies, run build after install, docklets config (Christophe Hurpeau)

### v0.7.1

- [`894c10f`](https://github.com/christophehurpeau/pob/commit/894c10f97ec819390062b5ffdb6ff0dafa9cf466) fixes (Christophe Hurpeau)

### v0.7.0

- [`81a1f76`](https://github.com/christophehurpeau/pob/commit/81a1f7657b0543fc9e8dd30158f4bdfcea2a6821) split questions, use komet (Christophe Hurpeau)

### v0.6.0

- [`a788d63`](https://github.com/christophehurpeau/pob/commit/a788d6393eef1017cea0eb379355edf06e651410) update dependencies and jsdoc use minami (Christophe Hurpeau)

### v0.5.0

- [`4ccfe06`](https://github.com/christophehurpeau/pob/commit/4ccfe06e87c06f81dd504c4ca4a82afa83f43832) update dependencies (Christophe Hurpeau)

### v0.4.3

- [`46ba0cf`](https://github.com/christophehurpeau/pob/commit/46ba0cf9b96339ee18bffa1fe2cdc3d1a1ba5470) update dependencies, fix in package when the version is not semver (like an github link), readme and circleci newlines fixes (Christophe Hurpeau)

### v0.4.2

- [`5172ea3`](https://github.com/christophehurpeau/pob/commit/5172ea3b5f4ffbe7679bf65f7616c04bd2c1e0c4) circleci, codecov and fix git generator (Christophe Hurpeau)

### v0.4.1

- [`5ec9890`](https://github.com/christophehurpeau/pob/commit/5ec98905d1d92b35be72172320515caef6ec3307) update readme (Christophe Hurpeau)

### v0.4.0

- [`cfb7ed1`](https://github.com/christophehurpeau/pob/commit/cfb7ed1a9f1d8f8b47fb49a78207cd24fa07833b) travis, new git hooks, git host github/bitbucket/gitlab/none, upgrades and more (Christophe Hurpeau)
- [`3380762`](https://github.com/christophehurpeau/pob/commit/33807621d77eb8a88319fa32414c580ce674ff81) pob-release (Christophe Hurpeau)
