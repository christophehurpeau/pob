import { parseArgs } from "node:util";
import { applyPipelineResult, runPipeline } from "./engine/pipeline.ts";
import { formatPlan, isPlanEmpty, serializePlan } from "./engine/plan.ts";
import { steps } from "./steps/index.ts";

const usage = `Usage: pob [monorepo] [lib|app|init]
       pob [monorepo] update [from-pob] [--check [--json]]
       pob add <packageName> [--app <appType> [--testing] [--e2e]]
       pob migrate-to-monorepo`;

const isStrict = (): boolean =>
  process.env.POB_STRICT === "1" ||
  process.env.NODE_ENV === "test" ||
  !!process.env.VITEST;

const main = async (): Promise<void> => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      check: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      force: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  const args =
    positionals[0] === "monorepo" || positionals[0] === "lerna"
      ? positionals.slice(1)
      : positionals;
  const action = args[0] ?? (values.check ? "update" : undefined);
  if (action !== "update") {
    console.error(`pob (pipeline engine): "${action ?? ""}" is not ported yet`);
    console.error(usage);
    process.exitCode = 1;
    return;
  }
  const fromPob = args[1] === "from-pob";
  const only = process.env.POB_STEPS?.split(",").filter(Boolean);

  const result = await runPipeline({
    cwd: process.cwd(),
    steps,
    strict: isStrict(),
    check: values.check,
    fromPob,
    only,
  });

  if (values.check) {
    if (values.json) console.log(serializePlan(result.plan));
    else if (!isPlanEmpty(result.plan)) console.log(formatPlan(result.plan));
    if (!isPlanEmpty(result.plan)) process.exitCode = 1;
    return;
  }

  for (const warning of result.plan.warnings) console.warn(warning);
  await applyPipelineResult(process.cwd(), result);
};

try {
  await main();
} catch (error: unknown) {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exitCode = 1;
}
