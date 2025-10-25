import { writeChangelogString } from "conventional-changelog-writer";
import type { BumperRecommendation } from "conventional-recommended-bump";
import type { PackageJson } from "type-fest";
import type { ConventionalChangelogConfig } from "./conventionalCommitConfigUtils.ts";
import type { Workspace } from "./packageUtils.ts";

const versions: BumperRecommendation["releaseType"][] = [
  "major",
  "minor",
  "patch",
];

export const recommendBump = async (
  commits: Parameters<ConventionalChangelogConfig["whatBump"]>[0],
  config: ConventionalChangelogConfig,
): Promise<Partial<BumperRecommendation>> => {
  const whatBump = config.whatBump;
  if (!whatBump) {
    throw new Error("whatBump method is missing in config");
  }
  const result = { ...(await whatBump(commits)) };

  return {
    ...result,
    releaseType: result.level != null ? versions[result.level] : undefined,
  };
};

export type Commits = Parameters<ConventionalChangelogConfig["whatBump"]>[0];

export const generateChangelog = (
  workspace: Workspace,
  pkg: PackageJson,
  config: ConventionalChangelogConfig,
  previousTag: string | null,
  newTag: string | null,
  commits: Commits | undefined,
  date: string,
  // eslint-disable-next-line @typescript-eslint/max-params
): Promise<string> => {
  if (!newTag) {
    throw new Error(`Missing new tag for package "${pkg.name ?? ""}"`);
  }

  const originUrl =
    typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  const match =
    originUrl &&
    typeof originUrl === "string" &&
    /^(?:git@|https?:\/\/)(?:([^./:]+(?:\.com)?)[/:])?([^/:]+)\/([^./:]+)(?:.git)?/.exec(
      originUrl,
    );
  const [, gitHost, gitAccount, repoName] = match || [
    undefined,
    undefined,
    undefined,
    undefined,
  ];

  return writeChangelogString(
    commits ?? [],
    {
      // @ts-expect-error - missing types
      previousTag,
      currentTag: newTag,
      linkCompare: previousTag != null,
      version: pkg.version,
      host: gitHost ? `https://${gitHost}` : undefined,
      owner: gitAccount,
      repository: repoName,
      date,
    },
    // @ts-expect-error - missing types
    config.writer,
  );
};
