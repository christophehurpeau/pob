import type {
  PackageManager,
  PobConfig,
  ResolvedConfig,
  YarnNodeLinker,
} from "./config.ts";
import type { EffectRegistry } from "./effects.ts";
import type { InitialFiles } from "./files.ts";
import type { JsonObject, TrackedJson } from "./model.ts";
import type { OutputRegistry } from "./output.ts";
import type { PkgModel } from "./pkg.ts";
import type { Step } from "./step.ts";
import type { Tracker } from "./tracker.ts";
import type { DependencyVersions } from "./versions.ts";

/** Detected on every run, never stored. */
export interface RepoFacts {
  /** the root of a monorepo: its package.json has workspaces */
  isMonorepoRoot: boolean;
  /** a package of a monorepo, not its root */
  inMonorepo:
    | undefined
    | {
        rootDir: string;
        /** location of the package, relative to the root */
        relative: string;
        rootPkg: JsonObject;
        rootConfig: PobConfig;
      };
  /** standalone package or monorepo root */
  isRoot: boolean;
  /** of the root */
  packageManager: PackageManager;
  /** of the root */
  yarnNodeLinker: YarnNodeLinker | undefined;
  /** url of the origin remote */
  originUrl: string | undefined;
}

export interface RunOptions {
  /** print the plan, write nothing, run nothing */
  check: boolean;
  /** `update from-pob`: no install, no build */
  fromPob: boolean;
}

export interface MonorepoWorkspace {
  /** relative to the monorepo root, posix */
  location: string;
  /** package.json before pob runs */
  pkg: JsonObject;
  initial: InitialFiles;
  /**
   * undefined for a workspace without a pob config (pob does not update it),
   * and for every workspace when pob runs in a package
   */
  context: PackageContext | undefined;
}

export interface PackageContext {
  /** relative to the directory pob runs in, posix, "." for it */
  location: string;
  /** absolute */
  dir: string;
  config: PobConfig;
  resolvedConfig: ResolvedConfig;
  facts: RepoFacts;
  /** files before pob runs: reading them does not need a declaration */
  initial: InitialFiles;
  versions: DependencyVersions;
  tracker: Tracker;
  pkg: PkgModel;
  /**
   * A tracked model, created once per name: from the current content of a
   * merged config file, or empty without a file (`ci`, shared by steps).
   */
  model: (
    name: string,
    filePath?: string,
    parse?: (content: string) => JsonObject,
  ) => TrackedJson;
  output: OutputRegistry;
  effects: EffectRegistry;
  options: RunOptions;
  /** monorepo root: the contexts of its packages, after their steps ran */
  workspacePackages: PackageContext[];
  /**
   * monorepo package: the other workspaces, with or without a pob config. When
   * pob runs at the root, the packages run in topological order, so the steps
   * of a package's dependencies already ran (`context.stepsRan`).
   */
  siblingPackages: MonorepoWorkspace[];
  /** every step ran: the final outputs are known */
  stepsRan: boolean;
  /**
   * monorepo root: every workspace, with or without a pob config, in
   * topological order: for the detections over the whole monorepo (react,
   * storybook, publishable packages...).
   */
  monorepoWorkspaces: MonorepoWorkspace[];
  warn: (message: string) => void;
}

export type PobStep = Step<PackageContext>;
