/* eslint-disable no-param-reassign */
const semver = require('semver');
const parseAuthor = require('parse-author');

exports.parseAuthor = parseAuthor;

exports.parsePkgAuthor = pkg => (typeof pkg.author === 'string' ? parseAuthor(pkg.author) : pkg.author);

exports.hasLerna = pkg => !!(pkg.devDependencies && pkg.devDependencies.lerna);

exports.hasBabel = pkg => !!(
  pkg.devDependencies &&
  (pkg.devDependencies['babel-core'] || pkg.devDependencies['pob-babel'])
);

exports.hasReact = pkg => !!(
  (pkg.dependencies && pkg.dependencies.react) ||
  (pkg.peerDependencies && pkg.peerDependencies.react)
);

exports.hasDocumentation = pkg => !!(
  (pkg.devDependencies && pkg.devDependencies.jsdoc)
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
    'browserslist',
    'main',
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
    'scripts',
    'directories',
    'files',
    'lint-staged',
    'babel',
    'eslintConfig',
    'stylelint',
    'jest',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'bundledDependencies',
    'bundleDependencies',
    'optionalDependencies',
  ]);
};

const cleanVersion = version => version.replace(/^(\^|~)/, '');


const internalRemoveDependencies = (pkg, type, dependencies) => {
  dependencies.forEach(dependency => delete pkg[type][dependency]);
};

const internalAddDependencies = (pkg, type, dependencies) => {
  const ignoreDependencies = type === 'dependencies' ? {} : (pkg.dependencies || {});
  const currentDependencies = pkg[type];
  const removeDependencies = [];

  const dependenciesToCheck = {};
  Object.keys(dependencies).forEach((dependency) => {
    if (ignoreDependencies[dependency]) {
      removeDependencies.push(dependency);
    } else {
      dependenciesToCheck[dependency] = dependencies[dependency];
    }
  });


  const filtredDependencies = !currentDependencies ? dependenciesToCheck : {};
  if (currentDependencies) {
    Object.keys(dependenciesToCheck).forEach((dependency) => {
      const potentialNewVersion = dependencies[dependency];
      const currentVersion = currentDependencies[dependency];
      try {
        if (
          !currentVersion ||
          semver.gt(cleanVersion(potentialNewVersion), cleanVersion(currentVersion))
        ) {
          filtredDependencies[dependency] = potentialNewVersion;
        } else if (potentialNewVersion !== currentVersion) {
          console.warn(`dependency "${dependency}" has a higher version: expected ${potentialNewVersion}, actual: ${currentVersion}.`);
        }
      } catch (err) {
        filtredDependencies[dependency] = potentialNewVersion;
      }
    });
  }

  if (removeDependencies.length) internalRemoveDependencies(pkg, type, removeDependencies);
  return internalAddToObject(pkg, type, filtredDependencies);
};

exports.addDependencies = function addDependencies(pkg, dependencies) {
  internalAddDependencies(pkg, 'dependencies', dependencies);
};

exports.addDependency = function addDependency(pkg, dependency, version) {
  exports.addDependencies(pkg, { [dependency]: version });
};

exports.removeDependencies = function removeDependencies(pkg, dependencies) {
  internalRemoveDependencies(pkg, 'dependencies', dependencies);
};

exports.removeDependency = function removeDependency(pkg, dependency) {
  exports.removeDependencies(pkg, [dependency]);
};

exports.addDevDependencies = function addDevDependencies(pkg, dependencies) {
  internalAddDependencies(pkg, 'devDependencies', dependencies);
};

exports.addDevDependency = function addDevDependency(pkg, dependency, version) {
  exports.addDevDependencies(pkg, { [dependency]: version });
};

exports.removeDevDependencies = function removeDevDependencies(pkg, dependencies) {
  internalRemoveDependencies(pkg, 'devDependencies', dependencies);
};

exports.removeDevDependency = function removeDevDependency(pkg, dependency) {
  exports.removeDevDependencies(pkg, [dependency]);
};

exports.addScripts = function addScripts(pkg, scripts) {
  internalAddToObject(pkg, 'scripts', scripts);
};

exports.addScript = function addScript(pkg, scriptName, value) {
  exports.addScripts(pkg, { [scriptName]: value });
};
