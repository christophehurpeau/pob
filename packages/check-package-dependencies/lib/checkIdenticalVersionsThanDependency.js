'use strict';

const { createReportError } = require('./utils/createReportError');

exports.checkIdenticalVersionsThanDependency = (
  pkg,
  pkgPath,
  type,
  depKeys,
  depPkg,
  dependencies,
  onlyWarnsFor = [],
) => {
  const pkgDependencies = pkg[type];
  const reportError = createReportError(
    `Same Versions than ${depPkg.name}`,
    pkgPath,
  );

  depKeys.forEach((depKey) => {
    const version = dependencies[depKey];
    if (!version) {
      reportError(
        `Unexpected missing dependency version in "${depPkg.name}" for "${depKey}".`,
      );
      return;
    }

    if (version.startsWith('^') || version.startsWith('~')) {
      reportError(
        `Unexpected range dependency in "${depPkg.name}" for "${depKey}"`,
        'perhaps use checkSatisfiesVersionsFromDependency() instead.',
      );
      return;
    }

    const value = pkgDependencies[depKey];

    if (!value) {
      reportError(
        `Missing "${depKey}" in ${type}`,
        `expecting to be "${version}".`,
        onlyWarnsFor.includes(depKey),
      );
    }

    if (value !== version) {
      reportError(
        `Invalid "${depKey}" in ${type}`,
        `expecting "${value}" to be "${version}".`,
        onlyWarnsFor.includes(depKey),
      );
    }
  });
};
