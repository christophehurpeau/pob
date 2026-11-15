import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { format } from "oxfmt";
import type { PobConfig, RawConfigSources } from "./config.ts";
import { resolveConfig } from "./config.ts";
import type {
  PackageContext,
  PobStep,
  RepoFacts,
  RunOptions,
} from "./context.ts";
import type { PlannedEffect } from "./effects.ts";
import { createEffectRegistry, orderEffects } from "./effects.ts";
import type { InitialFiles } from "./files.ts";
import { createDiskFiles } from "./files.ts";
import type { JsonObject, TrackedJson } from "./model.ts";
import { createTrackedJson } from "./model.ts";
import type { RenderedFile } from "./output.ts";
import { createOutputRegistry, resolveOutput } from "./output.ts";
import { createPkgModel } from "./pkg.ts";
import type { Plan, PlanEffect, PlannedFile } from "./plan.ts";
import { orderSteps } from "./step.ts";
import { createTracker } from "./tracker.ts";
import type { DependencyVersions } from "./versions.ts";
import { createDependencyVersions } from "./versions.ts";
import { discoverWorkspacePackages, getWorkspaceGlobs } from "./workspace.ts";

export interface PipelineOptions extends RunOptions {
  cwd: string;
  steps: readonly PobStep[];
  /** throw on undeclared accesses */
  strict: boolean;
  /** run only these steps, for partial ports */
  only?: readonly string[];
  versions?: DependencyVersions;
}

export interface PipelineResult {
  plan: Plan;
  /** effects with their run function, in order */
  effects: (PlannedEffect & { absoluteCwd: string })[];
  contexts: PackageContext[];
}

export const readConfigSources = (initial: InitialFiles): RawConfigSources => {
  const pkg = initial.readJson<JsonObject>("package.json");
  return {
    pobJson: initial.readJson("pob.json"),
    yoRc: initial.readJson<{ pob?: JsonObject }>(".yo-rc.json")?.pob,
    legacyPobJson: initial.readJson(".pob.json"),
    pkgPob: pkg?.pob as JsonObject | undefined,
  };
};

const hasPobConfig = (initial: InitialFiles): boolean =>
  ["pob.json", ".yo-rc.json", ".pob.json"].some((file) => initial.exists(file));

export const isMonorepoPkg = (pkg: JsonObject | undefined): boolean =>
  !!pkg && (getWorkspaceGlobs(pkg).length > 0 || !!pkg.lerna);

export const readOriginUrl = (dir: string): string | undefined => {
  try {
    return (
      execFileSync("git", ["config", "--get", "remote.origin.url"], {
        cwd: dir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || undefined
    );
  } catch {
    return undefined;
  }
};

/** The monorepo root containing a package directory, if any. */
export const findMonorepoRoot = (
  dir: string,
): { rootDir: string; rootPkg: JsonObject } | undefined => {
  let current = path.dirname(dir);
  for (;;) {
    const pkgPath = path.join(current, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as JsonObject;
      if (isMonorepoPkg(pkg)) return { rootDir: current, rootPkg: pkg };
    }
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
};

export interface CreateContextOptions {
  location: string;
  dir: string;
  initial?: InitialFiles;
  facts: Omit<RepoFacts, "packageManager" | "yarnNodeLinker">;
  rootConfig: PobConfig | undefined;
  versions: DependencyVersions;
  strict: boolean;
  options: RunOptions;
  warnings: string[];
}

export const createPackageContext = ({
  location,
  dir,
  initial = createDiskFiles(dir),
  facts,
  rootConfig,
  versions,
  strict,
  options,
  warnings,
}: CreateContextOptions): PackageContext => {
  const resolvedConfig = resolveConfig(readConfigSources(initial), {
    isRoot: facts.isRoot,
  });
  if (resolvedConfig.missing.length > 0) {
    throw new Error(
      `${location}: missing pob config: ${resolvedConfig.missing.join(", ")}`,
    );
  }
  const config = resolvedConfig.config;
  const projectConfig = (rootConfig ?? config).project;
  const tracker = createTracker({ strict });
  const models = new Map<string, TrackedJson>();
  const pkg = createPkgModel(
    initial.readJson<JsonObject>("package.json") ?? {},
    tracker,
    versions,
  );
  const output = createOutputRegistry(tracker);
  // package.json is always rendered, sorted and formatted, like
  // pob:core:sort-package did
  output.merged(
    "package.json",
    pkg,
    () => `${JSON.stringify(pkg.render(), null, 2)}\n`,
    { format: "oxfmt" },
  );
  return {
    location,
    dir,
    config,
    resolvedConfig,
    facts: {
      ...facts,
      packageManager: projectConfig.packageManager ?? "yarn",
      yarnNodeLinker: projectConfig.yarnNodeLinker,
    },
    initial,
    versions,
    tracker,
    pkg,
    model: (name, filePath, parse) => {
      const existing = models.get(name);
      if (existing) return existing;
      const content =
        filePath === undefined ? undefined : initial.read(filePath);
      const parseContent =
        parse ?? ((value) => JSON.parse(value) as JsonObject);
      const model = createTrackedJson(
        name,
        content === undefined ? {} : parseContent(content),
        tracker,
      );
      models.set(name, model);
      return model;
    },
    output,
    effects: createEffectRegistry(tracker),
    options,
    workspacePackages: [],
    warn: (message) => {
      warnings.push(location === "." ? message : `${location}: ${message}`);
    },
  };
};

export const runSteps = async (
  ctx: PackageContext,
  steps: readonly PobStep[],
): Promise<void> => {
  for (const step of steps) {
    if (step.when && !ctx.tracker.runAs(step, () => step.when?.(ctx))) continue;
    await ctx.tracker.runAsAsync(step, async () => {
      try {
        await step.run(ctx);
      } catch (error) {
        throw new Error(
          `${ctx.location === "." ? "" : `${ctx.location}: `}step "${step.name}" failed: ${(error as Error).message}`,
          { cause: error },
        );
      }
    });
  }
};

const joinLocation = (location: string, filePath: string): string =>
  location === "." ? filePath : path.posix.join(location, filePath);

const formatContent = async (
  filePath: string,
  content: string,
): Promise<string> => {
  const { code } = await format(filePath, content, { printWidth: 80 });
  return code;
};

export const renderContext = async (
  ctx: PackageContext,
): Promise<{ files: PlannedFile[]; warnings: string[] }> => {
  const files: PlannedFile[] = [];
  const warnings: string[] = [];
  const outputs = ctx.output.list();
  const rendered: RenderedFile[] = outputs.map((output) =>
    resolveOutput(output, ctx.initial),
  );
  /** steps whose writes changed the model: not the no-op removals */
  const modelWriters = (model: TrackedJson): string[] => [
    ...new Set(
      ctx.tracker
        .allRecords()
        .filter(
          (record) =>
            record.path[0] === model.name &&
            !record.path.includes("\0chain") &&
            !isDeepStrictEqual(
              record.value,
              model.initialValue(record.path.slice(1)),
            ),
        )
        .map((record) => record.step),
    ),
  ];
  for (const [index, result] of rendered.entries()) {
    const output = outputs[index];
    if (!output) continue;
    if (output.strategy === "merged") {
      result.owners = modelWriters(output.model);
    }
    const filePath = joinLocation(ctx.location, result.path);
    if (result.kind === "keep") {
      if (result.warning) warnings.push(result.warning);
      continue;
    }
    const before = ctx.initial.read(result.path);
    if (result.kind === "delete") {
      if (!ctx.initial.exists(result.path)) continue;
      files.push({
        path: filePath,
        op: "delete",
        directory: result.directory || undefined,
        transient: result.transient || undefined,
        before: result.directory ? undefined : before,
        strategy: result.strategy,
        owners: result.owners,
      });
      continue;
    }
    const after =
      output.format === "oxfmt"
        ? await formatContent(path.join(ctx.dir, result.path), result.content)
        : result.content;
    if (after === before) continue;
    files.push({
      path: filePath,
      op: before === undefined ? "create" : "modify",
      before,
      after,
      strategy: result.strategy,
      owners: result.owners,
    });
  }
  return { files, warnings };
};

const toPlanEffect = (
  effect: PlannedEffect,
  location: string,
): PlannedEffect & { absoluteCwd: string; planned: PlanEffect } => {
  const cwd = joinLocation(location, effect.cwd ?? ".");
  return {
    ...effect,
    absoluteCwd: cwd,
    planned: {
      id: effect.id,
      cwd,
      reasons: effect.reasons,
      owners: effect.owners,
      command: effect.command,
      after: [...(effect.after ?? [])],
      mayModify: (effect.mayModify ?? []).map((file) =>
        joinLocation(location, file),
      ),
    },
  };
};

/** Resolves, runs the steps, renders and plans. Writes nothing. */
export const runPipeline = async (
  pipelineOptions: PipelineOptions,
): Promise<PipelineResult> => {
  const { cwd, strict, check, fromPob } = pipelineOptions;
  const steps = orderSteps(pipelineOptions.steps).filter(
    (step) => !pipelineOptions.only || pipelineOptions.only.includes(step.name),
  );
  const versions = pipelineOptions.versions ?? createDependencyVersions();
  const options: RunOptions = { check, fromPob };
  const warnings: string[] = [];
  const originUrl = readOriginUrl(cwd);

  const rootInitial = createDiskFiles(cwd);
  const rootPkg = rootInitial.readJson<JsonObject>("package.json");
  if (!rootPkg) throw new Error(`No package.json in ${cwd}`);
  const isMonorepoRoot = isMonorepoPkg(rootPkg);
  const contexts: PackageContext[] = [];

  if (isMonorepoRoot) {
    const rootConfig = resolveConfig(readConfigSources(rootInitial), {
      isRoot: true,
    }).config;
    const packageContexts = discoverWorkspacePackages(cwd, rootPkg)
      .filter(({ location }) =>
        hasPobConfig(createDiskFiles(path.join(cwd, location))),
      )
      .map((workspacePackage) =>
        createPackageContext({
          location: workspacePackage.location,
          dir: path.join(cwd, workspacePackage.location),
          facts: {
            isMonorepoRoot: false,
            isRoot: false,
            originUrl,
            inMonorepo: {
              rootDir: cwd,
              relative: workspacePackage.location,
              rootPkg,
              rootConfig,
            },
          },
          rootConfig,
          versions,
          strict,
          options,
          warnings,
        }),
      );
    for (const ctx of packageContexts) await runSteps(ctx, steps);
    const rootContext = createPackageContext({
      location: ".",
      dir: cwd,
      facts: {
        isMonorepoRoot: true,
        isRoot: true,
        originUrl,
        inMonorepo: undefined,
      },
      rootConfig: undefined,
      versions,
      strict,
      options,
      warnings,
    });
    rootContext.workspacePackages = packageContexts;
    await runSteps(rootContext, steps);
    contexts.push(...packageContexts, rootContext);
  } else {
    const monorepoRoot = findMonorepoRoot(cwd);
    const rootConfig = monorepoRoot
      ? resolveConfig(
          readConfigSources(createDiskFiles(monorepoRoot.rootDir)),
          {
            isRoot: true,
          },
        ).config
      : undefined;
    const ctx = createPackageContext({
      location: ".",
      dir: cwd,
      facts: {
        isMonorepoRoot: false,
        isRoot: !monorepoRoot,
        originUrl,
        inMonorepo:
          monorepoRoot && rootConfig
            ? {
                rootDir: monorepoRoot.rootDir,
                relative: path
                  .relative(monorepoRoot.rootDir, cwd)
                  .split(path.sep)
                  .join("/"),
                rootPkg: monorepoRoot.rootPkg,
                rootConfig,
              }
            : undefined,
      },
      rootConfig,
      versions,
      strict,
      options,
      warnings,
    });
    await runSteps(ctx, steps);
    contexts.push(ctx);
  }

  const files: PlannedFile[] = [];
  const effects: (PlannedEffect & {
    absoluteCwd: string;
    planned: PlanEffect;
  })[] = [];
  for (const ctx of contexts) {
    const rendered = await renderContext(ctx);
    files.push(...rendered.files);
    warnings.push(...rendered.warnings);
    effects.push(
      ...ctx.effects.list().map((effect) => toPlanEffect(effect, ctx.location)),
    );
  }

  const orderedEffects = orderEffects(effects);
  return {
    plan: {
      files: files.toSorted((a, b) => a.path.localeCompare(b.path, "en")),
      effects: orderedEffects.map((effect) => effect.planned),
      warnings,
    },
    effects: orderedEffects.map((effect) => ({
      ...effect,
      absoluteCwd: path.join(cwd, effect.absoluteCwd),
    })),
    contexts,
  };
};

/** Writes the planned files, then runs the effects in order. */
export const applyPipelineResult = async (
  cwd: string,
  result: PipelineResult,
): Promise<void> => {
  for (const file of result.plan.files) {
    const absolutePath = path.join(cwd, file.path);
    if (file.op === "delete") {
      fs.rmSync(absolutePath, { recursive: true, force: true });
    } else {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, file.after ?? "");
    }
  }
  for (const effect of result.effects) {
    await effect.run({ cwd: effect.absoluteCwd });
  }
};
