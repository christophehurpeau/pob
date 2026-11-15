import { latestLTS, maintenanceLTS } from "../../utils/misc.ts";

/**
 * Node major versions of the push workflow matrix. The single source for both
 * the workflow and the branch protection required checks, so a required check
 * always matches a job the workflow runs.
 */
export const getCiNodeMajorVersions = (onlyLatestLTS: boolean): string[] =>
  onlyLatestLTS || (maintenanceLTS as string) === latestLTS
    ? [latestLTS]
    : [maintenanceLTS, latestLTS];

export interface PushWorkflowChecksOptions {
  splitJobs: boolean;
  checks: boolean;
  build: boolean;
  testing: boolean;
  nodeMajorVersions: readonly string[];
}

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
}: PushWorkflowChecksOptions): string[] => [
  "reviewflow",
  ...(splitJobs
    ? [
        ...(checks ? ["checks"] : []),
        ...(build ? ["build"] : []),
        "lint",
        ...(testing
          ? nodeMajorVersions.map((version) => `test (${version})`)
          : []),
      ]
    : nodeMajorVersions.map((version) => `build (${version}.x)`)),
];
