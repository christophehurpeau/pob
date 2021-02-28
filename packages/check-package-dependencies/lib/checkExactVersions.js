'use strict';

const { createReportError } = require('./utils/createReportError');

exports.checkExactVersions = (pkg, pkgPath, type) => {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;

  const reportError = createReportError('Exact versions', pkgPath);

  for (const [depKey, version] of Object.entries(pkgDependencies)) {
    if (version.startsWith('^') || version.startsWith('~')) {
      reportError(
        `Unexpected range dependency in "${type}" for "${depKey}": "${version}" should be exact ("${version.slice(
          1,
        )}")`,
      );
      return;
    }
  }
};
