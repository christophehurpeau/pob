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

/** In the first workspaces directory, named without the scope. */
export const getNewPackagePath = (
  workspaces: readonly string[],
  packageName: string,
): string => {
  const [firstWorkspace] = workspaces;
  if (firstWorkspace === undefined) {
    throw new Error("Missing workspaces field in package.json: not a monorepo");
  }
  return `${firstWorkspace.replace(/\/\*$/, "")}/${packageName.replace(/^@[^/]+\//, "")}`;
};

export interface AddAppOptions {
  type: string;
  testing: boolean;
  e2e: boolean;
}

export interface AddOptions {
  cwd: string;
  packageName: string;
  /** --app: no prompts, except for required keys still missing */
  app?: AddAppOptions;
  ask?: Ask;
}

export interface AddResult {
  /** relative to the monorepo root */
  packagePath: string;
}

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
  if (fs.existsSync(packageDir)) {
    throw new Error(`${packagePath} already exists`);
  }

  const config: JsonObject = app
    ? {
        project: { type: "app" },
        app: { type: app.type, testing: app.testing, e2e: app.e2e },
      }
    : {};
  const pkg: JsonObject = {
    name: packageName,
    version: "1.0.0-pre",
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
    ask,
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
