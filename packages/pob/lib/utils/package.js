import sortObject from '@pob/sort-object';
import sortPkg from '@pob/sort-pkg';
import parseAuthor from 'parse-author';
import pobDependencies from 'pob-dependencies';
import semver from 'semver';
import {
  pobEslintConfig,
  pobEslintConfigTypescript,
  pobEslintConfigTypescriptReact,
} from './dependenciesPackages.cjs';

export { default as parseAuthor } from 'parse-author';

export const parsePkgAuthor = (pkg) =>
  typeof pkg.author === 'string' ? parseAuthor(pkg.author) : pkg.author;

export const hasLerna = (pkg) =>
  !!(pkg.devDependencies && pkg.devDependencies.lerna);

export const hasBabel = (pkg) =>
  !!(
    pkg.devDependencies &&
    (pkg.devDependencies['pob-babel'] || pkg.devDependencies['@babel/core'])
  );

export const transpileWithBabel = (pkg) =>
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

export const hasReact = (pkg) =>
  !!(
    (pkg.dependencies && pkg.dependencies.react) ||
    (pkg.peerDependencies && pkg.peerDependencies.react)
  );

export const sort = function sort(pkg) {
  return sortPkg(pkg);
};

function internalAddToObject(pkg, key, object) {
  if (typeof object !== 'object') {
    throw new TypeError(`Invalid type object ${typeof object} passed`);
  }

  if (!pkg[key]) {
    pkg[key] = {};
    sort(pkg);
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
  keys.filter(Boolean).forEach((k) => {
    delete pkg[key][k];
  });
  if (Object.keys(pkg[key]).length === 0) {
    delete pkg[key];
  }
}

const cleanVersion = (version) => version.replace(/^(\^|~)/, '');

const internalRemoveDependencies = (pkg, type, dependencyKeys) => {
  if (pkg.name === 'pob-dependencies') return;
  internalRemoveFromObject(pkg, type, dependencyKeys);
};

const getVersionFromDependencyName = (dependency) => {
  if (
    [
      // 'eslint-import-resolver-node',
      'eslint-plugin-import',
      'eslint-plugin-node',
      'eslint-plugin-unicorn',
    ].includes(dependency)
  ) {
    return pobEslintConfig.dependencies[dependency];
  }
  if (['eslint-plugin-jsx-a11y', 'eslint-plugin-react'].includes(dependency)) {
    return pobEslintConfigTypescriptReact.dependencies[dependency];
  }
  if (
    ['@typescript-eslint/eslint-plugin', '@typescript-eslint/parser'].includes(
      dependency,
    )
  ) {
    return pobEslintConfigTypescript.dependencies[dependency];
  }
  return pobDependencies[dependency];
};

const internalAddDependencies = (pkg, type, dependencies, cleaned, prefix) => {
  const ignoreDependencies =
    type === 'dependencies' ? {} : pkg.dependencies || {};
  const currentDependencies = pkg[type];
  const removeDependencies = [];

  const dependenciesToCheck = [];
  dependencies.filter(Boolean).forEach((dependency) => {
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

export function addDependencies(pkg, dependencies, prefix) {
  internalAddDependencies(pkg, 'dependencies', dependencies, !!prefix, prefix);
}

export function removeDependencies(pkg, dependencies) {
  internalRemoveDependencies(pkg, 'dependencies', dependencies);
}

export function addDependenciesMeta(pkg, dependenciesMeta) {
  internalAddToObject(pkg, 'dependenciesMeta', dependenciesMeta);
}

export function removeDependenciesMeta(pkg, dependenciesMetaKeys) {
  internalRemoveFromObject(pkg, 'dependenciesMeta', dependenciesMetaKeys);
}

export function addOrRemoveDependenciesMeta(pkg, condition, dependenciesMeta) {
  if (condition) {
    addDependenciesMeta(pkg, dependenciesMeta);
  } else {
    removeDependenciesMeta(pkg, Object.keys(dependenciesMeta));
  }
}

export function addDevDependencies(pkg, dependencies) {
  internalAddDependencies(pkg, 'devDependencies', dependencies, true);
}

export function removeDevDependencies(pkg, dependencies, forceEvenIfInPeerDep) {
  internalRemoveDependencies(
    pkg,
    'devDependencies',
    pkg.peerDependencies && !forceEvenIfInPeerDep
      ? dependencies.filter((d) => !pkg.peerDependencies[d])
      : dependencies,
  );
}

export function addOrRemoveDependencies(pkg, condition, dependencies) {
  if (condition) return addDependencies(pkg, dependencies);
  return removeDependencies(pkg, dependencies);
}

export function addOrRemoveDevDependencies(pkg, condition, dependencies) {
  if (condition) return addDevDependencies(pkg, dependencies);
  return removeDevDependencies(pkg, dependencies);
}

export function removeDevAndNotDevDependencies(
  pkg,
  dependencies,
  forceEvenIfInPeerDep,
) {
  removeDevDependencies(pkg, dependencies, forceEvenIfInPeerDep);
  removeDependencies(pkg, dependencies, forceEvenIfInPeerDep);
}

export function updateDevDependenciesIfPresent(pkg, dependencies) {
  if (!pkg.devDependencies) return;
  return addDevDependencies(
    pkg,
    dependencies.filter((d) => pkg.devDependencies[d]),
  );
}

export function addScripts(pkg, scripts) {
  internalAddToObject(pkg, 'scripts', scripts);
}

export function removeScripts(pkg, keys) {
  internalRemoveFromObject(pkg, 'scripts', keys);
}

export function addOrRemoveScripts(pkg, condition, scripts) {
  if (condition) {
    addScripts(pkg, scripts);
  } else {
    removeScripts(pkg, Object.keys(scripts));
  }
}
