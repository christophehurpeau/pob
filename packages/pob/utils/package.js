/* eslint-disable no-param-reassign, max-lines, max-len */
const semver = require('semver');
const parseAuthor = require('parse-author');
const pobDependencies = require('pob-dependencies');

exports.parseAuthor = parseAuthor;

exports.parsePkgAuthor = pkg => (typeof pkg.author === 'string' ? parseAuthor(pkg.author) : pkg.author);

exports.hasLerna = pkg => !!(pkg.devDependencies && pkg.devDependencies.lerna);

exports.hasBabel = pkg => !!(
  pkg.devDependencies &&
  (pkg.devDependencies['babel-core'] || pkg.devDependencies['pob-babel'] || pkg.devDependencies['@babel/core'])
);

exports.transpileWithBabel = pkg => !!(
  (pkg.devDependencies && (pkg.devDependencies['pob-babel'] || pkg.devDependencies['next'])) || (pkg.dependencies && pkg.dependencies['next'])
);

exports.hasReact = pkg => !!(
  (pkg.dependencies && pkg.dependencies.react) ||
  (pkg.peerDependencies && pkg.peerDependencies.react)
);

exports.hasDocumentation = pkg => !!(
  (pkg.devDependencies && pkg.devDependencies.typedoc)
);

exports.hasJest = pkg => !!(
  (pkg.devDependencies && pkg.devDependencies.jest)
);

function sortObject(obj, keys = []) {
  const objCopy = Object.assign({}, obj);
  const objKeys = Object.keys(obj);
  objKeys.forEach(key => delete obj[key]);
  keys
    .filter(key => Object.hasOwnProperty.call(objCopy, key))
    .concat(objKeys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())))
    .forEach(key => (obj[key] = objCopy[key]));
  return obj;
}

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
  return sortObject(pkg, [
    'name',
    'private',
    'version',
    'description',
    'keywords',
    'author',
    'contributors',
    'license',
    'repository',
    'homepage',
    'bugs',
    'preferGlobal',
    'engines',
    'engineStrict',
    'os',
    'cpu',
    'workspaces',
    'browserslist',
    'main',
    'types',
    'typesVersions',
    'jsnext:main',
    'module',
    'module-dev',
    'browser',
    'browser-dev',
    'browserify',
    'module:node',
    'module:node-dev',
    'module:browser',
    'module:browser-dev',
    'module:modern-browsers',
    'module:modern-browsers-dev',
    'module:aliases-node',
    'module:aliases-node-dev',
    'module:aliases-browser',
    'module:aliases-browser-dev',
    'module:aliases-modern-browsers',
    'module:aliases-modern-browsers-dev',
    'config',
    'style',
    'bin',
    'man',
    'directories',
    'files',
    'scripts',
    'husky',
    'lint-staged',
    'babel',
    'prettier',
    'commitlint',
    'eslintConfig',
    'stylelint',
    'jest',
    'dependencies',
    'peerDependencies',
    'devDependencies',
    'bundledDependencies',
    'bundleDependencies',
    'optionalDependencies',
    'resolutions',
  ]);
};

const cleanVersion = version => version.replace(/^(\^|~)/, '');


const internalRemoveDependencies = (pkg, type, dependencies) => {
  if (!pkg[type]) return;
  dependencies.forEach((dependency) => {
    delete pkg[type][dependency];
  });
  if (Object.keys(pkg[type]) === 0) {
    delete pkg[type];
  }
};

const internalAddDependencies = (pkg, type, dependencies, cleaned) => {
  const ignoreDependencies = type === 'dependencies' ? {} : (pkg.dependencies || {});
  const currentDependencies = pkg[type];
  const removeDependencies = [];

  const dependenciesToCheck = [];
  dependencies.forEach((dependency) => {
    if (ignoreDependencies[dependency]) {
      removeDependencies.push(dependency);
    } else {
      dependenciesToCheck.push(dependency);
    }
  });


  const filtredDependencies = !currentDependencies ? dependenciesToCheck : {};
  if (currentDependencies) {
    dependenciesToCheck.forEach((dependency) => {
      const potentialNewVersion = pobDependencies[dependency];
      const currentVersion = currentDependencies[dependency];
      const potentialNewVersionCleaned = cleanVersion(potentialNewVersion);
      const getNewVersion = () => cleaned ? potentialNewVersionCleaned : potentialNewVersion;
      try {
        if (
          !currentVersion ||
          semver.gt(potentialNewVersionCleaned, cleanVersion(currentVersion))
        ) {
          filtredDependencies[dependency] = getNewVersion();
        } else if (potentialNewVersionCleaned === cleanVersion(currentVersion)) {
          filtredDependencies[dependency] = getNewVersion();
        } else if (potentialNewVersion !== currentVersion) {
          console.warn(`dependency "${dependency}" has a higher version: expected ${potentialNewVersion}, actual: ${currentVersion}.`);
        }
      } catch (err) {
        filtredDependencies[dependency] = getNewVersion();
      }
    });
  }

  if (removeDependencies.length) internalRemoveDependencies(pkg, type, removeDependencies);
  return internalAddToObject(pkg, type, filtredDependencies);
};

exports.addDependencies = function addDependencies(pkg, dependencies) {
  internalAddDependencies(pkg, 'dependencies', dependencies);
};

exports.removeDependencies = function removeDependencies(pkg, dependencies) {
  internalRemoveDependencies(pkg, 'dependencies', dependencies);
};

exports.addDevDependencies = function addDevDependencies(pkg, dependencies) {
  internalAddDependencies(pkg, 'devDependencies', dependencies, true);
};

exports.removeDevDependencies = function removeDevDependencies(pkg, dependencies) {
  internalRemoveDependencies(pkg, 'devDependencies', dependencies);
};

exports.addOrRemoveDependencies = function addOrRemoveDependencies(pkg, condition, dependencies) {
  if (condition) return exports.addDependencies(pkg, dependencies);
  return exports.removeDependencies(pkg, Object.keys(dependencies));
};

exports.addOrRemoveDevDependencies = function addOrRemoveDevDependencies(pkg, condition, dependencies) {
  if (condition) return exports.addDevDependencies(pkg, dependencies);
  return exports.removeDevDependencies(pkg, Object.keys(dependencies));
};

exports.addScripts = function addScripts(pkg, scripts) {
  internalAddToObject(pkg, 'scripts', scripts);
};

exports.addOrRemoveScripts = function addOrRemoveScripts(pkg, condition, scripts) {
  if (condition) return exports.addScripts(pkg, scripts);
  else if (pkg.scripts) {
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
