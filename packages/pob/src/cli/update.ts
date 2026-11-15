import type { PipelineResult } from "../engine/pipeline.ts";
import { applyPipelineResult, runPipeline } from "../engine/pipeline.ts";
import { formatPlan, isPlanEmpty, serializePlan } from "../engine/plan.ts";
import { steps } from "../steps/index.ts";

export interface CliIO {
  log: (message: string) => void;
  error: (message: string) => void;
}

export const consoleIO: CliIO = {
  log: (message) => {
    console.log(message);
  },
  error: (message) => {
    console.error(message);
  },
};

/** throw on undeclared accesses of the steps */
export const isStrict = (): boolean =>
  process.env.POB_STRICT === "1" ||
  process.env.NODE_ENV === "test" ||
  !!process.env.VITEST;

/** POB_STEPS: run only these steps, for partial ports and the harness */
export const getOnlySteps = (): string[] | undefined =>
  process.env.POB_STEPS?.split(",").filter(Boolean);

export interface UpdateOptions {
  cwd: string;
  /** print the plan, write nothing, run nothing */
  check: boolean;
  /** with check: print the plan as JSON */
  json: boolean;
  /** `update from-pob`: no install, no build */
  fromPob: boolean;
}

export const runUpdatePipeline = ({
  cwd,
  check,
  fromPob,
}: Omit<UpdateOptions, "json">): Promise<PipelineResult> =>
  runPipeline({
    cwd,
    steps,
    strict: isStrict(),
    check,
    fromPob,
    only: getOnlySteps(),
  });

/** Prints each effect before it runs: they can take a while. */
const withEffectLogs = (result: PipelineResult, io: CliIO): PipelineResult => ({
  ...result,
  effects: result.effects.map((effect) => ({
    ...effect,
    run: (context) => {
      io.log(`> ${effect.id}${effect.command ? `: ${effect.command}` : ""}`);
      return effect.run(context);
    },
  })),
});

export const applyResult = async (
  cwd: string,
  result: PipelineResult,
  io: CliIO,
): Promise<void> => {
  for (const warning of result.plan.warnings) io.error(`warning: ${warning}`);
  for (const file of result.plan.files) io.log(`${file.op} ${file.path}`);
  await applyPipelineResult(cwd, withEffectLogs(result, io));
};

/**
 * `pob update`: applies the plan, or prints it with --check. Returns the exit
 * code: 1 with --check when something would change.
 */
export const runUpdate = async (
  options: UpdateOptions,
  io: CliIO = consoleIO,
): Promise<number> => {
  const result = await runUpdatePipeline(options);
  if (!options.check) {
    await applyResult(options.cwd, result, io);
    return 0;
  }
  const empty = isPlanEmpty(result.plan);
  if (options.json) io.log(serializePlan(result.plan));
  else if (!empty) io.log(formatPlan(result.plan));
  else {
    for (const warning of result.plan.warnings) io.error(`warning: ${warning}`);
  }
  return empty ? 0 : 1;
};
