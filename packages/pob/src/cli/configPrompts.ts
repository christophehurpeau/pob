import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { resolveConfig } from "../engine/config.ts";
import { createDiskFiles } from "../engine/files.ts";
import type { JsonObject } from "../engine/model.ts";
import {
  findMonorepoRoot,
  isMonorepoPkg,
  readConfigSources,
  readOriginUrl,
} from "../engine/pipeline.ts";
import { discoverWorkspacePackages } from "../engine/workspace.ts";
import { createReadlinePrompter } from "./prompt.ts";
import type { Ask, PromptFacts, QuestionState } from "./questions.ts";
import {
  MissingAnswersError,
  finalizeAnswers,
  questions,
  resolveQuestions,
} from "./questions.ts";

const readGitConfig = (dir: string, key: string): string | undefined => {
  try {
    return (
      execFileSync("git", ["config", "--get", key], {
        cwd: dir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || undefined
    );
  } catch {
    return undefined;
  }
};

export const readJsonFile = (filePath: string): JsonObject | undefined => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as JsonObject;
  } catch {
    return undefined;
  }
};

export const writeJsonFile = (filePath: string, value: unknown): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

/** The config of a directory, after the legacy migrations, possibly partial. */
export const readCurrentConfig = (dir: string, isRoot: boolean): JsonObject =>
  resolveConfig(readConfigSources(createDiskFiles(dir)), { isRoot })
    .config as unknown as JsonObject;

/** `dir` may not exist yet: a package `pob add` is about to create */
export const detectPromptFacts = (
  dir: string,
  pkg: JsonObject,
): PromptFacts => {
  const isMonorepoRoot = isMonorepoPkg(pkg);
  const monorepoRoot = isMonorepoRoot ? undefined : findMonorepoRoot(dir);
  const gitDir = monorepoRoot?.rootDir ?? dir;
  return {
    isRoot: !monorepoRoot,
    isMonorepoRoot,
    inMonorepo: !!monorepoRoot,
    rootPkg: monorepoRoot?.rootPkg,
    dirName: path.basename(dir),
    gitUser: {
      name: readGitConfig(gitDir, "user.name"),
      email: readGitConfig(gitDir, "user.email"),
    },
    hasOriginRemote: !!readOriginUrl(gitDir),
    workspacePkgs: isMonorepoRoot
      ? discoverWorkspacePackages(dir, pkg).map(
          ({ pkg: workspacePkg }) => workspacePkg,
        )
      : [],
    hasCiConfig:
      fs.existsSync(path.join(dir, ".circleci/config.yml")) ||
      fs.existsSync(path.join(dir, ".github/workflows")),
  };
};

export interface AskConfigOptions {
  state: QuestionState;
  /** where pob.json and package.json are written, for the error message */
  location: string;
  /** false: only the missing required keys are asked */
  askOptional: boolean;
  /** false: nothing is asked, even on a TTY (add --app) */
  interactive?: boolean;
  /** injected in tests; by default a readline prompt on a TTY, none otherwise */
  ask?: Ask;
  /** appended to the error listing the missing keys: how to run again */
  retryHint?: string;
}

/**
 * Fills the missing keys of the state: asked on a TTY, an error listing them
 * otherwise.
 */
export const askConfig = async ({
  state,
  location,
  askOptional,
  interactive = true,
  ask,
  retryHint,
}: AskConfigOptions): Promise<void> => {
  const prompter =
    interactive && !ask && process.stdin.isTTY
      ? createReadlinePrompter()
      : undefined;
  try {
    const missing = await resolveQuestions(questions, state, {
      ask: interactive ? (ask ?? prompter?.ask) : undefined,
      askOptional,
    });
    if (missing.length > 0) {
      const join = (file: string): string =>
        location === "." ? file : `${location}/${file}`;
      throw new MissingAnswersError(missing, {
        pobJsonPath: join("pob.json"),
        pkgPath: join("package.json"),
        retryHint,
      });
    }
  } finally {
    prompter?.close();
  }
  finalizeAnswers(state);
};
