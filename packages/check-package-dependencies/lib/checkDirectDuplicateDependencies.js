'use strict';

const semver = require('semver');
const { createReportError } = require('./utils/createReportError');

const checkWarnedFor = (reportError, onlyWarnsFor, warnedFor) => {
  onlyWarnsFor.forEach((depName) => {
    if (!warnedFor.has(depName)) {
      reportError(
        `Invalid "${depName}" in "onlyWarnsFor" but no warning was raised`,
      );
    }
  });
};

exports.checkWarnedFor = checkWarnedFor;

exports.checkDirectDuplicateDependencies = (
  pkg,
  pkgPath,
  depType,
  searchIn,
  depPkg,
  onlyWarnsFor = [],
  warnedForInternal,
) => {
  if (!depPkg[depType]) return;

  const warnedFor = warnedForInternal || new Set();

  const reportError = createReportError(
    'Direct Duplicate Dependencies',
    pkgPath,
  );
  const pkgDependenciesList = searchIn
    .map((searchInType) => pkg[searchInType])
    .filter(Boolean);

  for (const [depKey, range] of Object.entries(depPkg[depType])) {
    const versions = pkgDependenciesList.map((d) => d[depKey]).filter(Boolean);
    if (versions.length > 1) {
      reportError(
        `${depKey} is present in both devDependencies and dependencies, please place it only in dependencies`,
      );
    } else if (
      versions[0] &&
      !versions[0].startsWith('file:') &&
      !semver.satisfies(semver.minVersion(versions[0]), range)
    ) {
      // Ignore reporting duplicate when there's a resolution for it
      if (!pkg.resolutions || !pkg.resolutions[depKey]) {
        const shouldWarns = onlyWarnsFor.includes(depKey);
        if (shouldWarns) warnedFor.add(depKey);

        reportError(
          `Invalid "${depKey}" duplicate dependency from "${depPkg.name}" in ${depType}: "${versions[0]}" should satisfies "${range}"`,
          shouldWarns,
        );
      }
    }
  }

  if (!warnedForInternal) {
    checkWarnedFor(reportError, onlyWarnsFor, warnedFor);
  }
};
