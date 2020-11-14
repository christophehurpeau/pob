'use strict';

const sortObject = require('@pob/sort-object');
const sortPkg = require('@pob/sort-pkg');
const parseAuthor = require('parse-author');
const pobDependencies = require('pob-dependencies');
const semver = require('semver');

exports.parseAuthor = parseAuthor;

exports.parsePkgAuthor = (pkg) =>
  typeof pkg.author === 'string' ? parseAuthor(pkg.author) : pkg.author;

exports.hasLerna = (pkg) =>
  !!(pkg.devDependencies && pkg.devDependencies.lerna);

exports.hasBabel = (pkg) =>
  !!(
    pkg.devDependencies &&
    (pkg.devDependencies['pob-babel'] || pkg.devDependencies['@babel/core'])
  );

exports.transpileWithBabel = (pkg) =>
  !!(
    (pkg.devDependencies &&
      (pkg.devDependencies['pob-babel'] ||
        pkg.devDependencies.next ||
        pkg.devDependencies['alp-dev'])) ||
    // alp-dev has pob-babel in dependencies
    (pkg.dependencies &&
      (pkg.dependencies['pob-babel'] ||
        pkg.dependencies.next ||
        pkg.devDependencies['alp-dev']))
  );

exports.hasReact = (pkg) =>
  !!(
    (pkg.dependencies && pkg.dependencies.react) ||
    (pkg.peerDependencies && pkg.peerDependencies.react)
  );

exports.hasJest = (pkg) => !!(pkg.devDependencies && pkg.devDependencies.jest);

function internalAddToObject(pkg, key, object) {
  if (typeof object !== 'object') {
    throw new TypeError(`Invalid type object ${typeof object} passed`);
  }

  if (!pkg[key]) {
    pkg[key] = {};
    exports.sort(pkg);
  }
  const value = pkg[key];
  if (typeof value !== 'object') {
    throw new TypeError(
      `Invalid type value ${typeof value} for package key "${key}"`,
    );
  }
  Object.assign(value, object);
  pkg[key] = sortObject(pkg[key]);
}

function internalRemoveFromObject(pkg, key, keys) {
  if (!pkg[key]) return;
  keys.forEach((k) => {
    delete pkg[key][k];
  });
  if (Object.keys(pkg[key]).length === 0) {
    delete pkg[key];
  }
}

exports.sort = function sort(pkg) {
  return sortPkg(pkg);
};

const cleanVersion = (version) => version.replace(/^(\^|~)/, '');

const internalRemoveDependencies = (pkg, type, dependencyKeys) => {
  if (pkg.name === 'pob-dependencies') return;
  internalRemoveFromObject(pkg, type, dependencyKeys);
};

const getVersionFromDependencyName = (dependency) =>
  pobDependencies[dependency];

const internalAddDependencies = (pkg, type, dependencies, cleaned, prefix) => {
  const ignoreDependencies =
    type === 'dependencies' ? {} : pkg.dependencies || {};
  const currentDependencies = pkg[type];
  const removeDependencies = [];

  const dependenciesToCheck = [];
  dependencies.forEach((dependency) => {
    if (ignoreDependencies[dependency] || pkg.name === dependency) {
      removeDependencies.push(dependency);
    } else {
      dependenciesToCheck.push(dependency);
    }
  });

  const filtredDependencies = {};
  if (!currentDependencies) {
    dependenciesToCheck.forEach((dependency) => {
      const potentialNewVersion = getVersionFromDependencyName(dependency);
      if (!potentialNewVersion) {
        throw new Error(`Missing pobDependency: ${dependency}`);
      }
      const getNewVersion = () =>
        cleaned ? cleanVersion(potentialNewVersion) : potentialNewVersion;
      filtredDependencies[dependency] = getNewVersion();
    });
  } else {
    dependenciesToCheck.forEach((dependency) => {
      const potentialNewVersion = getVersionFromDependencyName(dependency);
      if (!potentialNewVersion) {
        throw new Error(`Missing pobDependency: ${dependency}`);
      }
      const currentVersion = currentDependencies[dependency];
      const potentialNewVersionCleaned = cleanVersion(potentialNewVersion);
      const getNewVersion = () =>
        cleaned
          ? `${prefix || ''}${potentialNewVersionCleaned}`
          : potentialNewVersion;
      try {
        if (
          !currentVersion ||
          semver.gt(potentialNewVersionCleaned, cleanVersion(currentVersion))
        ) {
          filtredDependencies[dependency] = getNewVersion();
        } else if (
          potentialNewVersionCleaned === cleanVersion(currentVersion)
        ) {
          filtredDependencies[dependency] = getNewVersion();
        } else if (potentialNewVersion !== currentVersion) {
          console.warn(
            `dependency "${dependency}" has a higher version: expected ${potentialNewVersion}, actual: ${currentVersion}.`,
          );
        }
      } catch {
        filtredDependencies[dependency] = getNewVersion();
      }
    });
  }

  if (removeDependencies.length > 0) {
    internalRemoveDependencies(pkg, type, removeDependencies);
  }
  return internalAddToObject(pkg, type, filtredDependencies);
};

exports.addDependencies = function addDependencies(pkg, dependencies, prefix) {
  internalAddDependencies(pkg, 'dependencies', dependencies, !!prefix, prefix);
};

exports.removeDependencies = function removeDependencies(pkg, dependencies) {
  internalRemoveDependencies(pkg, 'dependencies', dependencies);
};

exports.addDependenciesMeta = function addDependenciesMeta(
  pkg,
  dependenciesMeta,
) {
  internalAddToObject(pkg, 'dependenciesMeta', dependenciesMeta);
};

exports.removeDependenciesMeta = function removeDependenciesMeta(
  pkg,
  dependenciesMetaKeys,
) {
  internalRemoveFromObject(pkg, 'dependenciesMeta', dependenciesMetaKeys);
};

exports.addOrRemoveDependenciesMeta = function addOrRemoveDependenciesMeta(
  pkg,
  condition,
  dependenciesMeta,
) {
  if (condition) {
    exports.addDependenciesMeta(pkg, dependenciesMeta);
  } else {
    exports.removeDependenciesMeta(pkg, Object.keys(dependenciesMeta));
  }
};

exports.addDevDependencies = function addDevDependencies(pkg, dependencies) {
  internalAddDependencies(pkg, 'devDependencies', dependencies, true);
};

exports.removeDevDependencies = function removeDevDependencies(
  pkg,
  dependencies,
  forceEvenIfInPeerDep,
) {
  internalRemoveDependencies(
    pkg,
    'devDependencies',
    pkg.peerDependencies && !forceEvenIfInPeerDep
      ? dependencies.filter((d) => !pkg.peerDependencies[d])
      : dependencies,
  );
};

exports.addOrRemoveDependencies = function addOrRemoveDependencies(
  pkg,
  condition,
  dependencies,
) {
  if (condition) return exports.addDependencies(pkg, dependencies);
  return exports.removeDependencies(pkg, dependencies);
};

exports.addOrRemoveDevDependencies = function addOrRemoveDevDependencies(
  pkg,
  condition,
  dependencies,
) {
  if (condition) return exports.addDevDependencies(pkg, dependencies);
  return exports.removeDevDependencies(pkg, dependencies);
};

exports.updateDevDependenciesIfPresent = function updateDevDependenciesIfPresent(
  pkg,
  dependencies,
) {
  if (!pkg.devDependencies) return;
  return exports.addDevDependencies(
    pkg,
    dependencies.filter((d) => pkg.devDependencies[d]),
  );
};

exports.addScripts = function addScripts(pkg, scripts) {
  internalAddToObject(pkg, 'scripts', scripts);
};

exports.removeScripts = function removeScripts(pkg, keys) {
  internalRemoveFromObject(pkg, 'scripts', keys);
};

exports.addOrRemoveScripts = function addOrRemoveScripts(
  pkg,
  condition,
  scripts,
) {
  if (condition) {
    exports.addScripts(pkg, scripts);
  } else {
    exports.removeScripts(pkg, Object.keys(scripts));
  }
};
