import type { PobStep } from "../../engine/context.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { babelStep } from "./babel.ts";
import { babelLegacyPart, transpilerLegacyPart } from "./legacy.ts";
import { transpilerStep } from "./transpiler.ts";

/** babel, transpiler */
export const transpilerSteps: readonly PobStep[] = [babelStep, transpilerStep];

export const transpilerLegacyParts: readonly LegacyPart[] = [
  babelLegacyPart,
  transpilerLegacyPart,
];
