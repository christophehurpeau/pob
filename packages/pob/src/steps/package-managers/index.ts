import type { PobStep } from "../../engine/context.ts";
import type { LegacyPart } from "../legacy/part.ts";

/** yarn, pnpm, npm, bun */
export const packageManagersSteps: readonly PobStep[] = [];

export const packageManagersLegacyParts: readonly LegacyPart[] = [];
