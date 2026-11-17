import type { PackageContext } from "../../engine/context.ts";

/**
 * Cleanup of what older pob versions generated, grouped by the yeoman
 * generator that held it. Every part runs in the single `legacy` step.
 */
export interface LegacyPart {
  /** the yeoman generator it comes from, for provenance */
  name: string;
  /** declared writes, merged into the writes of the legacy step */
  writes: readonly string[];
  run: (ctx: PackageContext) => void;
}
