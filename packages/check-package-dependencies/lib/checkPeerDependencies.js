/* eslint-disable complexity */

'use strict';

const semver = require('semver');
const { createReportError } = require('./utils/createReportError');

exports.checkPeerDependencies = (
  pkg,
  pkgPathName,
  type,
  allowedPeerIn,
  depPkg,
  onlyWarnsFor = [],
) => {
  if (!depPkg.peerDependencies) return;
  const reportError = createReportError('Peer Dependencies', pkgPathName);
  const { peerDependencies, peerDependenciesMeta = {} } = depPkg;

  const allowedPeerInExisting = allowedPeerIn.filter((type) => pkg[type]);

  for (const [peerDepKey, range] of Object.entries(peerDependencies)) {
    const versionsIn = allowedPeerInExisting.filter(
      (type) => pkg[type][peerDepKey],
    );
    if (versionsIn.length === 0) {
      if (
        peerDependenciesMeta[peerDepKey] &&
        peerDependenciesMeta[peerDepKey].optional
      ) {
        return;
      }
      reportError(
        `Missing "${peerDepKey}" peer dependency from "${depPkg.name}" in ${type}`,
        `it should satisfies "${range}"`,
        onlyWarnsFor.includes(peerDepKey),
      );
    } else {
      const versions = versionsIn.map((type) => pkg[type][peerDepKey]);
      if (versions.length > 1) {
        reportError(
          `${peerDepKey} is present in both devDependencies and dependencies`,
          'place it only in dependencies',
        );
        return;
      }

      versions.forEach((version, index) => {
        if (!semver.satisfies(semver.minVersion(version), range)) {
          reportError(
            `Invalid "${peerDepKey}" peer dependency`,
            `"${version}" (in ${allowedPeerInExisting[index]}) should satisfies "${range}" from "${depPkg.name}" ${type}`,
            onlyWarnsFor.includes(peerDepKey),
          );
        }
      });
    }
  }
};
