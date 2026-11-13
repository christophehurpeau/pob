import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { load } from "js-yaml";
import { create as createMemFs } from "mem-fs";
import { create as createEditor } from "mem-fs-editor";
import { latestLTS, maintenanceLTS } from "../../../utils/nodeVersions.js";
import {
  getCiNodeMajorVersions,
  getPushWorkflowRequiredChecks,
} from "./requiredChecks.js";

const templatesPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "templates",
);

const renderPushWorkflow = ({ splitJobs, nodeMajorVersions }) => {
  const fs = createEditor(createMemFs());
  const destinationPath = path.join(templatesPath, "push.yml");
  fs.copyTpl(
    path.join(
      templatesPath,
      splitJobs
        ? "github-action-push-workflow-split.yml.ejs"
        : "github-action-push-workflow.yml.ejs",
    ),
    destinationPath,
    {
      packageManager: "pnpm",
      disableYarnGitCache: false,
      testing: true,
      testRunner: "vitest",
      e2eTesting: false,
      checks: true,
      documentation: false,
      build: true,
      typescript: true,
      codecov: true,
      nodeMajorVersions,
      isReleasePleaseEnabled: false,
      publishSinglePackage: false,
      publishMonorepo: false,
      nodeLatestMajorVersion: latestLTS,
      installPlaywrightBrowserCommand: "",
      mongodbBinaryCacheKeyFile: "",
      packageManagerRun: (script) => `pnpm run ${script}`,
      packageManagerExec: (command) => `pnpm exec ${command}`,
    },
  );
  return load(fs.read(destinationPath));
};

/** Status check names GitHub reports for the jobs of a workflow. */
const getWorkflowCheckNames = (workflow) =>
  Object.entries(workflow.jobs).flatMap(([jobId, job]) => {
    const nodeVersions = job.strategy?.matrix?.["node-version"];
    return nodeVersions
      ? nodeVersions.map((version) => `${jobId} (${version})`)
      : [jobId];
  });

describe("getCiNodeMajorVersions", () => {
  it("only runs the latest LTS when the package only supports it", () => {
    expect(getCiNodeMajorVersions(true)).toEqual([latestLTS]);
  });

  it("runs the maintenance and latest LTS otherwise", () => {
    expect(getCiNodeMajorVersions(false)).toEqual(
      maintenanceLTS === latestLTS ? [latestLTS] : [maintenanceLTS, latestLTS],
    );
  });
});

describe("getPushWorkflowRequiredChecks", () => {
  it("requires the latest LTS build when the package only supports it", () => {
    expect(
      getPushWorkflowRequiredChecks({
        splitJobs: false,
        checks: true,
        build: true,
        testing: true,
        nodeMajorVersions: getCiNodeMajorVersions(true),
      }),
    ).toEqual(["reviewflow", `build (${latestLTS}.x)`]);
  });

  for (const splitJobs of [false, true]) {
    for (const onlyLatestLTS of [false, true]) {
      it(`only requires checks the push workflow reports (splitJobs: ${splitJobs}, onlyLatestLTS: ${onlyLatestLTS})`, () => {
        const nodeMajorVersions = getCiNodeMajorVersions(onlyLatestLTS);
        const workflowCheckNames = getWorkflowCheckNames(
          renderPushWorkflow({ splitJobs, nodeMajorVersions }),
        );
        const requiredChecks = getPushWorkflowRequiredChecks({
          splitJobs,
          checks: true,
          build: true,
          testing: true,
          nodeMajorVersions,
        });

        expect(requiredChecks[0]).toBe("reviewflow");
        expect(workflowCheckNames).toEqual(
          expect.arrayContaining(requiredChecks.slice(1)),
        );
      });
    }
  }
});
