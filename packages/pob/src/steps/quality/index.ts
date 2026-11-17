import type { PobStep } from "../../engine/context.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { ciStep } from "./ci.ts";
import { e2eStep } from "./e2e.ts";
import {
  ciLegacyPart,
  testingLegacyPart,
  typescriptLegacyPart,
} from "./legacy.ts";
import { testingStep } from "./testing.ts";
import { typescriptStep } from "./typescript.ts";

/** typescript, testing, e2e, ci */
export const qualitySteps: readonly PobStep[] = [
  typescriptStep,
  testingStep,
  e2eStep,
  ciStep,
];

export const qualityLegacyParts: readonly LegacyPart[] = [
  typescriptLegacyPart,
  testingLegacyPart,
  ciLegacyPart,
];
