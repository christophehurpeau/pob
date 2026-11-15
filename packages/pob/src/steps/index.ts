import type { PobStep } from "../engine/context.ts";
import { coreSteps } from "./core/index.ts";
import { gitignoreStep } from "./gitignore.ts";
import { legacyStep } from "./legacy/index.ts";
import { lintStep } from "./lint.ts";
import { monorepoSteps } from "./monorepo/index.ts";
import { packageManagersSteps } from "./package-managers/index.ts";
import { projectSteps } from "./project/index.ts";
import { qualitySteps } from "./quality/index.ts";
import { releaseSteps } from "./release/index.ts";
import { transpilerSteps } from "./transpiler/index.ts";

/**
 * Every step. The order here only breaks ties: the run order is inferred from
 * the reads and writes of each step.
 */
export const steps: readonly PobStep[] = [
  legacyStep,
  gitignoreStep,
  lintStep,
  ...coreSteps,
  ...packageManagersSteps,
  ...qualitySteps,
  ...releaseSteps,
  ...transpilerSteps,
  ...projectSteps,
  ...monorepoSteps,
];
