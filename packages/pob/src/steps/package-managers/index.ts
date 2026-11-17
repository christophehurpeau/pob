import type { PobStep } from "../../engine/context.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { bunStep } from "./bun.ts";
import { installStep } from "./install.ts";
import { yarnLegacyPart } from "./legacy.ts";
import { pnpmStep } from "./pnpm.ts";
import { yarnStep } from "./yarn.ts";

/** yarn, pnpm, npm, bun */
export const packageManagersSteps: readonly PobStep[] = [
  bunStep,
  pnpmStep,
  yarnStep,
  installStep,
];

export const packageManagersLegacyParts: readonly LegacyPart[] = [
  yarnLegacyPart,
];
