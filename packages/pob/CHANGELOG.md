# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
