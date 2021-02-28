/* eslint-disable max-lines */

'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const {
  checkDirectDuplicateDependencies,
  checkWarnedFor,
} = require('./checkDirectDuplicateDependencies');
const { checkExactVersions } = require('./checkExactVersions');
const { checkIdenticalVersions } = require('./checkIdenticalVersions');
const {
  checkIdenticalVersionsThanDependency,
} = require('./checkIdenticalVersionsThanDependency');
const { checkNoDependencies } = require('./checkNoDependencies');
const { checkPeerDependencies } = require('./checkPeerDependencies');
const {
  checkResolutionsHasExplanation,
} = require('./checkResolutionsHasExplanation');
const {
  checkSatisfiesVersionsFromDependency,
} = require('./checkSatisfiesVersionsFromDependency');
const { createReportError } = require('./utils/createReportError');

const readPkgJson = (packagePath) => {
  return JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
};

exports.createCheckPackage = (pkgPath = 'package.json') => {
  const pkgResolved = path.resolve(pkgPath);
  const pkgDirname = `${path.dirname(pkgResolved)}/`;
  const pkg = readPkgJson(pkgResolved);
  const nodeModulesPackagePathCache = new Map();
  const getDependencyPackageJson = (pkgDepName) => {
    const existing = nodeModulesPackagePathCache.get(pkgDepName);
    if (existing) return existing;
    let pkg;
    if (pkgDepName.startsWith('.')) {
      const packagePath = `${pkgDirname}/${pkgDepName}/package.json`;
      pkg = readPkgJson(packagePath);
    } else {
      try {
        // eslint-disable-next-line import/no-dynamic-require
        pkg = require(require.resolve(`${pkgDepName}/package.json`, {
          paths: [pkgDirname],
        }));
      } catch (err) {
        if (err.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
          throw err;
        }

        const [, matchPackageJson] = / in (.*\/package.json)$/.exec(
          err.message,
        );

        pkg = readPkgJson(matchPackageJson);
      }
    }
    nodeModulesPackagePathCache.set(pkgDepName, pkg);
    return pkg;
  };

  return {
    pkg,
    pkgDirname,
    getDependencyPackageJson,
    checkExactVersions() {
      ['dependencies', 'devDependencies', 'resolutions'].forEach((type) => {
        checkExactVersions(pkg, type);
      });
      return this;
    },
    checkExactVersionsForLibrary() {
      ['devDependencies', 'resolutions'].forEach((type) => {
        checkExactVersions(pkg, type);
      });
      return this;
    },

    checkExactDevVersions() {
      checkExactVersions(pkg, pkgPath, 'devDependencies');
      return this;
    },

    checkNoDependencies(
      type = 'dependencies',
      moveToSuggestion = 'devDependencies',
    ) {
      checkNoDependencies(pkg, pkgPath, type, moveToSuggestion);
      return this;
    },

    checkDirectPeerDependencies({ isLibrary, onlyWarnsFor } = {}) {
      [
        {
          type: 'devDependencies',
          allowedPeerIn: ['devDependencies', 'dependencies'],
        },
        {
          type: 'dependencies',
          allowedPeerIn: isLibrary
            ? ['devDependencies', 'dependencies']
            : ['dependencies'],
        },
      ].forEach(({ type, allowedPeerIn }) => {
        if (!pkg[type]) return;
        Object.keys(pkg[type]).forEach((depName) => {
          const depPkg = getDependencyPackageJson(depName);
          if (depPkg.peerDependencies) {
            checkPeerDependencies(
              pkg,
              pkgPath,
              type,
              allowedPeerIn,
              depPkg,
              onlyWarnsFor,
            );
          }
          // TODO optionalPeerDependency
        });
      });
      return this;
    },

    checkDirectDuplicateDependencies({
      onlyWarnsFor,
      internalWarnedForDuplicate,
    } = {}) {
      const warnedForInternal = internalWarnedForDuplicate || new Set();
      [
        {
          type: 'devDependencies',
          searchIn: ['devDependencies', 'dependencies'],
        },
        { type: 'dependencies', searchIn: ['devDependencies', 'dependencies'] },
      ].forEach(({ type, searchIn }) => {
        if (!pkg[type]) return;
        Object.keys(pkg[type]).forEach((depName) => {
          const depPkg = getDependencyPackageJson(depName);
          checkDirectDuplicateDependencies(
            pkg,
            pkgPath,
            'dependencies',
            searchIn,
            depPkg,
            onlyWarnsFor,
            warnedForInternal,
          );
        });
      });

      if (!warnedForInternal) {
        const reportError = createReportError(
          'Direct Duplicate Dependencies',
          pkgPath,
        );
        checkWarnedFor(reportError, onlyWarnsFor, warnedForInternal);
      }
      return this;
    },

    checkResolutionsHasExplanation(
      checkMessage = (depKey, message) => undefined,
    ) {
      checkResolutionsHasExplanation(
        pkg,
        pkgPath,
        checkMessage,
        getDependencyPackageJson,
      );
      return this;
    },

    checkRecommended({
      isLibrary = false,
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      checkResolutionMessage,
      internalWarnedForDuplicate,
    } = {}) {
      if (isLibrary) {
        this.checkExactVersionsForLibrary();
      } else {
        this.checkExactVersions();
      }

      this.checkDirectPeerDependencies({
        isLibrary,
        onlyWarnsFor: peerDependenciesOnlyWarnsFor,
      });

      this.checkDirectDuplicateDependencies({
        onlyWarnsFor: directDuplicateDependenciesOnlyWarnsFor,
        internalWarnedForDuplicate,
      });

      this.checkResolutionsHasExplanation(checkResolutionMessage);
    },

    checkIdenticalVersionsThanDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      const depPkg = getDependencyPackageJson(depName);
      if (resolutions) {
        checkIdenticalVersionsThanDependency(
          pkg,
          pkgPath,
          'resolutions',
          resolutions,
          depPkg,
          depPkg.dependencies,
        );
      }
      if (dependencies) {
        checkIdenticalVersionsThanDependency(
          pkg,
          pkgPath,
          'dependencies',
          dependencies,
          depPkg,
          depPkg.dependencies,
        );
      }
      if (devDependencies) {
        checkIdenticalVersionsThanDependency(
          pkg,
          pkgPath,
          'devDependencies',
          devDependencies,
          depPkg,
          depPkg.dependencies,
        );
      }
      return this;
    },

    checkIdenticalVersionsThanDevDependencyOfDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      const depPkg = getDependencyPackageJson(depName);
      if (resolutions) {
        checkIdenticalVersionsThanDependency(
          'resolutions',
          resolutions,
          depPkg,
          depPkg.devDependencies,
        );
      }
      if (dependencies) {
        checkIdenticalVersionsThanDependency(
          'dependencies',
          dependencies,
          depPkg,
          depPkg.devDependencies,
        );
      }
      if (devDependencies) {
        checkIdenticalVersionsThanDependency(
          'devDependencies',
          devDependencies,
          depPkg,
          depPkg.devDependencies,
        );
      }
      return this;
    },

    checkSatisfiesVersionsFromDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      const depPkg = getDependencyPackageJson(depName);
      if (resolutions) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPath,
          'resolutions',
          resolutions,
          depPkg,
          depPkg.dependencies,
        );
      }
      if (dependencies) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPath,
          'dependencies',
          dependencies,
          depPkg,
          depPkg.dependencies,
        );
      }
      if (devDependencies) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPath,
          'devDependencies',
          devDependencies,
          depPkg,
          depPkg.dependencies,
        );
      }
      return this;
    },

    checkSatisfiesVersionsInDevDependenciesOfDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      const depPkg = getDependencyPackageJson(depName);
      if (resolutions) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPath,
          'resolutions',
          resolutions,
          depPkg,
          depPkg.devDependencies,
        );
      }
      if (dependencies) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPath,
          'dependencies',
          dependencies,
          depPkg,
          depPkg.devDependencies,
        );
      }
      if (devDependencies) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPath,
          'devDependencies',
          devDependencies,
          depPkg,
          depPkg.devDependencies,
        );
      }
      return this;
    },

    checkIdenticalVersions({ resolutions, dependencies, devDependencies }) {
      if (resolutions) {
        checkIdenticalVersions(pkg, 'resolutions', resolutions);
      }
      if (dependencies) {
        checkIdenticalVersions(pkg, 'dependencies', dependencies);
      }
      if (devDependencies) {
        checkIdenticalVersions(pkg, 'devDependencies', devDependencies);
      }
      return this;
    },
  };
};

exports.createCheckPackageWithWorkspaces = (pkgPath = 'package.json') => {
  const checkPackage = exports.createCheckPackage(pkgPath);
  const { pkg, pkgDirname } = checkPackage;

  if (!pkg.workspaces) {
    throw new Error('Package is missing "workspaces"');
  }

  const workspaces = [];
  pkg.workspaces.forEach((pattern) => {
    const match = glob.sync(pkgDirname + pattern);
    match.forEach((pathMatch) => {
      const stat = fs.statSync(pathMatch);
      if (!stat.isDirectory()) return;
      const pkgPath = path.relative(
        process.cwd(),
        path.join(pathMatch, 'package.json'),
      );
      const pkg = readPkgJson(pkgPath);
      workspaces.push({
        id: pkg.name,
        pkgDirname: pathMatch,
        pkgPath,
        pkg,
      });
    });
  });

  const checksWorkspaces = new Map(
    workspaces.map(({ id, pkgPath }) => [
      id,
      exports.createCheckPackage(pkgPath),
    ]),
  );

  return {
    checkRecommended({
      isLibrary = (pkgName) => false,
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      checkResolutionMessage,
    } = {}) {
      checkPackage.checkNoDependencies();
      checkPackage.checkRecommended({
        isLibrary: false,
        peerDependenciesOnlyWarnsFor,
        directDuplicateDependenciesOnlyWarnsFor,
        checkResolutionMessage,
      });

      const warnedForDuplicate = new Set();
      checksWorkspaces.forEach((checkPackage, id) => {
        checkPackage.checkRecommended({
          isLibrary: isLibrary(id),
          peerDependenciesOnlyWarnsFor,
          directDuplicateDependenciesOnlyWarnsFor,
          checkResolutionMessage,
          internalWarnedForDuplicate: warnedForDuplicate,
        });
        checkDirectDuplicateDependencies(
          pkg,
          pkgPath,
          'devDependencies',
          ['devDependencies', 'dependencies'],
          pkg,
          [],
          warnedForDuplicate,
        );
      });

      checkWarnedFor(
        createReportError('Recommended Checks', pkgPath),
        directDuplicateDependenciesOnlyWarnsFor,
        warnedForDuplicate,
      );

      return this;
    },

    forRoot(callback) {
      callback(checkPackage);
      return this;
    },

    for(id, callback) {
      const packageCheck = checksWorkspaces.get(id);
      if (!packageCheck) {
        throw new Error(
          `Invalid package name: ${id}. Known package names: "${[
            ...checksWorkspaces.keys(),
          ].join('","')}"`,
        );
      }
      callback(packageCheck);
      return this;
    },
  };
};
