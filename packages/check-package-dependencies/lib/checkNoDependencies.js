'use strict';

const { createReportError } = require('./utils/createReportError');

exports.checkNoDependencies = (
  pkg,
  pkgPath,
  type = 'dependencies',
  moveToSuggestion = 'devDependencies',
) => {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;

  const reportError = createReportError('No dependencies', pkgPath);
  reportError(
    `Unexpected ${type}, you should move them in ${moveToSuggestion}`,
  );
};
