import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { ProjectConfig } from "../engine/config.ts";
import { getAtPath } from "../engine/tracker.ts";
import {
  askConfig,
  detectPromptFacts,
  readCurrentConfig,
  readJsonFile,
  writeJsonFile,
} from "./configPrompts.ts";
import type { Ask } from "./questions.ts";
import { createQuestionState, setAtPath } from "./questions.ts";
import type { CliIO } from "./update.ts";
import { consoleIO, runUpdate } from "./update.ts";

export interface InitOptions {
  cwd: string;
  /** `pob lib` / `pob app`: the project type when it is not set yet */
  type?: ProjectConfig["type"];
  ask?: Ask;
}

export interface InitResult {
  isMonorepoRoot: boolean;
}

/**
 * Asks the missing config and package.json keys, then writes pob.json and
 * package.json. The pipeline migrates the legacy config files away.
 */
export const writeInitConfig = async ({
  cwd,
  type,
  ask,
}: InitOptions): Promise<InitResult> => {
  const pkgPath = path.join(cwd, "package.json");
  const pkg = readJsonFile(pkgPath) ?? {};
  const facts = detectPromptFacts(cwd, pkg);
  const state = createQuestionState(
    readCurrentConfig(cwd, facts.isRoot),
    pkg,
    facts,
  );
  if (type && getAtPath(state.config, ["project", "type"]) === undefined) {
    setAtPath(state.config, ["project", "type"], type);
  }
  await askConfig({ state, location: ".", askOptional: true, ask });
  writeJsonFile(path.join(cwd, "pob.json"), state.config);
  if (!isDeepStrictEqual(state.pkg, pkg)) writeJsonFile(pkgPath, state.pkg);
  return { isMonorepoRoot: facts.isMonorepoRoot };
};

/** `pob init`, `pob lib`, `pob app` */
export const runInit = async (
  options: InitOptions,
  io: CliIO = consoleIO,
): Promise<number> => {
  const { isMonorepoRoot } = await writeInitConfig(options);
  const exitCode = await runUpdate(
    { cwd: options.cwd, check: false, json: false, fromPob: false },
    io,
  );
  if (isMonorepoRoot) {
    io.log("To create a new monorepo package:\n  pob add <packageName>");
  }
  return exitCode;
};
