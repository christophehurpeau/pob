import type { Readable } from "node:stream";
import { text } from "node:stream/consumers";
import conventionalChangelogCore from "conventional-changelog-core";
import type { Commit } from "conventional-commits-parser";
import type { BumperRecommendation } from "conventional-recommended-bump";
import type { PackageJson } from "type-fest";
import type { ConventionalChangelogConfig } from "./conventionalCommitConfigUtils";
import type { Workspace } from "./packageUtils";

const versions: BumperRecommendation["releaseType"][] = [
  "major",
  "minor",
  "patch",
];
export const recommendBump = async (
  commits: Commit[],
  config: ConventionalChangelogConfig,
): Promise<BumperRecommendation> => {
  const whatBump = config.whatBump;
  if (!whatBump) {
    throw new Error("whatBump method is missing in config");
  }
  let result: BumperRecommendation = { ...(await whatBump(commits)) };
  if (result.level != null) {
    result.releaseType = versions[result.level];
  } else if (result == null) {
    result = {};
  }

  return result;
};

export const generateChangelog = (
  workspace: Workspace,
  pkg: PackageJson,
  config: ConventionalChangelogConfig,
  newTag: string | null,
  {
    previousTag = "",
    verbose = false,
    tagPrefix = "v",
    path = "",
    lernaPackage,
  }: {
    previousTag?: string;
    verbose?: boolean;
    tagPrefix?: string;
    path?: string;
    lernaPackage?: string;
  } = {},
  // eslint-disable-next-line @typescript-eslint/max-params
): Promise<string> => {
  if (!newTag) throw new Error("Missing new tag");
  const stream: Readable = conventionalChangelogCore(
    {
      cwd: workspace.cwd,
      config,
      pkg,
      path,
      append: !!previousTag,
      releaseCount: !previousTag ? 0 : 1,
      skipUnstable: true,
      lernaPackage,
      tagPrefix,
      verbose,
      previousTag,
      currentTag: newTag,
    },
    {
      version: pkg.version,
      currentTag: newTag,
      previousTag,
    },
    // @ts-expect-error -- path is required to filter commits by path. It does not work if it is only provided in options.
    {
      path,
    },
  );

  return text(stream);
};
