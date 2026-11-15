import type { PackageContext } from "../engine/context.ts";
import { runPipeline } from "../engine/pipeline.ts";
import { steps } from "../steps/index.ts";
import type { CliIO } from "./update.ts";
import { consoleIO } from "./update.ts";

export interface PackageConfigReport {
  location: string;
  source: PackageContext["resolvedConfig"]["source"];
  config: PackageContext["config"];
  facts: Omit<PackageContext["facts"], "inMonorepo"> & {
    inMonorepo: { rootDir: string; relative: string } | undefined;
  };
}

export const createConfigReport = (
  contexts: readonly PackageContext[],
): PackageConfigReport[] =>
  contexts.map((ctx) => ({
    location: ctx.location,
    source: ctx.resolvedConfig.source,
    config: ctx.config,
    facts: {
      ...ctx.facts,
      inMonorepo: ctx.facts.inMonorepo && {
        rootDir: ctx.facts.inMonorepo.rootDir,
        relative: ctx.facts.inMonorepo.relative,
      },
    },
  }));

/**
 * `pob config`: the resolved config of each package (after the legacy
 * migrations) and the repository facts, as JSON. No step runs.
 */
export const runShowConfig = async (
  { cwd }: { cwd: string },
  io: CliIO = consoleIO,
): Promise<number> => {
  const result = await runPipeline({
    cwd,
    steps,
    strict: false,
    check: true,
    fromPob: false,
    only: [],
  });
  io.log(JSON.stringify(createConfigReport(result.contexts), null, 2));
  return 0;
};
