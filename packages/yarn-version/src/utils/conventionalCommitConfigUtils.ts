// eslint-disable-next-line import/no-unresolved
import { loadPreset } from "conventional-changelog-preset-loader";
import type { Preset } from "conventional-recommended-bump";
import { UsageError } from "./UsageError.ts";
import type { Workspace } from "./packageUtils.ts";

export type ConventionalChangelogConfig = Preset;

export const loadConventionalCommitConfig = async (
  rootWorkspace: Workspace,
  preset: string,
): Promise<ConventionalChangelogConfig> => {
  try {
    return await loadPreset<ConventionalChangelogConfig>(preset);
  } catch (error: any) {
    throw new UsageError(
      `Failed to require preset "${preset}": ${error.message as string}`,
    );
  }
};
