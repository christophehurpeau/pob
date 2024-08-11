# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.2.3](https://github.com/christophehurpeau/pob/compare/yarn-version@2.2.2...yarn-version@2.2.3) (2024-08-11)

### Bug Fixes

* **yarn-version:** fix changelog generation for dependent mode ([47273f9](https://github.com/christophehurpeau/pob/commit/47273f9228189034749c0481d0f1bd9780285f92))

## [2.2.2](https://github.com/christophehurpeau/pob/compare/yarn-version@2.2.1...yarn-version@2.2.2) (2024-08-04)

Version bump for dependency: @pob/rollup-esbuild


## [2.2.1](https://github.com/christophehurpeau/pob/compare/yarn-version@2.2.0...yarn-version@2.2.1) (2024-07-30)

Version bump for dependency: @pob/rollup-esbuild


## [2.2.0](https://github.com/christophehurpeau/pob/compare/yarn-version@2.1.1...yarn-version@2.2.0) (2024-07-27)

### Bug Fixes

* **deps:** update dependency semver to v7.6.3 ([#2141](https://github.com/christophehurpeau/pob/issues/2141)) ([047d95c](https://github.com/christophehurpeau/pob/commit/047d95c38ce1e5b267be78579400620b99c7de64))
* **yarn-version:** fix changelog generator for dependent workspace ([86d51f6](https://github.com/christophehurpeau/pob/commit/86d51f60908c72d43a8ada31d9808488e8e71d9f))

Version bump for dependency: @pob/pretty-pkg
Version bump for dependency: @pob/rollup-esbuild


## [2.1.1](https://github.com/christophehurpeau/pob/compare/yarn-version@2.1.0...yarn-version@2.1.1) (2024-06-08)

### Bug Fixes

* **yarn-version:** use execCommand to run yarn commands ([b0d4d31](https://github.com/christophehurpeau/pob/commit/b0d4d3105de310aafc10f8de2e14ecb5d760fbe4))

## [2.1.0](https://github.com/christophehurpeau/pob/compare/yarn-version@2.0.0...yarn-version@2.1.0) (2024-06-08)

### Features

* **yarn-version:** log changed files ([ddab3b5](https://github.com/christophehurpeau/pob/commit/ddab3b5d58b3f0b7a5b28f489afd0e68dba18211))

### Bug Fixes

* **yarn-version:** add missing await in previous commit ([88fe64c](https://github.com/christophehurpeau/pob/commit/88fe64c2f85de1c66c010128d5f5eb8bc848d501))
* **yarn-version:** run postversion after pushing commits and tags ([a119fea](https://github.com/christophehurpeau/pob/commit/a119feaca102fbadc93587237906c0f3ce4068e5))

## [2.0.0](https://github.com/christophehurpeau/pob/compare/yarn-version@1.1.0...yarn-version@2.0.0) (2024-06-07)

Version bump for dependency: @pob/rollup-esbuild


## [1.1.0](https://github.com/christophehurpeau/pob/compare/yarn-version@1.0.0...yarn-version@1.1.0) (2024-06-07)

### Features

* **deps:** update dependency @octokit/rest to v20.1.1 ([#2081](https://github.com/christophehurpeau/pob/issues/2081)) ([7574e48](https://github.com/christophehurpeau/pob/commit/7574e48d05826d8ff7793820239d0263abb81ffe))
* **deps:** update dependency commander to v12.1.0 ([#2082](https://github.com/christophehurpeau/pob/issues/2082)) ([1662d13](https://github.com/christophehurpeau/pob/commit/1662d13e665ce2efacc891f338ab77b1d0893bee))

### Bug Fixes

* **yarn-version:** fix missing bump reason for dependency ([24a21e9](https://github.com/christophehurpeau/pob/commit/24a21e9517e7da62dabdb60246150ec5134e52ae))
* **yarn-version:** fix missing path filter commits ([97f7de5](https://github.com/christophehurpeau/pob/commit/97f7de5b9d0b65dc9eeaebca3ac5fadc9613df6d))

## 1.0.0 (2024-06-07)

### ⚠ BREAKING CHANGES

* **deps:** use async prettier or prettier/sync 
* change prettier config to get closer to default
* enable "disableYarnGitCache" by default

### Features

* add app untranspiled-library ([c702f3e](https://github.com/christophehurpeau/pob/commit/c702f3e8170809b8c7b9ac5fe6cad4f6f7e70779))
* add package yarn-version ([e2e8be6](https://github.com/christophehurpeau/pob/commit/e2e8be65fd50f9084c519fd07503748a1d970509))
* add rollup-esbuild ([a1085db](https://github.com/christophehurpeau/pob/commit/a1085dbe6ea69767596dd46813044b96fbf713dd))
* add swc support and improve jest without babel ([e7b050d](https://github.com/christophehurpeau/pob/commit/e7b050d3b7ac5ab2ec68d98095bb9832fdbc88bb))
* add tsconfig template for js ([237ad7a](https://github.com/christophehurpeau/pob/commit/237ad7a54abe14d8f49db8057adffe00d1b823cd))
* add vitest support ([db3344c](https://github.com/christophehurpeau/pob/commit/db3344c45197f4b1bdfaa78df7dff25b37d291e2))
* better support next and add example ([a60ce83](https://github.com/christophehurpeau/pob/commit/a60ce83d8277efb0eef65c5b3372ff89570919fb))
* change prettier config to get closer to default ([8e472a9](https://github.com/christophehurpeau/pob/commit/8e472a98b0a722c5cd779e4731ff625b0bfa07bb))
* **deps:** update @pob/eslint-config to v55 (major) ([#2020](https://github.com/christophehurpeau/pob/issues/2020)) ([434d5b3](https://github.com/christophehurpeau/pob/commit/434d5b3dce53b1925091138444881a13e2a962d9))
* **deps:** update @pob/eslint-config to v55.2.1 ([#2021](https://github.com/christophehurpeau/pob/issues/2021)) ([cdfe421](https://github.com/christophehurpeau/pob/commit/cdfe42126842ac1cb46d233ca7203fd241863a81))
* **deps:** update @pob/eslint-config to v55.3.0 ([#2035](https://github.com/christophehurpeau/pob/issues/2035)) ([0f05da8](https://github.com/christophehurpeau/pob/commit/0f05da803035953e8b32c87bab59649cdb448aa5))
* **deps:** update @pob/eslint-config to v56 (major) ([#2036](https://github.com/christophehurpeau/pob/issues/2036)) ([b26302b](https://github.com/christophehurpeau/pob/commit/b26302bd6dbf9bf4da2e97238c59ae80282ad9a4))
* **deps:** update dependency @rollup/plugin-run to v3.1.0 ([#2079](https://github.com/christophehurpeau/pob/issues/2079)) ([c2ef4fa](https://github.com/christophehurpeau/pob/commit/c2ef4fa22322952dcb626a5d99bc16e141684cd0))
* **deps:** update dependency @yeoman/types to v1.2.0 ([#1962](https://github.com/christophehurpeau/pob/issues/1962)) ([3566bfd](https://github.com/christophehurpeau/pob/commit/3566bfdbc71ee07662d4b10ec76887c5407118e7))
* **deps:** update dependency conventional-changelog-conventionalcommits to v8 ([#2033](https://github.com/christophehurpeau/pob/issues/2033)) ([e7a568e](https://github.com/christophehurpeau/pob/commit/e7a568e4fabea00955bc6f005d85088f947f58cb))
* **deps:** update dependency esbuild to v0.21.0 ([#2040](https://github.com/christophehurpeau/pob/issues/2040)) ([dc252dc](https://github.com/christophehurpeau/pob/commit/dc252dc815dd450e2687e3f5784c3604bcfbab3c))
* **deps:** update dependency eslint to v8.57.0 ([#1942](https://github.com/christophehurpeau/pob/issues/1942)) ([69753af](https://github.com/christophehurpeau/pob/commit/69753aff1bea9e5801bd4deaa22d6d4eefba8e62))
* **deps:** update dependency glob to v10.4.0 ([#2061](https://github.com/christophehurpeau/pob/issues/2061)) ([05dd06f](https://github.com/christophehurpeau/pob/commit/05dd06f1fb51d3cff0b95d6457fb9060d5d2db29))
* **deps:** update dependency husky to v9 ([#1910](https://github.com/christophehurpeau/pob/issues/1910)) ([6b88cd0](https://github.com/christophehurpeau/pob/commit/6b88cd016cc52cf2630a15a619a66b8ff47308f7))
* **deps:** update dependency mem-fs to v4.1.0 ([#1945](https://github.com/christophehurpeau/pob/issues/1945)) ([c5c31cf](https://github.com/christophehurpeau/pob/commit/c5c31cfdf15018fbdfa9a4511d86fd6a9d72f277))
* **deps:** update dependency next to v14.2.0 ([#2010](https://github.com/christophehurpeau/pob/issues/2010)) ([dd8ffc8](https://github.com/christophehurpeau/pob/commit/dd8ffc852a79546321317122eedc352d24744716))
* **deps:** update dependency prettier to v3 ([#1698](https://github.com/christophehurpeau/pob/issues/1698)) ([a65e641](https://github.com/christophehurpeau/pob/commit/a65e6418d4b80680b753a773b02925603df8ea12))
* **deps:** update dependency prettier to v3.3.0 ([#2071](https://github.com/christophehurpeau/pob/issues/2071)) ([04f24c3](https://github.com/christophehurpeau/pob/commit/04f24c33fcab0472cc830675696c219ee5ba14f9))
* **deps:** update dependency yeoman-environment to v4.4.0 ([#1963](https://github.com/christophehurpeau/pob/issues/1963)) ([1a7dbb8](https://github.com/christophehurpeau/pob/commit/1a7dbb8fde589f3ad9e6e870cc767b9821832170))
* **deps:** update dependency yeoman-generator to v7.2.0 ([#2063](https://github.com/christophehurpeau/pob/issues/2063)) ([a5b8748](https://github.com/christophehurpeau/pob/commit/a5b8748fecedff6291475656672feb1766c60e5f))
* **deps:** update yarn monorepo ([#2032](https://github.com/christophehurpeau/pob/issues/2032)) ([d2b7b8a](https://github.com/christophehurpeau/pob/commit/d2b7b8adc11a13f4b4d96cdd08851ad66f3c83a0))
* enable "disableYarnGitCache" by default ([b7ce323](https://github.com/christophehurpeau/pob/commit/b7ce323c51e0e875228478d708f27511325b844c))
* initial bun support ([0f0d36d](https://github.com/christophehurpeau/pob/commit/0f0d36db4cb5532a8976cba368cbc2fbe29e7802))
* migrate pob.babelEnvs to pob.envs + pob.bundler ([6baa9bb](https://github.com/christophehurpeau/pob/commit/6baa9bb986a1321beefcf9de3de566c285e548d1))
* **pob:** add tslib ([fb4ead7](https://github.com/christophehurpeau/pob/commit/fb4ead72f5ae31ae894b4f7e9f65fdc05c5e6be0))
* **pob:** remove metro-health-check in gitignore as I dont use them ([dc09df0](https://github.com/christophehurpeau/pob/commit/dc09df0ae0600294ae4ecdc0fb571797f5cc7b43))
* remove rollup-swc ([3f59111](https://github.com/christophehurpeau/pob/commit/3f59111b3ce58124fa7817cf0ebc39e8cc108d45))
* simple esbuild bundler ([80659fa](https://github.com/christophehurpeau/pob/commit/80659fadb42190463585ff54e865af09e31fdc0d))
* support vitest ([2fe540e](https://github.com/christophehurpeau/pob/commit/2fe540e6ab66255735910745062a92636c87f21e))
* support yarn nodeLinker pnpm ([340e5ab](https://github.com/christophehurpeau/pob/commit/340e5aba71f6943614445f50b20f1c3d3e68f01a))
* update peaceiris/actions-gh-pages to v4 ([a67c672](https://github.com/christophehurpeau/pob/commit/a67c672c539c2662650e7b1c00bbc95a4c53fca3))
* use codecov-action v4 ([73174bd](https://github.com/christophehurpeau/pob/commit/73174bd93ce1b0b9f93e360a7ea29478d7550400))
* use ts-node-lite ([ccbbb5e](https://github.com/christophehurpeau/pob/commit/ccbbb5e178d816191589cfa378ec99fcf5caec20))

### Bug Fixes

* **@pob/root:** vitest --run option to disable watch mode ([d7e8640](https://github.com/christophehurpeau/pob/commit/d7e86404e2c17fe24bb3ad27468e52c6a6b4c1da))
* commit build of yarn-version ([539f4b2](https://github.com/christophehurpeau/pob/commit/539f4b2e12d8df4dc5cec272a24343721f4d2bdb))
* **deps:** update @pob/eslint-config to v54.0.1 ([#1943](https://github.com/christophehurpeau/pob/issues/1943)) ([309437f](https://github.com/christophehurpeau/pob/commit/309437f195bfdfc9a6c00eec039fd74cba0a6ef8))
* **deps:** update @pob/eslint-config to v54.0.2 ([#2000](https://github.com/christophehurpeau/pob/issues/2000)) ([04366c3](https://github.com/christophehurpeau/pob/commit/04366c3fe1917595a4b52369837ba31868e84164))
* **deps:** update dependency esbuild to v0.21.1 ([#2042](https://github.com/christophehurpeau/pob/issues/2042)) ([2c47629](https://github.com/christophehurpeau/pob/commit/2c476296d1ecabaf272461df0901786bcea07aab))
* **deps:** update dependency esbuild to v0.21.2 ([#2051](https://github.com/christophehurpeau/pob/issues/2051)) ([8e8596f](https://github.com/christophehurpeau/pob/commit/8e8596f11350ee7e152ebec5603295edea8e6da7))
* **deps:** update dependency esbuild to v0.21.3 ([#2055](https://github.com/christophehurpeau/pob/issues/2055)) ([f27179c](https://github.com/christophehurpeau/pob/commit/f27179c5d6f4259a2885ee9097cf857b73849cef))
* **deps:** update dependency esbuild to v0.21.4 ([#2065](https://github.com/christophehurpeau/pob/issues/2065)) ([984e479](https://github.com/christophehurpeau/pob/commit/984e479c1958c224bc584936c13908578563e29d))
* **deps:** update dependency glob to v10.3.12 ([#1988](https://github.com/christophehurpeau/pob/issues/1988)) ([edb6140](https://github.com/christophehurpeau/pob/commit/edb61405b62a7f94673243cdc47451571e493592))
* **deps:** update dependency glob to v10.3.14 ([#2047](https://github.com/christophehurpeau/pob/issues/2047)) ([201fff2](https://github.com/christophehurpeau/pob/commit/201fff2e3def4a8c7344af403464e7bf16eb44bc))
* **deps:** update dependency glob to v10.3.15 ([#2050](https://github.com/christophehurpeau/pob/issues/2050)) ([8142969](https://github.com/christophehurpeau/pob/commit/8142969c29cda5fb5f8cf924522fd719ac0278d7))
* **deps:** update dependency glob to v10.3.16 ([#2056](https://github.com/christophehurpeau/pob/issues/2056)) ([d5ce7c0](https://github.com/christophehurpeau/pob/commit/d5ce7c0922a93a188250eb5e6a5eb8b14ac76630))
* **deps:** update dependency glob to v10.4.1 ([#2062](https://github.com/christophehurpeau/pob/issues/2062)) ([c9eb614](https://github.com/christophehurpeau/pob/commit/c9eb614f8b0906bf4757bb21ed2bed570dbf55c4))
* **deps:** update dependency jscodeshift to v0.15.2 ([#1940](https://github.com/christophehurpeau/pob/issues/1940)) ([edb4bef](https://github.com/christophehurpeau/pob/commit/edb4befd4d03d126b9eeb36583e38e1c79539db9))
* **deps:** update dependency lint-staged to v15.2.4 ([#2057](https://github.com/christophehurpeau/pob/issues/2057)) ([3266770](https://github.com/christophehurpeau/pob/commit/3266770fc90c82ccc25cd0bce67106063cf38b51))
* **deps:** update dependency lint-staged to v15.2.5 ([#2066](https://github.com/christophehurpeau/pob/issues/2066)) ([0c5396b](https://github.com/christophehurpeau/pob/commit/0c5396b73c9a99e37964c9752f2f55b4079f888e))
* **deps:** update dependency mem-fs-editor to v11.0.1 ([#2060](https://github.com/christophehurpeau/pob/issues/2060)) ([a4824cb](https://github.com/christophehurpeau/pob/commit/a4824cb89b8d94846ac7eb4ca062a500cadcc606))
* **deps:** update dependency next to v14.1.4 ([#1977](https://github.com/christophehurpeau/pob/issues/1977)) ([6913af7](https://github.com/christophehurpeau/pob/commit/6913af7fc660e9ee08e7a412dfe16d7f44c9a4db))
* **deps:** update dependency next to v14.2.1 ([#2013](https://github.com/christophehurpeau/pob/issues/2013)) ([28b9b77](https://github.com/christophehurpeau/pob/commit/28b9b77170ba57e793a9afda766dc3944eb7cdcb))
* **deps:** update dependency next to v14.2.2 ([#2018](https://github.com/christophehurpeau/pob/issues/2018)) ([e4e1b1d](https://github.com/christophehurpeau/pob/commit/e4e1b1d086ea2bd7a7cd66f43c188518eba177da))
* **deps:** update dependency next to v14.2.3 ([#2024](https://github.com/christophehurpeau/pob/issues/2024)) ([0ba3639](https://github.com/christophehurpeau/pob/commit/0ba36391910c2ce6318bb405674256e2d06ba42a))
* **deps:** update dependency prettier to v3.3.1 ([#2078](https://github.com/christophehurpeau/pob/issues/2078)) ([57ecb30](https://github.com/christophehurpeau/pob/commit/57ecb301bc6dded8e9063c1e3afc9f6f04d023b1))
* **deps:** update dependency semver to v7.6.1 ([#2041](https://github.com/christophehurpeau/pob/issues/2041)) ([17b20a3](https://github.com/christophehurpeau/pob/commit/17b20a3a352e4fbcda88d2e43938a8dbafe0667c))
* **deps:** update dependency semver to v7.6.2 ([#2048](https://github.com/christophehurpeau/pob/issues/2048)) ([e4a50f3](https://github.com/christophehurpeau/pob/commit/e4a50f3c11b87306ed30ec0cbcdd8f6f23a4ac75))
* **deps:** update dependency yeoman-environment to v4.4.1 ([#2073](https://github.com/christophehurpeau/pob/issues/2073)) ([528734e](https://github.com/christophehurpeau/pob/commit/528734e27f1f0b59ab5f5d87ff98e95385168b72))
* **deps:** update react monorepo to v18.3.1 ([#2026](https://github.com/christophehurpeau/pob/issues/2026)) ([ba29f51](https://github.com/christophehurpeau/pob/commit/ba29f51309c6839cc445386303e20619ebf50498))
* **deps:** update yarn monorepo ([#2045](https://github.com/christophehurpeau/pob/issues/2045)) ([bfce168](https://github.com/christophehurpeau/pob/commit/bfce1680e6df15f6a57e83fefc39e1257bf8f6e3))
* **deps:** update yarn monorepo to v4.1.1 ([#1955](https://github.com/christophehurpeau/pob/issues/1955)) ([872ccc1](https://github.com/christophehurpeau/pob/commit/872ccc1c51462a42edbce7b50c6d44dbf625647b))
* few fixes for monorepo migrate ([a36ab40](https://github.com/christophehurpeau/pob/commit/a36ab408456ced31d8512a1b30391273dffcbe73))
* fix bun command to install ([5585fa3](https://github.com/christophehurpeau/pob/commit/5585fa3aa073a0194891677e4a33d7d71b96588b))
* fix checks run using pm ([12f955e](https://github.com/christophehurpeau/pob/commit/12f955e7b00f16d0b2b4f9f1090a4bde2c755442))
* fix for CommonTestingGenerator ([e7f93df](https://github.com/christophehurpeau/pob/commit/e7f93df65007fe8a6e5faac6fd3d796adf6d3233))
* fix previous commit ([cd870dc](https://github.com/christophehurpeau/pob/commit/cd870dccce1e4d80ed38e854915407084e8b0001))
* fix yarn-version command ([87e25ca](https://github.com/christophehurpeau/pob/commit/87e25cae86d3730f14e50e6370efe69bd2e21814))
* improve bun support ([bab80e5](https://github.com/christophehurpeau/pob/commit/bab80e5257b753b7c28031b1e75681766edf4c5f))
* make sure .yarn/cache is deleted when disableYarnGitCache is enabled ([242c678](https://github.com/christophehurpeau/pob/commit/242c678a26b49b617d401b598c466cdeb88ad497))
* missing dependency alp-rollup-plugin-config ([9cdc4e4](https://github.com/christophehurpeau/pob/commit/9cdc4e40fb7fa9ee2140618da5eef978de0f5f31))
* **pob:** fix lint src directory with typescript and no babel ([b7d32a4](https://github.com/christophehurpeau/pob/commit/b7d32a4753ecf20742c8c4158f50f96e5d225e6d))
* **pob:** fix vitest coverage commands ([770f995](https://github.com/christophehurpeau/pob/commit/770f995a2f679e63771ca5b1d30a386a66fd2f05))
* **pob:** leave default compressionLevel config ([3d4c5d1](https://github.com/christophehurpeau/pob/commit/3d4c5d1e92ec1194dec99e768c2743e085c1fa94))
* **pob:** missing await ([f91682b](https://github.com/christophehurpeau/pob/commit/f91682b72016733065d7d505c6be5d4fddad25d8))
* properly determine node only with typescript and no babel ([3a8d958](https://github.com/christophehurpeau/pob/commit/3a8d9584ecb9c6810e577891f4c040b338364c10))
* **rollup-esbuild:** configure node target ([840c9df](https://github.com/christophehurpeau/pob/commit/840c9df8b0d07e5624494661884f559aee70e4db))
* run tsc with typescript and no babel ([96d1283](https://github.com/christophehurpeau/pob/commit/96d1283d2f79dfdeabc1c39ad57d299419ec44ed))
* tslib prefix ([b86d5e4](https://github.com/christophehurpeau/pob/commit/b86d5e47912fb16d0f58157d228772af43f00e80))
* update json5 ([4034c94](https://github.com/christophehurpeau/pob/commit/4034c947a1111021ee037144cefbee0cd39b9d33))
Version bump for dependency: @pob/pretty-pkg
Version bump for dependency: @pob/rollup-esbuild


