'use strict';

const { createReportError } = require('./utils/createReportError');

exports.checkIdenticalVersions = (
  pkg,
  pkgPath,
  type,
  deps,
  onlyWarnsFor = [],
) => {
  const pkgDependencies = pkg[type];
  const reportError = createReportError('Identical Versions', pkgPath);

  Object.keys(deps).forEach((depKey) => {
    const version = pkgDependencies[depKey];
    if (!version) {
      reportError(`Unexpected missing ${type} for "${depKey}".`);
      return;
    }

    deps[depKey].forEach((depKeyIdentical) => {
      const value = pkgDependencies[depKeyIdentical];
      if (!value) {
        reportError(
          `Missing "${depKeyIdentical}" in ${type}`,
          `it should be "${version}".`,
          onlyWarnsFor.includes(depKey),
        );
      }

      if (value !== version) {
        reportError(
          `Invalid "${depKeyIdentical}" in ${type}`,
          `expecting "${value}" be "${version}".`,
          onlyWarnsFor.includes(depKey),
        );
      }
    });
  });
};
