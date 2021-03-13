'use strict';

const semver = require('semver');
const { createReportError } = require('./utils/createReportError');

exports.checkSatisfiesVersionsFromDependency = (
  pkg,
  pkgPathName,
  type,
  depKeys,
  depPkg,
  dependencies,
  onlyWarnsFor = [],
) => {
  const pkgDependencies = pkg[type];
  const reportError = createReportError(
    `Satisfies Versions from ${depPkg.name}`,
    pkgPathName,
  );

  depKeys.forEach((depKey) => {
    const range = dependencies[depKey];
    if (!range) {
      throw new Error(
        `Unexpected missing dependency range in "${depPkg.name}" for "${depKey}".`,
      );
    }

    const version = pkgDependencies[depKey];

    if (!version) {
      reportError(
        `Missing "${depKey}" in ${type}`,
        `should satisfies "${range}" from "${depPkg.name}" ${depKey}.`,
        onlyWarnsFor.includes(depKey),
      );
    } else if (!semver.satisfies(semver.minVersion(version), range)) {
      reportError(
        `Invalid "${depKey}" in ${type}`,
        `"${version}" (in "${depKey}") should satisfies "${range}" from "${depPkg.name}" ${depKey}.`,
        onlyWarnsFor.includes(depKey),
      );
    }
  });
};
