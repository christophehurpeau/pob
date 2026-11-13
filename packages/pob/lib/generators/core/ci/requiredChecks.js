import { latestLTS, maintenanceLTS } from "../../../utils/nodeVersions.js";

/**
 * Node major versions of the push workflow matrix. The single source for both
 * the workflow and the branch protection required checks, so a required check
 * always matches a job the workflow runs.
 */
export const getCiNodeMajorVersions = (onlyLatestLTS) =>
  onlyLatestLTS || maintenanceLTS === latestLTS
    ? [latestLTS]
    : [maintenanceLTS, latestLTS];

/**
 * Status check names reported by the push workflow, required by the branch
 * protection.
 */
export const getPushWorkflowRequiredChecks = ({
  splitJobs,
  checks,
  build,
  testing,
  nodeMajorVersions,
}) => [
  "reviewflow",
  ...(splitJobs
    ? [
        checks && "checks",
        build && "build",
        "lint",
        ...(testing
          ? nodeMajorVersions.map((version) => `test (${version})`)
          : []),
      ].filter(Boolean)
    : nodeMajorVersions.map((version) => `build (${version}.x)`)),
];
