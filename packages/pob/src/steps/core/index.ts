import type { PobStep } from "../../engine/context.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { claudeStep } from "./claude.ts";
import { cleanStep } from "./clean.ts";
import { editorconfigStep } from "./editorconfig.ts";
import { gitStep } from "./git.ts";
import { githubStep } from "./github.ts";
import { nodeStep, nodeTypesDependencyStep } from "./node.ts";
import {
  monorepoPackageToolingStep,
  pobBaseLegacyPart,
  vscodeLegacyPart,
} from "./pobBase.ts";
import { renovateStep } from "./renovate.ts";
import { vscodeStep } from "./vscode.ts";

/** editorconfig, node, clean, renovate, claude, vscode, git, github */
export const coreSteps: readonly PobStep[] = [
  editorconfigStep,
  cleanStep,
  claudeStep,
  renovateStep,
  vscodeStep,
  gitStep,
  githubStep,
  monorepoPackageToolingStep,
  nodeTypesDependencyStep,
  nodeStep,
];

export const coreLegacyParts: readonly LegacyPart[] = [
  pobBaseLegacyPart,
  vscodeLegacyPart,
];
