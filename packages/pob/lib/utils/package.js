/* eslint-disable no-param-reassign, max-lines, max-len */

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
  if (!pkg[key]) {
    pkg[key] = {};
    exports.sort(pkg);
  }
  const value = pkg[key];
  Object.assign(value, object);
  pkg[key] = sortObject(pkg[key]);
}

exports.sort = function sort(pkg) {
  return sortPkg(pkg);
};

const cleanVersion = (version) => version.replace(/^(\^|~)/, '');

const internalRemoveDependencies = (pkg, type, dependencies) => {
  if (pkg.name === 'pob-dependencies') return;
  if (!pkg[type]) return;
  dependencies.forEach((dependency) => {
    delete pkg[type][dependency];
  });
  if (Object.keys(pkg[type]).length === 0) {
    delete pkg[type];
  }
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
      } catch (err) {
        filtredDependencies[dependency] = getNewVersion();
      }
    });
  }

  if (removeDependencies.length !== 0) {
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

exports.addOrRemoveScripts = function addOrRemoveScripts(
  pkg,
  condition,
  scripts,
) {
  if (condition) {
    exports.addScripts(pkg, scripts);
    return;
  }

  if (pkg.scripts) {
    Object.keys(scripts).forEach((key) => {
      delete pkg.scripts[key];
    });
    if (Object.keys(pkg.scripts).length === 0) {
      delete pkg.scripts;
    }
  }
};

exports.addScript = function addScript(pkg, scriptName, value) {
  exports.addScripts(pkg, { [scriptName]: value });
};
