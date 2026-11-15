import type { PobStep } from "../engine/context.ts";
import { gitignoreStep } from "./gitignore.ts";
import { legacyStep } from "./legacy.ts";
import { lintStep } from "./lint.ts";

/**
 * Every step. The order here only breaks ties: the run order is inferred from
 * the reads and writes of each step.
 */
export const steps: readonly PobStep[] = [legacyStep, gitignoreStep, lintStep];
