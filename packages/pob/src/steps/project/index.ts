import type { PobStep } from "../../engine/context.ts";
import { appExpoStep, appStep, appViteStep } from "./app.ts";
import { docStep } from "./doc.ts";
import { libSideEffectsStep, libStep } from "./lib.ts";
import { npmStep } from "./npm.ts";
import { packageStep } from "./package.ts";
import { readmeStep } from "./readme.ts";

export { projectLegacyParts } from "./legacy.ts";

/** package, lib, app, app:vite, app:expo, npm, readme, doc */
export const projectSteps: readonly PobStep[] = [
  packageStep,
  libStep,
  libSideEffectsStep,
  appStep,
  appViteStep,
  appExpoStep,
  npmStep,
  docStep,
  readmeStep,
];
