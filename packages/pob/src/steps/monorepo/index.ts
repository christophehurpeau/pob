import type { PobStep } from "../../engine/context.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { monorepoBuildStep } from "./build.ts";
import { monorepoCleanStep } from "./clean.ts";
import { monorepoLegacyPart } from "./legacy.ts";
import { monorepoTypescriptStep } from "./typescript.ts";
import { monorepoWorkspacesStep } from "./workspaces.ts";

/** monorepo root: workspaces, typescript, lerna, build */
export const monorepoSteps: readonly PobStep[] = [
  monorepoWorkspacesStep,
  monorepoBuildStep,
  monorepoTypescriptStep,
  monorepoCleanStep,
];

export const monorepoLegacyParts: readonly LegacyPart[] = [monorepoLegacyPart];
