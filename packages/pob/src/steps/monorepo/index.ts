import type { PobStep } from "../../engine/context.ts";
import type { LegacyPart } from "../legacy/part.ts";

/** monorepo root: workspaces, typescript, lerna, build */
export const monorepoSteps: readonly PobStep[] = [];

export const monorepoLegacyParts: readonly LegacyPart[] = [];
