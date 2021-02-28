'use strict';

const semver = require('semver');
const { createReportError } = require('./utils/createReportError');

exports.checkPeerDependencies = (
  pkg,
  pkgPath,
  type,
  allowedPeerIn,
  depPkg,
  onlyWarnsFor = [],
) => {
  if (!depPkg.peerDependencies) return;
  const reportError = createReportError('Peer Dependencies', pkgPath);
  const { peerDependencies, peerDependenciesMeta = {} } = depPkg;

  const pkgDependenciesList = allowedPeerIn
    .map((allowedType) => pkg[allowedType])
    .filter(Boolean);

  for (const [peerDepKey, range] of Object.entries(peerDependencies)) {
    const versions = pkgDependenciesList
      .map((d) => d[peerDepKey])
      .filter(Boolean);
    if (versions.length === 0) {
      if (
        peerDependenciesMeta[peerDepKey] &&
        peerDependenciesMeta[peerDepKey].optional
      ) {
        return;
      }
      reportError(
        `Missing "${peerDepKey}" peer dependency from "${depPkg.name}" in ${type}, it should satisfies "${range}"`,
        onlyWarnsFor.includes(peerDepKey),
      );
    } else if (versions.length > 1) {
      reportError(
        `${peerDepKey} is present in both devDependencies and dependencies, please place it only in dependencies`,
      );
    } else if (!semver.satisfies(semver.minVersion(versions[0]), range)) {
      reportError(
        `Invalid "${peerDepKey}" peer dependency from "${depPkg.name}" in ${type}: "${versions[0]}" should satisfies "${range}"`,
        onlyWarnsFor.includes(peerDepKey),
      );
    }
  }
};
