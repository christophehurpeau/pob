/**
 * Frozen cleanup of what older pob versions generated: files, package.json
 * keys and dependencies. Only grows: pob must converge any old project.
 */
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { coreLegacyParts } from "../core/index.ts";
import { monorepoLegacyParts } from "../monorepo/index.ts";
import { packageManagersLegacyParts } from "../package-managers/index.ts";
import { projectLegacyParts } from "../project/index.ts";
import { qualityLegacyParts } from "../quality/index.ts";
import { releaseLegacyParts } from "../release/index.ts";
import { transpilerLegacyParts } from "../transpiler/index.ts";
import { lintLegacyPart } from "./lint.ts";
import type { LegacyPart } from "./part.ts";

export const legacyParts: readonly LegacyPart[] = [
  lintLegacyPart,
  ...coreLegacyParts,
  ...packageManagersLegacyParts,
  ...qualityLegacyParts,
  ...releaseLegacyParts,
  ...transpilerLegacyParts,
  ...projectLegacyParts,
  ...monorepoLegacyParts,
];

export const legacyStep = defineStep<PackageContext>({
  name: "legacy",
  writes: [...new Set(legacyParts.flatMap((part) => part.writes))],
  run: (ctx) => {
    for (const part of legacyParts) part.run(ctx);
  },
});
