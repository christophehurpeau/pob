import fs from "node:fs";
import path from "node:path";
import type { JsonObject } from "../engine/model.ts";
import {
  askConfig,
  detectPromptFacts,
  readCurrentConfig,
  readJsonFile,
  writeJsonFile,
} from "./configPrompts.ts";
import type { Ask } from "./questions.ts";
import { createQuestionState } from "./questions.ts";
import type { CliIO } from "./update.ts";
import { consoleIO, runUpdate } from "./update.ts";

/** files of the repository that stay at the root of the monorepo */
const rootFiles = new Set([
  ".git",
  ".vscode",
  ".github",
  ".husky",
  ".git-hooks",
  ".cursor",
  ".yarn",
  ".yarnrc.yml",
  "eslint.config.js",
  "bun.lock",
  "pnpm-lock.yaml",
  ".prettierignore",
  "renovate.json",
  "packages",
  "lint-staged.config.js",
  "lint-staged.config.mjs",
  "yarn.lock",
]);

const WORKSPACES_GLOB = "packages/*";

export const createMonorepoPkg = (
  projectPkg: JsonObject,
  monorepoName: string,
): JsonObject => ({
  private: true,
  name: monorepoName,
  version: projectPkg.version,
  author: projectPkg.author,
  license: projectPkg.license,
  repository: projectPkg.repository,
  engines: projectPkg.engines,
  packageManager: projectPkg.packageManager,
  // the packages of a monorepo take the type of the root
  type: projectPkg.type,
  workspaces: [WORKSPACES_GLOB],
});

/**
 * The root takes the project config of the package, which applies to the
 * root, and a monorepo config set in advance, so that it can run without a TTY.
 */
const rootConfigKeys = ["project", "renovate", "monorepo"];

const createRootConfig = (packageConfig: JsonObject): JsonObject =>
  structuredClone(
    Object.fromEntries(
      Object.entries(packageConfig).filter(([key]) =>
        rootConfigKeys.includes(key),
      ),
    ),
  );

export interface MigrateToMonorepoOptions {
  cwd: string;
  ask?: Ask;
}

/**
 * Moves the project to packages/<name> and writes the monorepo root
 * package.json and pob.json. The config is asked before anything moves.
 */
export const moveToMonorepo = async ({
  cwd,
  ask,
}: MigrateToMonorepoOptions): Promise<void> => {
  const projectPkg = readJsonFile(path.join(cwd, "package.json"));
  if (!projectPkg) throw new Error(`No package.json in ${cwd}`);
  if (projectPkg.workspaces) {
    throw new Error("workspaces field already exists in package.json");
  }
  const name = projectPkg.name;
  if (typeof name !== "string" || !name) {
    throw new Error('package.json: "name" is missing');
  }
  const packageDir = path.join(cwd, "packages", name);
  if (fs.existsSync(packageDir)) {
    throw new Error(`packages/${name} already exists`);
  }

  const monorepoPkg = createMonorepoPkg(
    projectPkg,
    `${path.basename(cwd)}-monorepo`,
  );
  const facts = detectPromptFacts(cwd, monorepoPkg);
  facts.workspacePkgs = [projectPkg];
  const state = createQuestionState(
    createRootConfig(readCurrentConfig(cwd, true)),
    monorepoPkg,
    facts,
  );
  await askConfig({ state, location: ".", askOptional: true, ask });

  fs.mkdirSync(packageDir, { recursive: true });
  for (const filename of fs.readdirSync(cwd)) {
    if (rootFiles.has(filename)) continue;
    fs.renameSync(path.join(cwd, filename), path.join(packageDir, filename));
  }
  writeJsonFile(path.join(cwd, "package.json"), state.pkg);
  writeJsonFile(path.join(cwd, "pob.json"), state.config);
};

/** `pob migrate-to-monorepo` */
export const runMigrateToMonorepo = async (
  options: MigrateToMonorepoOptions,
  io: CliIO = consoleIO,
): Promise<number> => {
  await moveToMonorepo(options);
  return runUpdate(
    { cwd: options.cwd, check: false, json: false, fromPob: false },
    io,
  );
};
