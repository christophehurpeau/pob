/* eslint-disable complexity */

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
  const searchInExisting = searchIn.filter((type) => pkg[type]);

  for (const [depKey, range] of Object.entries(depPkg[depType])) {
    const versionsIn = searchInExisting.filter((type) => pkg[type][depKey]);

    if (versionsIn.length > 1) {
      reportError(
        `${depKey} is present in both devDependencies and dependencies, please place it only in dependencies`,
      );
    } else {
      const versions = versionsIn.map((type) => pkg[type][depKey]);

      versions.forEach((version, index) => {
        if (version.startsWith('file:')) return;

        if (semver.intersects(version, range)) {
          return;
        }

        // Ignore reporting duplicate when there's a resolution for it
        if (pkg.resolutions && pkg.resolutions[depKey]) {
          return;
        }

        const versionInType = versionsIn[index];
        const shouldWarns = onlyWarnsFor.includes(depKey);
        if (shouldWarns) warnedFor.add(depKey);

        reportError(
          `Invalid duplicate dependency "${depKey}": "${versions[0]}" (in ${versionInType}) should satisfies "${range}" from "${depPkg.name}" ${depType}`,
          shouldWarns,
        );
      });
    }
  }

  if (!warnedForInternal) {
    checkWarnedFor(reportError, onlyWarnsFor, warnedFor);
  }
};
