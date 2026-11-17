import fs from "node:fs";
import path from "node:path";
import type { JsonObject } from "../engine/model.ts";
import { getWorkspaceGlobs } from "../engine/workspace.ts";
import {
  askConfig,
  detectPromptFacts,
  readJsonFile,
  writeJsonFile,
} from "./configPrompts.ts";
import type { Ask } from "./questions.ts";
import { createQuestionState } from "./questions.ts";
import type { CliIO } from "./update.ts";
import { consoleIO, runUpdate } from "./update.ts";

/** The name of a package directory: without the scope. */
export const getPackageDirectoryName = (packageName: string): string =>
  packageName.replace(/^@[^/]+\//, "");

/** In the first workspaces directory, named without the scope. */
export const getNewPackagePath = (
  workspaces: readonly string[],
  packageName: string,
): string => {
  const [firstWorkspace] = workspaces;
  if (firstWorkspace === undefined) {
    throw new Error("Missing workspaces field in package.json: not a monorepo");
  }
  return `${firstWorkspace.replace(/\/\*$/, "")}/${getPackageDirectoryName(packageName)}`;
};

export interface AddAppOptions {
  type: string;
  testing: boolean;
  e2e: boolean;
}

export interface AddOptions {
  cwd: string;
  packageName: string;
  /** --app: no prompts */
  app?: AddAppOptions;
  ask?: Ask;
}

export interface AddResult {
  /** relative to the monorepo root */
  packagePath: string;
}

/** app types built by the transpiler, which requires a build config */
const transpiledAppTypes = new Set(["node", "node-library", "alp-node"]);

/** The files a user may write in advance, when `add` cannot prompt. */
const presetFiles = ["pob.json", "package.json"];

/**
 * The pob.json and package.json written in advance in the package directory,
 * which may hold nothing else.
 */
const readPresetFiles = (
  packageDir: string,
  packagePath: string,
): { config: JsonObject; pkg: JsonObject } => {
  if (!fs.existsSync(packageDir)) return { config: {}, pkg: {} };
  if (
    fs.readdirSync(packageDir).some((entry) => !presetFiles.includes(entry))
  ) {
    throw new Error(`${packagePath} already exists`);
  }
  return {
    config: readJsonFile(path.join(packageDir, "pob.json")) ?? {},
    pkg: readJsonFile(path.join(packageDir, "package.json")) ?? {},
  };
};

const createAppConfig = (app: AddAppOptions): JsonObject => ({
  project: { type: "app" },
  app: { type: app.type, testing: app.testing, e2e: app.e2e },
  // an empty build: built without bundler, like the yeoman generator did
  ...(transpiledAppTypes.has(app.type) ? { build: {} } : {}),
});

/** Creates the package.json and pob.json of the new package. */
export const createPackage = async ({
  cwd,
  packageName,
  app,
  ask,
}: AddOptions): Promise<AddResult> => {
  const rootPkg = readJsonFile(path.join(cwd, "package.json"));
  const workspaces = rootPkg ? getWorkspaceGlobs(rootPkg) : [];
  if (workspaces.length === 0) {
    throw new Error("Missing workspaces field in package.json: not a monorepo");
  }
  const packagePath = getNewPackagePath(workspaces, packageName);
  const packageDir = path.join(cwd, packagePath);
  const preset = readPresetFiles(packageDir, packagePath);

  const config: JsonObject = app
    ? { ...preset.config, ...createAppConfig(app) }
    : preset.config;
  const pkg: JsonObject = {
    ...preset.pkg,
    name: packageName,
    version: preset.pkg.version ?? "1.0.0-pre",
    ...(app && { private: true }),
  };
  const state = createQuestionState(
    config,
    pkg,
    detectPromptFacts(packageDir, pkg),
  );
  await askConfig({
    state,
    location: packagePath,
    askOptional: !app,
    interactive: !app,
    ask,
    retryHint: `then run pob add ${packageName} again: it keeps ${packagePath}/pob.json and ${packagePath}/package.json`,
  });

  writeJsonFile(path.join(packageDir, "package.json"), state.pkg);
  writeJsonFile(path.join(packageDir, "pob.json"), state.config);
  return { packagePath };
};

/** `pob add <packageName>`: one pipeline run at the monorepo root */
export const runAdd = async (
  options: AddOptions,
  io: CliIO = consoleIO,
): Promise<number> => {
  const { packagePath } = await createPackage(options);
  io.log(`> Created ${packagePath}, updating the monorepo`);
  return runUpdate(
    { cwd: options.cwd, check: false, json: false, fromPob: false },
    io,
  );
};
