import type { PobStep } from "../../engine/context.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { huskyStep } from "./husky.ts";
import {
  huskyLegacyPart,
  oldDependenciesLegacyPart,
  releaseLegacyPart,
} from "./legacy.ts";
import { releaseStep } from "./release.ts";

/** husky, release, old dependencies */
export const releaseSteps: readonly PobStep[] = [huskyStep, releaseStep];

export const releaseLegacyParts: readonly LegacyPart[] = [
  huskyLegacyPart,
  releaseLegacyPart,
  oldDependenciesLegacyPart,
];
